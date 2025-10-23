/**
 * @fileoverview useCamara - Main streaming dashboard hook
 * @summary Orchestrates video streaming functionality with specialized hooks
 * @description Provides centralized streaming management by coordinating multiple specialized hooks
 * for media devices, LiveKit connection, WebSocket communication, wake lock, and health monitoring.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Room,
  LocalVideoTrack,
  LocalAudioTrack,
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
import { useMediaDevices } from './useMediaDevices';
import { useLiveKitConnection } from './useLiveKitConnection';
import { useLiveKitRoomSetup } from './useLiveKitRoomSetup';
import { useStreamingState } from './useStreamingState';
import { useCommandHandling } from './useCommandHandling';
import { useBootstrap } from './useBootstrap';
import { useWakeLock } from './useWakeLock';
import { useVideoTrackWatchdog } from './useVideoTrackWatchdog';
import { useRetryLogic } from './useRetryLogic';
import { useStreamHealth } from './useStreamHealth';
import { CameraStartLogger } from '@/shared/telemetry/CameraStartLogger';

/**
 * Feature switches for streaming behavior
 * @remarks KEEP_AWAKE_WHEN_IDLE keeps the tab awake even when not streaming, which reduces the chance
 * that the browser throttles timers or disconnects WebSocket when the OS powers down the screen.
 */
const KEEP_AWAKE_WHEN_IDLE = true;

/** Basic wake lock sentinel typing for browsers that expose navigator.wakeLock */
type WakeLockSentinelAny = any;

/**
 * Main streaming dashboard hook that orchestrates video streaming functionality
 * @returns Object containing video/audio refs, streaming state, and control functions
 */
export function useStreamingDashboard() {
  // Media & room state
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const liveKit = useLiveKitConnection();
  const tracksRef = useRef<{ video?: LocalVideoTrack; audio?: LocalAudioTrack }>({});
  const retryLogic = useRetryLogic(liveKit as any);
  const streamHealth = useStreamHealth();
  
  // Streaming state hook
  const streamingState = useStreamingState();
  const { 
    isStreaming, 
    retryCount, 
    isRetrying, 
    manualStopRef, 
    streamingRef, 
    persistentRetryRef,
    setStreaming,
    setManualStop,
    setRetryState,
    cancelAllRetries
  } = streamingState;

  // Auth & clients
  const { initialized, account } = useAuth();
  const userEmail = account?.username.toLowerCase() ?? '';
  const userAdId = account?.localAccountId ?? '';
  const presenceClient = useRef(new PresenceClient()).current;
  const streamingClient = useRef(new StreamingClient()).current;

  // Camera start logger
  const startLoggerRef = useRef<CameraStartLogger | null>(null);
  if (!startLoggerRef.current) {
    startLoggerRef.current = new CameraStartLogger();
  }

  // Media devices hook
  const mediaDevices = useMediaDevices(startLoggerRef.current);

  // Wake lock via hook
  const wakeLock = useWakeLock({ auto: true });
  const requestWakeLock = useCallback(async () => { await wakeLock.acquire(); }, [wakeLock]);
  const releaseWakeLock = useCallback(async () => { await wakeLock.release(); }, [wakeLock]);

  // LiveKit room setup hook
  const roomSetup = useLiveKitRoomSetup({
    audioRef,
    videoRef,
    streamingRef,
    manualStopRef,
    onDisconnected: () => {
      console.log('[RoomSetup] Room disconnected, triggering reconnect');
      void reconnectWithRetry();
    },
    onTrackEnded: () => {
      console.log('[RoomSetup] Video track ended, triggering reconnect');
      void reconnectWithRetry();
    }
  });

  /**
   * Backend streaming status with retry/backoff helper
   * @param status - Streaming status to set ('started' | 'stopped')
   * @returns Promise that resolves when status is set successfully
   */
  const setStreamingStatusWithRetry = useCallback(
    async (status: 'started' | 'stopped'): Promise<void> => {
      const maxAttempts = 3;
      let delay = 500;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          if (status === 'started') {
            await streamingClient.setActive();
    } else {
            await streamingClient.setInactive();
    }
          return;
  } catch (err) {
          if (attempt === maxAttempts - 1) {
            throw err;
          }
          await new Promise((r) => setTimeout(r, delay));
          delay = Math.min(delay * 2, 2000);
        }
      }
    },
    [streamingClient],
  );
  const videoWatchdog = useVideoTrackWatchdog(liveKit as any, videoRef, streamingRef);

  /**
   * Centralized reconnect using useRetryLogic
   * @returns Promise that resolves to true if reconnection succeeded, false otherwise
   */
  const reconnectWithRetry = useCallback(async (): Promise<boolean> => {
    setRetryState(true);
    const ok = await retryLogic.connectWithRetry(
      async () => await liveKit.getFreshToken(),
      async (room) => {
        const current = tracksRef.current.video;
        const track = current?.mediaStreamTrack?.readyState === 'live'
          ? current!
          : await mediaDevices.createVideoTrackFromDevices();
        await (liveKit as any).setupRoom(room, track, audioRef);
      },
      tracksRef.current.video,
    );
    setRetryState(false);
    return ok;
  }, [retryLogic, liveKit, mediaDevices, audioRef]);

  /**
   * Cancels all persistent retry attempts
   */
const cancelPersistentRetries = useCallback(() => {
  if (persistentRetryRef.current) {
    clearTimeout(persistentRetryRef.current);
    persistentRetryRef.current = null;
    }
    setRetryState(false, 0);
}, []);

  /**
   * Sets up LiveKit room and publishes video track
   * @param room - LiveKit room instance
   * @param videoTrack - Local video track to publish
   */
const setupLiveKitRoom = useCallback(async (room: Room, videoTrack: LocalVideoTrack) => {
  console.log('[Stream] DEBUG - Setting up LiveKit room...');
    await roomSetup.setupRoom(room, videoTrack);
  tracksRef.current.video = videoTrack;
  streamingRef.current = true;
    setStreaming(true);
    
    streamHealth.start(
      () => liveKit.getCurrentRoom(),
      () => liveKit.getCurrentVideoTrack(),
      videoRef,
      streamingRef,
      () => {
        console.log('[Health] Room disconnected, triggering reconnect');
        void reconnectWithRetry();
      },
      () => {
        console.log('[Health] Video track ended, triggering reconnect');
        void reconnectWithRetry();
      }
    );

  console.log('[Stream] DEBUG - Notifying backend of streaming start...');
  try {
      await setStreamingStatusWithRetry('started');
      try {
        await apiClient.post('/api/StreamingSessionUpdate', { status: 'started' });
      } catch {}
  } catch (err) {
    console.warn('[Stream] Failed to notify backend of streaming start:', err);
    }

  console.log('[Stream] DEBUG - Stream setup completed successfully');
  }, [roomSetup, liveKit, streamHealth, setStreamingStatusWithRetry, reconnectWithRetry]);

  /**
   * Starts a streaming session with camera and LiveKit connection
   * @remarks Ensures WebSocket connection, camera permissions, and LiveKit room setup
   */
const startStream = useCallback(async () => {
    setManualStop(false);
  
  if (streamingRef.current) {
    return;
  }

  if (!pubSubService.isConnected()) {
    await pubSubService.connect(userEmail);
      await new Promise((r) => setTimeout(r, 200));
      try { await pubSubService.joinGroup('presence'); } catch {}
      try { await pubSubService.joinGroup(`commands:${userEmail}`); } catch {}
    }

    try {
      startLoggerRef.current?.begin(userAdId, userEmail);
      await mediaDevices.requestCameraPermission();
  } catch (e) {
      await startLoggerRef.current?.fail('Permission', (e as any)?.name, (e as any)?.message);
    return;
  }

  let videoTrack: LocalVideoTrack;
  try {
      videoTrack = await mediaDevices.createVideoTrackFromDevices();
  } catch (err) {
    console.error('[Stream] video setup failed', err);
    alert('Unable to access any camera.');
    await startLoggerRef.current?.fail('TrackCreate', (err as any)?.name, (err as any)?.message);
    return;
  }

  console.log('[Stream] DEBUG - Getting LiveKit token...');
  const { rooms, livekitUrl } = await getLiveKitToken();
  console.log('[Stream] DEBUG - LiveKit URL:', livekitUrl);
  console.log('[Stream] DEBUG - Rooms:', rooms.length);
  console.log('[Stream] DEBUG - Token preview:', rooms[0]?.token?.substring(0, 20) + '...');
  console.log('[Stream] DEBUG - Room name:', rooms[0]?.room);
  
    if (!window.RTCPeerConnection || !navigator.onLine) {
      alert('Cannot stream: browser does not support WebRTC or is offline.');
    return;
  }

    try {
      const room = await liveKit.connectToRoom(livekitUrl, rooms[0].token);
    await setupLiveKitRoom(room, videoTrack);
      videoWatchdog.start(async () => await mediaDevices.createVideoTrackFromDevices());
      console.log('[Stream] DEBUG - Stream started successfully');
      startLoggerRef.current?.clear();
  } catch (err) {
      console.error('[Stream] LiveKit connection failed:', err);
      await startLoggerRef.current?.fail('LiveKitConnect', (err as any)?.name, (err as any)?.message);
      const retrySuccess = await reconnectWithRetry();
    if (!retrySuccess) {
        try { videoTrack?.stop(); videoTrack?.detach(); } catch {}
      return;
    }
  }
  }, [userEmail, mediaDevices, liveKit, setupLiveKitRoom, videoWatchdog, reconnectWithRetry, setManualStop]);

  /**
   * Stops an active streaming session
   * @remarks Unpublishes tracks, cleans up resources, and notifies backend
 */
const stopStream = useCallback(async () => {
  if (!streamingRef.current) return;

    const room = liveKit.getCurrentRoom();
  const { video, audio } = tracksRef.current;

    try {
      if (room && video) { liveKit.unpublishVideoTrack(room, video, false); }
      if (room && audio) { liveKit.unpublishAudioTrack(room, audio, true); }
  } catch {}

    try { video?.detach(); video?.stop(); } catch {}
    try { audio?.stop(); } catch {}
    liveKit.clearTracks();

    try {
      if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.src = ''; }
      if (audioRef.current) { audioRef.current.pause?.(); audioRef.current.srcObject = null; audioRef.current.src = ''; }
  } catch {}

    if (!KEEP_AWAKE_WHEN_IDLE) { await releaseWakeLock(); }

    try { await liveKit.disconnectFromRoom(); } finally {}

  streamingRef.current = false;
    setStreaming(false);
    await setStreamingStatusWithRetry('stopped');
    videoWatchdog.stop();
    streamHealth.stop();
  }, [releaseWakeLock, setStreamingStatusWithRetry, liveKit, videoWatchdog, streamHealth]);

  /**
   * Stops streaming when triggered by external command
   * @param reason - Optional reason for stopping the stream
   * @remarks Sets manual stop flag to prevent automatic reconnection
 */
const stopStreamForCommand = useCallback(async (reason?: string) => {
  console.log('[StopStream] Received reason:', reason);
  if (!streamingRef.current) return;

    setManualStop(true);
    const room = liveKit.getCurrentRoom();
  const { video, audio } = tracksRef.current;

    try {
      if (room && video) { liveKit.unpublishVideoTrack(room, video, false); }
      if (room && audio) { liveKit.unpublishAudioTrack(room, audio, true); }
  } catch {}

    try { video?.detach(); video?.stop(); } catch {}
    try { audio?.stop(); } catch {}
    liveKit.clearTracks();

    try {
      if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.src = ''; }
      if (audioRef.current) { audioRef.current.pause?.(); audioRef.current.srcObject = null; audioRef.current.src = ''; }
  } catch {}

    if (!KEEP_AWAKE_WHEN_IDLE) { await releaseWakeLock(); }

    try { await liveKit.disconnectFromRoom(); } finally {}

  streamingRef.current = false;
    setStreaming(false);
  console.info('[Streaming] INACTIVE by COMMAND');
  
  try {
    const payload: any = { 
      status: 'stopped',
      isCommand: true
    };
    
    // Include reason if provided
    if (reason) {
      payload.reason = reason;
    }
    
    await apiClient.post('/api/StreamingSessionUpdate', payload);
    
    // ✅ INMEDIATAMENTE después del STOP, obtener la información del timer
    console.log('[StopStream] Fetching session history immediately after STOP command');
    try {
      const sessionData = await streamingClient.fetchLastSessionWithReason();
      console.log('[StopStream] Session data after STOP:', sessionData);
      
      // Disparar evento personalizado para que usePsoStreamingStatus se actualice
      const event = new CustomEvent('streamingSessionUpdated', {
        detail: { session: sessionData }
      });
      window.dispatchEvent(event);
      
    } catch (err) {
      console.warn('[StopStream] Failed to fetch session history after STOP:', err);
    }
    
  } catch (err) {
    console.warn('Failed to notify backend of command stop:', err);
  }
    videoWatchdog.stop();
    streamHealth.stop();
  }, [releaseWakeLock, liveKit, videoWatchdog, streamHealth, setManualStop, setStreaming]);

  // Command handling hook
  const commandHandling = useCommandHandling({
    onStartCommand: startStream,
    onStopCommand: stopStreamForCommand,
    userEmail
  });

  // Bootstrap hook
  const bootstrap = useBootstrap({
    userEmail,
    streamingRef,
    videoRef,
    liveKit,
    presenceClient,
    streamingClient,
    requestWakeLock,
    releaseWakeLock,
    onStartStream: startStream,
    onStopStream: stopStream,
    onHandleCommand: commandHandling.handleCommand,
    onFetchMissedCommands: commandHandling.fetchMissedCommands,
    KEEP_AWAKE_WHEN_IDLE
  });

  useEffect(() => {
    if (!initialized || !userEmail) return;
    
    let cleanupFn: (() => void) | undefined;
    bootstrap.initialize().then(cleanup => {
      cleanupFn = cleanup;
    });

    return () => {
      cleanupFn?.();
    };
  }, [initialized, userEmail, bootstrap]);

  return { 
    videoRef, 
    audioRef, 
    isStreaming, 
    isRetrying, 
    retryCount, 
    cancelPersistentRetries,
    videoTrack: tracksRef.current.video
  };
}