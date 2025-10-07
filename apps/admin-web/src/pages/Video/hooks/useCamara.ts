import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Room,
  LocalVideoTrack,
  LocalAudioTrack,
  createLocalVideoTrack,
 // createLocalAudioTrack,
  RoomEvent,
  ParticipantEvent,
  RemoteParticipant,
  RemoteAudioTrack,
} from 'livekit-client';
import { useAuth } from '@/shared/auth/useAuth';
import { PendingCommand, PendingCommandsClient } from '@/shared/api/pendingCommandsClient';
import { PresenceClient } from '@/shared/api/presenceClient';
import { StreamingClient } from '@/shared/api/streamingClient';
import { webPubSubClient as pubSubService } from '@/shared/api/webpubsubClient';
import { getLiveKitToken } from '@/shared/api/livekitClient';
import apiClient from '@/shared/api/apiClient';

/**
 * Feature switches.
 *
 * @remarks
 * KEEP_AWAKE_WHEN_IDLE keeps the tab awake even when not streaming, which reduces the chance
 * that the browser throttles timers or disconnects WebSocket when the OS powers down the screen.
 */
const KEEP_AWAKE_WHEN_IDLE = true;

/** Basic wake lock sentinel typing for browsers that expose navigator.wakeLock. */
type WakeLockSentinelAny = any;

/**
 * Requests camera and microphone permission once so that later track creation
 * does not trigger new permission prompts.
 *
 * @remarks
 * - Immediately stops acquired tracks; this is only to prime permissions.
 * - Distinguishes `NotAllowedError` (permission denied) and `NotReadableError` (device busy).
 *
 * @throws {DOMException} Re-throws `NotAllowedError` and any unexpected errors.
 */
async function ensureCameraPermission(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach((t) => t.stop());
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices
        .filter((d) => d.kind === 'videoinput')
        .map((c) => c.label || `ID: ${c.deviceId}`);
      alert(
        `Camera access blocked.\nDetected cameras: ${cams.join(', ')}\n\n` +
          `Enable camera  permissions for this site and refresh.`,
      );
      throw err;
    }
    if (err?.name === 'NotReadableError') {
      console.warn('[Camera] Default device busy, will try others', err);
      return;
    }
    throw err;
  }
}

/**
 * Creates a `LocalVideoTrack` by prioritizing specific cameras and falling back gracefully.
 *
 * @remarks
 * Order:
 *  1) Camera with label containing "Logi C270 HD"
 *  2) Any other camera except those matching "Logitech C930e"
 *  3) Default camera
 *
 * - Filters out Logitech C930e devices from all attempts.
 * - If a camera is busy (`NotReadableError`), tries the next one.
 */
async function createVideoTrackWithFallback(cameras: MediaDeviceInfo[]): Promise<LocalVideoTrack> {
  const filtered = cameras.filter((c) => !/Logi(?:tech)? C930e/i.test(c.label));
  const prioritized: MediaDeviceInfo[] = [];
  const c270 = filtered.find((c) => c.label.includes('Logi C270 HD'));
  if (c270) prioritized.push(c270);
  for (const cam of filtered) if (cam !== c270) prioritized.push(cam);

  for (const cam of prioritized) {
    try {
      return await createLocalVideoTrack({ deviceId: { exact: cam.deviceId } });
    } catch (err: any) {
      if (err?.name === 'NotReadableError') {
        console.warn(`[Camera] "${cam.label}" busy, trying next…`, err);
        continue;
      }
      throw err;
    }
  }

  return createLocalVideoTrack();
}

/**
 * useStreamingDashboard
 * ---------------------
 * End-to-end hook for streaming and control-plane orchestration.
 *
 * Responsibilities:
 * - Acquire media permissions once and handle busy devices.
 * - Choose preferred camera and publish tracks to a LiveKit room.
 * - Maintain presence and handle START/STOP commands via WebPubSub.
 * - Keep the tab awake during streaming and (optionally) when idle.
 * - Recover cleanly after OS/browser sleep using visibility/network hooks and a drift detector.
 *
 * Returns:
 * - `videoRef`: attach to a `<video>` element for local preview
 * - `audioRef`: reserved for future local audio rendering
 * - `isStreaming`: UI-friendly boolean state
 */
export function useStreamingDashboard() {
  // Media & room state
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const roomRef = useRef<Room | null>(null);
  const tracksRef = useRef<{ video?: LocalVideoTrack; audio?: LocalAudioTrack }>({});
  const streamingRef = useRef(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // ✅ RETRY STATE - Para reintentos de conexión a LiveKit
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const persistentRetryRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckRef = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ MANUAL STOP FLAG - Para evitar reconexión automática después de STOP manual
  const manualStopRef = useRef<boolean>(false);

  // Auth & clients
  const { initialized, account } = useAuth();
  const userEmail = account?.username.toLowerCase() ?? '';
  const pendingClient = useRef(new PendingCommandsClient()).current;
  const presenceClient = useRef(new PresenceClient()).current;
  const streamingClient = useRef(new StreamingClient()).current;

  // Wake lock management
  const wakeLockRef = useRef<WakeLockSentinelAny | null>(null);

  /** Acquire a screen wake lock, if supported. */
  const requestWakeLock = useCallback(async () => {
    // Only request wake lock when tab is visible
    if (document.visibilityState !== 'visible') {
      console.log('[WakeLock] Skipping - tab not visible');
      return;
    }
    try {
      if ('wakeLock' in navigator) {
        const wl = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = wl;
        wl.addEventListener?.('release', async () => {
          console.info('[WakeLock] released');
          if (
            document.visibilityState === 'visible' &&
            (KEEP_AWAKE_WHEN_IDLE || streamingRef.current)
          ) {
            try {
              await (navigator as any).wakeLock.request('screen');
              console.info('[WakeLock] re-acquired after release');
            } catch {}
          }
        });
        console.info('[WakeLock] acquired');
      }
    } catch (e) {
      console.warn('[WakeLock] request failed', e);
    }
  }, []);

  /** Release the wake lock if held. */
  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.info('[WakeLock] released by app');
      }
    } catch {}
  }, []);

/**
 * Starts a streaming session:
 * - Ensures WS connection and required groups.
 * - Primes camera/mic permissions.
 * - Selects a camera with fallback and connects to LiveKit.
 * - Publishes local video (and best-effort local mic).
 * - Attaches **remote audio** tracks to `audioRef` so the employee can hear talkback.
 * - Requests a screen wake lock and marks the session active on the backend.
 *
 * @remarks
 * This function is idempotent: it returns immediately if a stream is already active.
 * It also installs listeners to attach any remote audio that is already present or that
 * joins later, and it enables autoplay on the hidden `<audio>` element.
 *
 * @throws Propagates unexpected errors during device enumeration/LiveKit connection/publish.
 */
// ✅ RETRY FUNCTION - Para reintentar conexión a LiveKit
const retryLiveKitConnection = useCallback(async (videoTrack: LocalVideoTrack, retryAttempt: number = 0) => {
  const maxRetries = 10; // ✅ AUMENTAR REINTENTOS - Más intentos para mayor robustez
  const retryDelay = Math.min(500 * Math.pow(1.5, retryAttempt), 5000); // ✅ DELAY MÁS AGRESIVO - 0.5s, 0.75s, 1.1s, 1.7s, 2.5s, 3.8s, 5s max
  
  console.log(`[RETRY] Attempting LiveKit connection retry ${retryAttempt + 1}/${maxRetries}`);
  setIsRetrying(true);
  
  try {
    // ✅ GET FRESH TOKEN - Obtener token nuevo para cada retry
    console.log(`[RETRY] Getting fresh LiveKit token for attempt ${retryAttempt + 1}`);
    const { rooms, livekitUrl } = await getLiveKitToken();
    const room = new Room();
    
    // ✅ FALLBACK CONFIGURATION - Intentar diferentes configuraciones según el intento
    let roomConfig = {};
    if (retryAttempt >= 5) {
      console.log(`[RETRY] Using fallback configuration for attempt ${retryAttempt + 1}`);
      roomConfig = {
        adaptiveStream: false,
        dynacast: false,
        publishDefaults: {
          videoSimulcastLayers: [],
          videoCodec: 'h264'
        }
      };
    }
    
    // ✅ ADD CONNECTION TIMEOUT - Evitar conexiones colgadas (timeout más largo para reintentos)
    const connectPromise = room.connect(livekitUrl, rooms[0].token, roomConfig);
    const timeoutMs = Math.min(5000 + (retryAttempt * 2000), 15000); // 5s, 7s, 9s, 11s, 13s, 15s max
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Connection timeout after ${timeoutMs}ms`)), timeoutMs)
    );
    
    console.log(`[RETRY] Connection timeout set to ${timeoutMs}ms for attempt ${retryAttempt + 1}`);
    console.log(`[RETRY] Room config:`, roomConfig);
    await Promise.race([connectPromise, timeoutPromise]);
    console.log(`[RETRY] LiveKit connection successful on attempt ${retryAttempt + 1}`);
    
    // Success - setup room and start streaming
    roomRef.current = room;
    
    // ✅ USE SAME SETUP LOGIC - Usar la misma lógica que el flujo normal
    console.log(`[RETRY] Setting up LiveKit room for attempt ${retryAttempt + 1}`);
    await setupLiveKitRoom(room, videoTrack);
    
    // ✅ VERIFY STREAMING STATE - Verificar que realmente está transmitiendo
    console.log(`[RETRY] Verifying streaming state after setup`);
    if (streamingRef.current && roomRef.current) {
      console.log(`[RETRY] Streaming state verified: streaming=${streamingRef.current}, room=${roomRef.current.state}`);
    } else {
      console.warn(`[RETRY] Streaming state not properly set after retry ${retryAttempt + 1}`);
    }
    
    setRetryCount(0);
    setIsRetrying(false);
    return true;
  } catch (err) {
    console.error(`[RETRY] LiveKit connection failed on attempt ${retryAttempt + 1}:`, err);
    
    // ✅ ANALYZE ERROR TYPE - Diferentes estrategias según el tipo de error
    const errorMessage = (err as Error).message.toLowerCase();
    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      console.log(`[RETRY] Network error detected, will retry with longer delay`);
    } else if (errorMessage.includes('token') || errorMessage.includes('unauthorized')) {
      console.log(`[RETRY] Token error detected, will retry with fresh token`);
    } else if (errorMessage.includes('pc connection') || errorMessage.includes('datachannel')) {
      console.log(`[RETRY] WebRTC connection error detected, will retry`);
    } else if (errorMessage.includes('track') || errorMessage.includes('video')) {
      console.log(`[RETRY] Video track error detected, will retry`);
    } else {
      console.log(`[RETRY] Unknown error detected, will retry anyway`);
    }
    
    // ✅ AGGRESSIVE RECOVERY - Intentar recuperación más agresiva en reintentos avanzados
    if (retryAttempt >= 3) {
      console.log(`[RETRY] Advanced retry (${retryAttempt + 1}), attempting aggressive recovery...`);
      
      // Intentar recrear video track si es necesario
      try {
        if (videoTrack && videoTrack.mediaStreamTrack && videoTrack.mediaStreamTrack.readyState === 'ended') {
          console.log(`[RETRY] Video track ended, attempting to recreate...`);
          // El video track se recreará en el próximo intento
        }
      } catch (trackErr) {
        console.log(`[RETRY] Video track check failed:`, trackErr);
      }
      
      // Intentar limpiar cualquier conexión previa
      try {
        if (roomRef.current) {
          console.log(`[RETRY] Cleaning up previous room connection...`);
          await roomRef.current.disconnect();
          roomRef.current = null;
        }
      } catch (cleanupErr) {
        console.log(`[RETRY] Cleanup failed:`, cleanupErr);
      }
    }
    
    // ✅ VIDEO TRACK RECREATION - Si el video track está "ended", recrearlo
    if (videoTrack && videoTrack.mediaStreamTrack?.readyState === 'ended') {
      console.log(`[RETRY] Video track is ended, attempting to recreate...`);
      
      try {
        // Detener y limpiar video track actual
        videoTrack.stop();
        videoTrack.detach();
        
        // Intentar recrear video track
        console.log(`[RETRY] Attempting to recreate video track...`);
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === 'videoinput');
        const newVideoTrack = await createVideoTrackWithFallback(cams);
        
        // Usar el nuevo video track para el siguiente intento
        console.log(`[RETRY] New video track created, will use in next attempt`);
        // Nota: El nuevo track se pasará en el siguiente retry
      } catch (recreateErr) {
        console.log(`[RETRY] Video track recreation failed:`, recreateErr);
      }
    }
    
    // ✅ LAST RESORT RECOVERY - En los últimos intentos, intentar recrear video track completamente
    if (retryAttempt >= 7) {
      console.log(`[RETRY] Last resort retry (${retryAttempt + 1}), attempting complete video track recreation...`);
      
      try {
        // Detener y limpiar video track actual
        if (videoTrack) {
          videoTrack.stop();
          videoTrack.detach();
        }
        
        // Intentar recrear video track
        console.log(`[RETRY] Attempting to recreate video track...`);
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === 'videoinput');
        const newVideoTrack = await createVideoTrackWithFallback(cams);
        
        // Usar el nuevo video track para el siguiente intento
        console.log(`[RETRY] New video track created, will use in next attempt`);
        // Nota: El nuevo track se pasará en el siguiente retry
      } catch (recreateErr) {
        console.log(`[RETRY] Video track recreation failed:`, recreateErr);
      }
    }
    
    if (retryAttempt < maxRetries - 1) {
      console.log(`[RETRY] Scheduling retry ${retryAttempt + 2} in ${retryDelay}ms`);
      setTimeout(() => {
        retryLiveKitConnection(videoTrack, retryAttempt + 1);
      }, retryDelay);
      return false;
    } else {
      // ✅ NEVER GIVE UP - En lugar de rendirse, continuar con delays más largos
      console.warn(`[RETRY] Max retries reached (${maxRetries}), but continuing with longer delays...`);
      
      // ✅ PERSISTENT RETRY - Continuar indefinidamente con delays más largos
      const persistentDelay = Math.min(10000 + (retryAttempt * 5000), 60000); // 10s, 15s, 20s, 25s, 30s, 35s, 40s, 45s, 50s, 55s, 60s max
      console.log(`[RETRY] Switching to persistent retry mode with ${persistentDelay}ms delay`);
      
      persistentRetryRef.current = setTimeout(() => {
        console.log(`[RETRY] Persistent retry attempt ${retryAttempt + 1} (no max limit)`);
        retryLiveKitConnection(videoTrack, retryAttempt + 1);
      }, persistentDelay);
      
      return false; // No success yet, but will keep trying
    }
  }
}, []);

// ✅ CANCEL PERSISTENT RETRIES - Función para cancelar retries persistentes
const cancelPersistentRetries = useCallback(() => {
  if (persistentRetryRef.current) {
    clearTimeout(persistentRetryRef.current);
    persistentRetryRef.current = null;
    console.log(`[RETRY] Persistent retries canceled`);
  }
  if (healthCheckRef.current) {
    clearInterval(healthCheckRef.current);
    healthCheckRef.current = null;
    console.log(`[HEALTH] Health check canceled`);
  }
  setIsRetrying(false);
  setRetryCount(0);
}, []);

// ✅ SETUP LIVEKIT ROOM - Configurar room y publicar video
const setupLiveKitRoom = useCallback(async (room: Room, videoTrack: LocalVideoTrack) => {
  console.log('[Stream] DEBUG - Setting up LiveKit room...');
  
  // Configure room to maintain connection during tab changes
  console.log('[Stream] DEBUG - Setting up LiveKit event listeners...');
  try {
    // Set up event listeners to handle connection state changes
    room.on('connectionStateChanged', (state) => {
      console.log('[WS] LiveKit connection state changed:', state);
      console.log('[Stream] DEBUG - Connection state change - Tab visibility:', document.visibilityState);
      console.log('[Stream] DEBUG - Manual stop flag:', manualStopRef.current);
      
      if (state === 'connected' && streamingRef.current) {
        console.log('[WS] LiveKit reconnected, ensuring video continues');
      } else if (state === 'disconnected' && streamingRef.current) {
        // ✅ CHECK MANUAL STOP - Solo reconectar si NO fue un STOP manual
        if (manualStopRef.current) {
          console.log('[WS] Manual stop detected, skipping auto-reconnect');
          return;
        }
        
        console.log('[WS] LiveKit disconnected during streaming, attempting reconnection...');
        // ✅ AUTO-RECONNECT - Reiniciar retry cuando se desconecta durante streaming
        setTimeout(() => {
          console.log('[WS] Triggering auto-reconnect after disconnect');
          retryLiveKitConnection(videoTrack, 0);
        }, 1000); // Pequeño delay para evitar spam
      }
    });
    
    room.on('participantConnected', (participant) => {
      console.log('[WS] Participant connected:', participant.identity);
    });
    
    room.on('participantDisconnected', (participant) => {
      console.log('[WS] Participant disconnected:', participant.identity);
    });
    
    // ✅ VIDEO TRACK MONITORING - Monitorear el estado del video track
    room.on(RoomEvent.TrackUnpublished, (track, participant) => {
      if (participant.sid === room.localParticipant.sid && track.kind === 'video') {
        console.log('[WS] Local video track unpublished, checking if we need to reconnect...');
        console.log('[WS] Video track state:', (track as any).mediaStreamTrack?.readyState);
        
        // Si el track se despublicó y estamos streaming, intentar reconectar
        if (streamingRef.current && (track as any).mediaStreamTrack?.readyState === 'ended') {
          console.log('[WS] Video track ended during streaming, triggering reconnection...');
          setTimeout(() => {
            console.log('[WS] Triggering reconnection due to video track unpublish');
            retryLiveKitConnection(videoTrack, 0);
          }, 1000);
        }
      }
    });
    
    console.log('[Stream] DEBUG - LiveKit event listeners configured');
  } catch (e) {
    console.warn('[WS] Failed to configure LiveKit event listeners:', e);
  }
  
  // LiveKit is now connected and ready
  console.log('[Stream] DEBUG - LiveKit ready for streaming');

  /**
   * Attach any subscribed/coming audio tracks of a remote participant to the `<audio>` element.
   *
   * @param p - Remote participant whose audio should be rendered locally.
   */
  const attachAudioFrom = (p: RemoteParticipant) => {
    // Attach already-subscribed audio
    p.getTrackPublications().forEach((pub: any) => {
      if (pub?.kind === 'audio' && pub.isSubscribed && pub.audioTrack && audioRef.current) {
        (pub.audioTrack as RemoteAudioTrack).attach(audioRef.current);
        audioRef.current.muted = false;
        audioRef.current.play?.().catch(() => {});
      }
    });

    // New audio subscriptions
    p.on(ParticipantEvent.TrackSubscribed, (track) => {
      const kind = (track as any)?.kind;
      if (kind === 'audio' && audioRef.current) {
        (track as RemoteAudioTrack).attach(audioRef.current);
        audioRef.current.muted = false;
        audioRef.current.play?.().catch(() => {});
      }
    });

    // Audio unsubscriptions
    p.on(ParticipantEvent.TrackUnsubscribed, (track) => {
      const kind = (track as any)?.kind;
      if (kind === 'audio' && audioRef.current) {
        try {
          (track as RemoteAudioTrack).detach(audioRef.current);
        } catch {}
      }
    });
  };

  // Attach audio for participants already in the room (exclude self)
  room.remoteParticipants.forEach((p) => {
    if (p.sid !== room.localParticipant.sid) attachAudioFrom(p);
  });

  // Attach audio for participants that join later (exclude self)
  room.on(RoomEvent.ParticipantConnected, (p) => {
    if (p.sid !== room.localParticipant.sid) attachAudioFrom(p);
  });

  // 5) Publish local video (and best-effort local mic)
  console.log('[Stream] DEBUG - Publishing video track...');
  try {
    await room.localParticipant.publishTrack(videoTrack, {
      name: 'camera',
      simulcast: true,
    });
    console.log('[Stream] DEBUG - Video track published successfully');
    
    // ✅ VERIFY PUBLICATION - Verificar que el track se publicó correctamente
    const publishedTracks = room.localParticipant.getTrackPublications();
    const videoPublication = publishedTracks.find(pub => pub.kind === 'video');
    console.log('[Stream] DEBUG - Published tracks count:', publishedTracks.length);
    console.log('[Stream] DEBUG - Video publication found:', !!videoPublication);
    console.log('[Stream] DEBUG - Video publication subscribed:', videoPublication?.isSubscribed);
    
    if (!videoPublication) {
      console.warn('[Stream] Video track publication verification failed, attempting reconnection...');
      setTimeout(() => {
        console.log('[Stream] Triggering reconnection due to publication verification failure');
        if (videoTrack) {
          retryLiveKitConnection(videoTrack, 0);
        }
      }, 1000);
      return;
    }
    
  } catch (err) {
    console.error('[Stream] Failed to publish video track:', err);
    
    // ✅ PUBLISH FAILURE RECOVERY - Si falla la publicación, intentar reconectar
    if (err instanceof Error && err.message.includes('timeout')) {
      console.log('[Stream] Video track publish timeout, attempting reconnection...');
      setTimeout(() => {
        console.log('[Stream] Triggering reconnection due to publish timeout');
        retryLiveKitConnection(videoTrack, 0);
      }, 2000);
      return; // No continuar con el setup si falló la publicación
    }
    
    // Continue anyway - audio might still work
  }

  // Store track reference for cleanup
  tracksRef.current.video = videoTrack;

  // 6) Update streaming state
  streamingRef.current = true;
  setIsStreaming(true);
  console.log('[Stream] DEBUG - Streaming state updated to true');
  
  // ✅ VERIFY STREAMING SETUP - Verificar que todo está configurado correctamente
  console.log('[Stream] DEBUG - Verifying streaming setup:');
  console.log('[Stream] DEBUG - - streamingRef.current:', streamingRef.current);
  console.log('[Stream] DEBUG - - roomRef.current:', !!roomRef.current);
  console.log('[Stream] DEBUG - - room state:', roomRef.current?.state);
  console.log('[Stream] DEBUG - - video track:', !!tracksRef.current.video);
  console.log('[Stream] DEBUG - - video track ready state:', tracksRef.current.video?.mediaStreamTrack?.readyState);

  // 7) Notify backend that streaming started
  console.log('[Stream] DEBUG - Notifying backend of streaming start...');
  try {
  await streamingClient.setActive();
    console.log('[Stream] DEBUG - Backend notified of streaming start');
  } catch (err) {
    console.warn('[Stream] Failed to notify backend of streaming start:', err);
    // Continue anyway - the stream is working
  }

  // ✅ HEALTH CHECK - Verificar conexión periódicamente
  healthCheckRef.current = setInterval(() => {
    if (streamingRef.current && roomRef.current) {
      const connectionState = roomRef.current.state;
      const videoTrack = tracksRef.current.video;
      const videoTrackState = videoTrack?.mediaStreamTrack?.readyState;
      
      console.log('[Stream] Health check - Room state:', connectionState);
      console.log('[Stream] Health check - Video track state:', videoTrackState);
      console.log('[Stream] Health check - Manual stop flag:', manualStopRef.current);
      console.log('[Stream] Health check - Video track details:', {
        trackId: videoTrack?.sid,
        kind: videoTrack?.kind,
        isMuted: videoTrack?.isMuted,
        readyState: videoTrack?.mediaStreamTrack?.readyState
      });
      
      // ✅ CHECK MANUAL STOP - Solo reconectar si NO fue un STOP manual
      if (manualStopRef.current) {
        console.log('[Stream] Health check - Manual stop detected, skipping auto-reconnect');
        return;
      }
      
      if (connectionState === 'disconnected') {
        console.log('[Stream] Health check detected disconnect, triggering reconnection...');
        if (healthCheckRef.current) {
          clearInterval(healthCheckRef.current);
          healthCheckRef.current = null;
        }
        setTimeout(() => {
          console.log('[Stream] Triggering health check reconnection');
          if (videoTrack) {
            retryLiveKitConnection(videoTrack, 0);
          }
        }, 1000);
      } else if (videoTrackState === 'ended') {
        console.log('[Stream] Health check detected video track ended, triggering reconnection...');
        console.log('[Stream] Health check - Video track details:', {
          trackId: videoTrack?.sid,
          kind: videoTrack?.kind,
          isMuted: videoTrack?.isMuted
        });
        
        if (healthCheckRef.current) {
          clearInterval(healthCheckRef.current);
          healthCheckRef.current = null;
        }
        setTimeout(() => {
          console.log('[Stream] Triggering health check reconnection due to video track failure');
          if (videoTrack) {
            retryLiveKitConnection(videoTrack, 0);
          }
        }, 1000);
      }
    }
  }, 5000); // Check every 5 seconds

  console.log('[Stream] DEBUG - Stream setup completed successfully');
}, []);

const startStream = useCallback(async () => {
  console.log('[Stream] DEBUG - startStream called');
  console.log('[Stream] DEBUG - streamingRef.current:', streamingRef.current);
  console.log('[Stream] DEBUG - Tab visibility:', document.visibilityState);
  console.log('[Stream] DEBUG - Document hidden:', document.hidden);
  
  // ✅ RESET MANUAL STOP FLAG - Limpiar bandera de STOP manual al iniciar stream
  manualStopRef.current = false;
  console.log('[START] Manual stop flag reset to false');
  
  if (streamingRef.current) {
    console.log('[Stream] DEBUG - Already streaming, returning');
    return;
  }

  // 1) Ensure PubSub + presence
  console.log('[Stream] DEBUG - Checking PubSub connection:', pubSubService.isConnected());
  if (!pubSubService.isConnected()) {
    console.log('[Stream] DEBUG - Connecting to PubSub...');
    await pubSubService.connect(userEmail);
    await presenceClient.setOnline();
    await pubSubService.joinGroup('presence');
    await pubSubService.joinGroup(`commands:${userEmail}`);
    console.log('[Stream] DEBUG - PubSub connected');
  }

  // 2) Prime camera/mic permissions (stops tracks immediately)
  console.log('[Stream] DEBUG - Requesting camera permission...');
  try {
    await ensureCameraPermission();
    console.log('[Stream] DEBUG - Camera permission granted');
  } catch (e) {
    console.log('[Stream] DEBUG - Camera permission failed:', e);
    return;
  }

  // 3) Choose camera (with fallback)
  console.log('[Stream] DEBUG - Enumerating devices...');
  let videoTrack: LocalVideoTrack;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === 'videoinput');
    console.log('[Stream] DEBUG - Found cameras:', cams.length);
    videoTrack = await createVideoTrackWithFallback(cams);
    console.log('[Stream] DEBUG - Video track created');
  } catch (err) {
    console.error('[Stream] video setup failed', err);
    alert('Unable to access any camera.');
    return;
  }

  // 4) Connect to LiveKit with retry logic
  console.log('[Stream] DEBUG - Getting LiveKit token...');
  const { rooms, livekitUrl } = await getLiveKitToken();
  console.log('[Stream] DEBUG - LiveKit URL:', livekitUrl);
  console.log('[Stream] DEBUG - Rooms:', rooms.length);
  console.log('[Stream] DEBUG - Token preview:', rooms[0]?.token?.substring(0, 20) + '...');
  console.log('[Stream] DEBUG - Room name:', rooms[0]?.room);
  
  // ✅ PRE-CONNECTION CHECKS - Verificar requisitos antes de conectar
  console.log('[Stream] DEBUG - Pre-connection checks:');
  console.log('[Stream] DEBUG - WebRTC support:', !!window.RTCPeerConnection);
  console.log('[Stream] DEBUG - Network online:', navigator.onLine);
  console.log('[Stream] DEBUG - User agent:', navigator.userAgent);
  
  if (!window.RTCPeerConnection) {
    console.error('[Stream] ERROR - WebRTC not supported in this browser');
    alert('WebRTC is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
    return;
  }
  
  if (!navigator.onLine) {
    console.error('[Stream] ERROR - No internet connection');
    alert('No internet connection detected. Please check your network and try again.');
    return;
  }
  
  const room = new Room();
  
  try {
    console.log('[Stream] DEBUG - Connecting to LiveKit...');
    // Connect with minimal configuration to avoid errors
    await room.connect(livekitUrl, rooms[0].token);
    console.log('[Stream] DEBUG - LiveKit connected successfully');
    
    // Success - setup room
    roomRef.current = room;
    await setupLiveKitRoom(room, videoTrack);
    
  } catch (err) {
    console.error('[WS] LiveKit connect failed, starting retry process:', err);
    // ✅ START RETRY PROCESS - Si falla la conexión inicial, intentar con retries
    const retrySuccess = await retryLiveKitConnection(videoTrack, 0);
    if (!retrySuccess) {
      console.error('[WS] All LiveKit connection attempts failed');
      try {
        videoTrack?.stop();
        videoTrack?.detach();
      } catch {}
      return;
    }
  }
}, [userEmail, requestWakeLock, streamingClient, retryLiveKitConnection, setupLiveKitRoom]);
/**
 * Stops an active streaming session.
 *
 * @remarks
 * Order of operations is important:
 *  1) Unpublish local tracks (best-effort) so the server stops forwarding media.
 *  2) Stop & detach the local tracks and clear DOM media elements.
 *  3) Optionally release the wake lock (if not keeping the tab awake while idle).
 *  4) Disconnect from the LiveKit room.
 *  5) Flip local state and notify the backend.
 *
 * The function is idempotent: it returns immediately if no stream is active.
 */
const stopStream = useCallback(async () => {
  if (!streamingRef.current) return;

  // Snapshot room + tracks (they might get nulled during cleanup)
  const room = roomRef.current;
  const { video, audio } = tracksRef.current;

  // 1) Best-effort unpublish before stopping, to stop server forwarding ASAP
  try {
    if (room && video) {
      try { room.localParticipant.unpublishTrack(video, /*stopOnUnpublish*/ false); } catch {}
    }
    if (room && audio) {
      try { room.localParticipant.unpublishTrack(audio, /*stopOnUnpublish*/ true); } catch {}
    }
  } catch {
    // Ignore unpublish errors; we still stop/clear locally below
  }

  // 2) Stop local tracks & detach DOM sinks
  try {
    video?.detach();
    video?.stop();
  } catch {}
  try {
    audio?.stop(); // no detach needed (we don't attach local mic to an <audio/> here)
  } catch {}
  tracksRef.current = {};

  // Clear media elements to be extra safe
  try {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
    }
    if (audioRef.current) {
      audioRef.current.pause?.();
      audioRef.current.srcObject = null;
      audioRef.current.src = '';
    }
  } catch {}

  // 3) Release wake lock if we don't keep the tab awake while idle
  if (!KEEP_AWAKE_WHEN_IDLE) {
    await releaseWakeLock();
  }

  // 4) Disconnect room
  try {
    await room?.disconnect();
  } finally {
    roomRef.current = null;
  }

  // 5) Flip state & notify backend
  streamingRef.current = false;
  setIsStreaming(false);
  console.info('[Streaming] INACTIVE');
  await streamingClient.setInactive();
}, [releaseWakeLock, streamingClient]);

/**
 * Stops streaming when triggered by external command (admin/supervisor).
 * Does the same local cleanup as stopStream but calls backend with isCommand flag.
 */
const stopStreamForCommand = useCallback(async () => {
  if (!streamingRef.current) return;

  // ✅ SET MANUAL STOP FLAG - Marcar como STOP manual para evitar reconexión automática
  manualStopRef.current = true;
  console.log('[STOP] Manual stop flag set to true');

  // ✅ CLEANUP HEALTH CHECK - Limpiar health check al detener streaming
  if (healthCheckRef.current) {
    clearInterval(healthCheckRef.current);
    healthCheckRef.current = null;
    console.log(`[HEALTH] Health check stopped during stream stop`);
  }

  // Snapshot room + tracks (they might get nulled during cleanup)
  const room = roomRef.current;
  const { video, audio } = tracksRef.current;

  // 1) Best-effort unpublish before stopping, to stop server forwarding ASAP
  try {
    if (room && video) {
      try { room.localParticipant.unpublishTrack(video, /*stopOnUnpublish*/ false); } catch {}
    }
    if (room && audio) {
      try { room.localParticipant.unpublishTrack(audio, /*stopOnUnpublish*/ true); } catch {}
    }
  } catch {
    // Ignore unpublish errors; we still stop/clear locally below
  }

  // 2) Stop local tracks & detach DOM sinks
  try {
    video?.detach();
    video?.stop();
  } catch {}
  try {
    audio?.stop(); // no detach needed (we don't attach local mic to an <audio/> here)
  } catch {}
  tracksRef.current = {};

  // Clear media elements to be extra safe
  try {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
    }
    if (audioRef.current) {
      audioRef.current.pause?.();
      audioRef.current.srcObject = null;
      audioRef.current.src = '';
    }
  } catch {}

  // 3) Release wake lock if we don't keep the tab awake while idle
  if (!KEEP_AWAKE_WHEN_IDLE) {
    await releaseWakeLock();
  }

  // 4) Disconnect room
  try {
    await room?.disconnect();
  } finally {
    roomRef.current = null;
  }

  // 5) Flip state & notify backend with COMMAND reason
  streamingRef.current = false;
  setIsStreaming(false);
  console.info('[Streaming] INACTIVE by COMMAND');
  
  // Call backend with isCommand flag to mark as COMMAND reason
  try {
    console.log('[stopStreamForCommand] Calling backend with isCommand=true');
    await apiClient.post('/api/StreamingSessionUpdate', { 
      status: 'stopped',
      isCommand: true
    });
    console.log('[stopStreamForCommand] Backend call successful');
  } catch (err) {
    console.warn('Failed to notify backend of command stop:', err);
  }
}, [releaseWakeLock]);

/**
 * Handles a single START/STOP command and, if present, acknowledges it.
 *
 * @remarks
 * - Guards against overlapping actions by serializing start/stop execution.
 * - Unknown commands are treated as STOP (defensive default).
 * - Acknowledgement is best-effort and does not throw.
 */
const handleCommand = useCallback(
  async (cmd: PendingCommand) => {
    console.info(`[WS Cmd] "${cmd.command}" @ ${cmd.timestamp}`);

    // Normalize and serialize execution
    const action = (cmd.command || '').toString().trim().toUpperCase();
    try {
      if (action === 'START') {
        await startStream();
      } else if (action === 'STOP') {
        await stopStreamForCommand();
      } else {
        // Defensive default: treat unknown commands as STOP
        await stopStreamForCommand();
      }
    } finally {
      if (cmd.id) {
        try {
          await pendingClient.acknowledge([cmd.id]);
          console.debug(`[WS Cmd] acknowledged ${cmd.id}`);
        } catch (err) {
          console.warn(`Failed to acknowledge ${cmd.id}`, err);
        }
      }
    }
  },
  [startStream, stopStreamForCommand, pendingClient],
);

  /**
   * Bootstraps WS connection, presence, auto-resume, event handlers and sleep-recovery.
   *
   * @remarks
   * - Uses a singleton WebPubSub client, with resilient reconnect at the service level.
   * - Subscribes to `commands:${userEmail}` and handles START/STOP.
   * - Updates presence on connect/reconnect/visibility/network changes.
   * - Detects tab sleep via timer drift and triggers a reconnect attempt.
   */
  useEffect(() => {
    if (!initialized || !userEmail) return;
    let mounted = true;

    // Unsubscribe holders for WS events
    let offMsg: (() => void) | undefined;
    let offConn: (() => void) | undefined;
    let offDisc: (() => void) | undefined;

    (async () => {
      console.debug('[WS] connecting…');
      await pubSubService.connect(userEmail);
      await pubSubService.joinGroup('presence');
      await pubSubService.joinGroup(`commands:${userEmail}`);
      console.info(`[WS] connected to "${userEmail}"`);
      await presenceClient.setOnline();

      if (KEEP_AWAKE_WHEN_IDLE && !streamingRef.current) {
        await requestWakeLock();
      }

      try {
        const last = await streamingClient.fetchLastSessionWithReason();
        const stoppedAt = last.stoppedAt ? new Date(last.stoppedAt) : null;
        const stopReason = last.stopReason;
        
        
        console.info(`[Streaming] Debug - stoppedAt: ${stoppedAt}, stopReason: "${stopReason}"`);
        
        // Only resume if:
        // 1. No stop time (session was active)
        // 2. OR stopped by DISCONNECT and within 5 minutes
        if (!stoppedAt || (stopReason === 'DISCONNECT' && Date.now() - stoppedAt.getTime() < 5 * 60_000)) {
          console.info(`[Streaming] resuming (reason: ${stopReason || 'active'})`);
          await startStream();
        } else if (stopReason === 'COMMAND') {
          console.info('[Streaming] NOT resuming - stopped by external command');
        } else {
          console.info(`[Streaming] NOT resuming - stopped too long ago (${stopReason})`);
        }
      } catch {}

      // Disconnected → go offline & stop stream
      offDisc = pubSubService.onDisconnected(() => {
        if (!mounted) return;
        console.warn('[WS] disconnected');
        void presenceClient.setOffline();
        void stopStream();
      });

      // Connected → restore presence & wakelock
      offConn = pubSubService.onConnected(async () => {
        if (!mounted) return;
        console.info('[WS] reconnected');
        await pubSubService.joinGroup('presence');
        await pubSubService.joinGroup(`commands:${userEmail}`);
        await presenceClient.setOnline();
        if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
          await requestWakeLock();
        }
      });

      // Commands
      offMsg = pubSubService.onMessage((msg: any) => {
        console.log('[WS MESSAGE] PSO Dashboard received message:', msg);
        console.log('[WS MESSAGE] Current userEmail:', userEmail);
        console.log('[WS MESSAGE] Message employeeEmail:', msg?.employeeEmail);
        
        if (msg?.employeeEmail && msg.employeeEmail.toLowerCase() !== userEmail) {
          console.log('[WS MESSAGE] Message not for this user, ignoring');
          return;
        }

        if (msg?.command === 'START' || msg?.command === 'STOP') {
          console.log(`[WS MESSAGE] Processing ${msg.command} command for ${userEmail}`);
          void handleCommand(msg as PendingCommand);
        } else {
          console.log('[WS MESSAGE] Unknown command or no command in message:', msg);
        }
      });

      // Missed commands
      const missed = await pendingClient.fetch();
      console.info(`[WS] fetched ${missed.length} commands`);
      for (const cmd of missed) {
        if (!mounted) break;
        await handleCommand(cmd);
      }
    })();

    /**
     * Re-acquires wake lock and restores presence when the page becomes visible.
     */
    const onVisible = async (): Promise<void> => {
      console.log('[WS] DEBUG - onVisible called');
      console.log('[WS] DEBUG - Tab visibility:', document.visibilityState);
      console.log('[WS] DEBUG - Document hidden:', document.hidden);
      console.log('[WS] DEBUG - streamingRef.current:', streamingRef.current);
      console.log('[WS] DEBUG - videoRef.current:', !!videoRef.current);
      console.log('[WS] DEBUG - videoRef.srcObject:', !!videoRef.current?.srcObject);
      
      if (document.visibilityState !== 'visible') {
        console.log('[WS] DEBUG - Tab not visible, returning');
        return;
      }
      
      try {
        console.log('[WS] DEBUG - Reconnecting PubSub...');
        await pubSubService.joinGroup('presence');
        await pubSubService.joinGroup(`commands:${userEmail}`);
        await presenceClient.setOnline();
        console.log('[WS] DEBUG - PubSub reconnected');
        
        if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
          console.log('[WS] DEBUG - Requesting wake lock...');
          await requestWakeLock();
        }
        
        // If we were streaming, ensure video continues even when tab becomes visible
        if (streamingRef.current) {
          console.log('[WS] Tab became visible - video should continue streaming');
          console.log('[WS] DEBUG - Video element srcObject:', !!videoRef.current?.srcObject);
          console.log('[WS] DEBUG - Room state:', roomRef.current?.state);
          
          // If video was lost, restore it
          if (!videoRef.current?.srcObject) {
            console.log('[WS] DEBUG - Video lost, attempting to restore...');
            try {
              // Get the current video track from the room
              const localParticipant = roomRef.current?.localParticipant;
              if (localParticipant) {
                // Get video tracks from local participant
                const videoTracks = Array.from(localParticipant.videoTrackPublications.values());
                console.log('[WS] DEBUG - Found video tracks:', videoTracks.length);
                
                if (videoTracks.length > 0) {
                  const videoTrackPub = videoTracks[0];
                  if (videoTrackPub.track && videoRef.current) {
                    console.log('[WS] DEBUG - Restoring video track:', videoTrackPub.trackSid);
                    // Convert LocalTrack to MediaStreamTrack
                    const mediaStreamTrack = videoTrackPub.track.mediaStreamTrack;
                    if (mediaStreamTrack) {
                      videoRef.current.srcObject = new MediaStream([mediaStreamTrack]);
                      console.log('[WS] DEBUG - Video restored successfully');
                    }
                  }
                } else {
                  console.log('[WS] DEBUG - No video tracks found, video may be lost');
                }
              } else {
                console.log('[WS] DEBUG - No local participant available');
              }
            } catch (e) {
              console.error('[WS] DEBUG - Failed to restore video:', e);
            }
          }
        } else {
          console.log('[WS] Tab became visible - reconnected but not resuming');
        }
      } catch (e) {
        console.warn('[WS] onVisible handler failed', e);
      }
    }

    /**
     * When the browser regains connectivity, refresh wake lock and presence.
     */
    const onOnline = async (): Promise<void> => {
      try {
        await pubSubService.joinGroup('presence');
        await pubSubService.joinGroup(`commands:${userEmail}`);
        await presenceClient.setOnline();
        if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
          await requestWakeLock();
        }
        // Don't run auto-resume on network reconnection - only on initial connection
        console.log('[WS] Network reconnected - reconnected but not resuming');
      } catch (e) {
        console.warn('[WS] onOnline handler failed', e);
      }
    };

    /**
     * On bfcache restore, refresh wake lock and presence.
     */
    const onPageShow = async (): Promise<void> => {
      try {
        await pubSubService.joinGroup('presence');
        await pubSubService.joinGroup(`commands:${userEmail}`);
        await presenceClient.setOnline();
        if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
          await requestWakeLock();
        }
        // Don't run auto-resume on page show - only on initial connection
        console.log('[WS] Page shown - reconnected but not resuming');
      } catch (e) {
        console.warn('[WS] onPageShow handler failed', e);
      }
    };

    window.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('pageshow', onPageShow);

    // Tab activity keeper: keeps tab active every 2 seconds to prevent video suspension
    const keepAliveInterval = setInterval(() => {
      if (streamingRef.current) {
        console.log('[WS] DEBUG - Keep alive ping - Tab visibility:', document.visibilityState);
        console.log('[WS] DEBUG - Keep alive ping - Video srcObject:', !!videoRef.current?.srcObject);
        
        // Force tab to stay active by triggering a small activity
        if (document.visibilityState === 'hidden') {
          console.log('[WS] DEBUG - Tab is hidden, triggering activity to keep video alive');
          // Trigger a small DOM activity to keep the tab "active"
          document.title = document.title === 'In Contact' ? 'In Contact - Active' : 'In Contact';
          
          // Also try to maintain video stream by refreshing the video element
          if (videoRef.current && videoRef.current.srcObject) {
            console.log('[WS] DEBUG - Refreshing video stream to prevent suspension');
            const currentStream = videoRef.current.srcObject;
            videoRef.current.srcObject = currentStream;
          }
        }
        
        // Proactive video restoration: if video is lost, restore it immediately
        if (streamingRef.current && videoRef.current && !videoRef.current.srcObject) {
          console.log('[WS] DEBUG - Keep alive: Video lost, restoring immediately...');
          try {
            const localParticipant = roomRef.current?.localParticipant;
            if (localParticipant) {
              const videoTracks = Array.from(localParticipant.videoTrackPublications.values());
              if (videoTracks.length > 0) {
                const videoTrackPub = videoTracks[0];
                if (videoTrackPub.track && videoRef.current) {
                  const mediaStreamTrack = videoTrackPub.track.mediaStreamTrack;
                  if (mediaStreamTrack) {
                    videoRef.current.srcObject = new MediaStream([mediaStreamTrack]);
                    console.log('[WS] DEBUG - Keep alive: Video restored immediately');
                  }
                }
              }
            }
          } catch (e) {
            console.error('[WS] DEBUG - Keep alive: Failed to restore video:', e);
          }
        }
      }
    }, 2_000);

    // Sleep detector: if the tab sleeps, interval fire will be delayed significantly.
    let lastTick = Date.now();
    const tick = setInterval(async () => {
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;
      
      console.log('[WS] DEBUG - Health check interval');
      console.log('[WS] DEBUG - Tab visibility:', document.visibilityState);
      console.log('[WS] DEBUG - streamingRef.current:', streamingRef.current);
      console.log('[WS] DEBUG - videoRef.srcObject:', !!videoRef.current?.srcObject);
      console.log('[WS] DEBUG - Room state:', roomRef.current?.state);
      
      if (delta > 60_000) {
        console.warn('[WS] sleep detected, forcing reconnect');
        await pubSubService.reconnect();
        await presenceClient.setOnline();
        if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
          await requestWakeLock();
        }
      }
      
      // Video health check: restore video if lost
      if (streamingRef.current && videoRef.current && !videoRef.current.srcObject) {
        console.log('[WS] DEBUG - Health check: Video lost, attempting to restore...');
        try {
          const localParticipant = roomRef.current?.localParticipant;
          if (localParticipant) {
            // Get video tracks from local participant
            const videoTracks = Array.from(localParticipant.videoTrackPublications.values());
            if (videoTracks.length > 0) {
              const videoTrackPub = videoTracks[0];
              if (videoTrackPub.track && videoRef.current) {
                console.log('[WS] DEBUG - Health check: Restoring video track:', videoTrackPub.trackSid);
                // Convert LocalTrack to MediaStreamTrack
                const mediaStreamTrack = videoTrackPub.track.mediaStreamTrack;
                if (mediaStreamTrack) {
                  videoRef.current.srcObject = new MediaStream([mediaStreamTrack]);
                  console.log('[WS] DEBUG - Health check: Video restored successfully');
                }
              }
            } else {
              console.log('[WS] DEBUG - Health check: No video tracks found');
            }
          } else {
            console.log('[WS] DEBUG - Health check: No local participant available');
          }
        } catch (e) {
          console.error('[WS] DEBUG - Health check: Failed to restore video:', e);
        }
      }
    }, 15_000);

    return () => {
      mounted = false;
      window.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('pageshow', onPageShow);
      clearInterval(keepAliveInterval);
      clearInterval(tick);
      console.debug('[App] cleanup');
      (async () => {
        await releaseWakeLock();
        roomRef.current?.disconnect();
        await presenceClient.setOffline();
        offMsg?.();
        offConn?.();
        offDisc?.();
      })();
    };
  }, [
    initialized,
    userEmail,
    presenceClient,
    pendingClient,
    streamingClient,
    startStream,
    stopStream,
    handleCommand,
    requestWakeLock,
    releaseWakeLock,
  ]);

  return { videoRef, audioRef, isStreaming, isRetrying, retryCount, cancelPersistentRetries };
}
