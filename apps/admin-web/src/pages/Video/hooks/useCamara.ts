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
const startStream = useCallback(async () => {
  if (streamingRef.current) return;

  // 1) Ensure PubSub + presence
  if (!pubSubService.isConnected()) {
    await pubSubService.connect(userEmail);
    await presenceClient.setOnline();
    await pubSubService.joinGroup('presence');
    await pubSubService.joinGroup(`commands:${userEmail}`);
  }

  // 2) Prime camera/mic permissions (stops tracks immediately)
  try {
    await ensureCameraPermission();
  } catch {
    return;
  }

  // 3) Choose camera (with fallback)
  let videoTrack: LocalVideoTrack;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === 'videoinput');
    videoTrack = await createVideoTrackWithFallback(cams);
  } catch (err) {
    console.error('[Stream] video setup failed', err);
    alert('Unable to access any camera.');
    return;
  }

  // 4) Connect to LiveKit
  const { rooms, livekitUrl } = await getLiveKitToken();
  const room = new Room();
  try {
    await room.connect(livekitUrl, rooms[0].token);
  } catch (err) {
    console.error('[WS] LiveKit connect failed', err);
    try {
      videoTrack?.stop();
      videoTrack?.detach();
    } catch {}
    return;
  }

  roomRef.current = room;
  console.info('[WS] LiveKit connected');

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
  tracksRef.current.video = videoTrack;
  await room.localParticipant.publishTrack(videoTrack);
  videoTrack.attach(videoRef.current!);

  await requestWakeLock();

/*  try {
    const audioTrack = await createLocalAudioTrack();
    tracksRef.current.audio = audioTrack;
    await room.localParticipant.publishTrack(audioTrack);
  } catch (err) {
    console.warn('[Stream] mic setup failed, continuing without audio', err);
  }*/

  streamingRef.current = true;
  setIsStreaming(true);
  console.info('[Streaming] ACTIVE');
  await streamingClient.setActive();
}, [userEmail, requestWakeLock, streamingClient]);
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
        await stopStream();
      } else {
        // Defensive default: treat unknown commands as STOP
        await stopStream();
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
  [startStream, stopStream, pendingClient],
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
        const last = await streamingClient.fetchLastSession();
        const stoppedAt = last.stoppedAt ? new Date(last.stoppedAt) : null;
        if (!stoppedAt || Date.now() - stoppedAt.getTime() < 5 * 60_000) {
          console.info('[Streaming] resuming');
          await startStream();
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
      if (msg?.employeeEmail && msg.employeeEmail.toLowerCase() !== userEmail) return;

      if (msg?.command === 'START' || msg?.command === 'STOP') {
        void handleCommand(msg as PendingCommand);
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
      if (document.visibilityState !== 'visible') return;
      try {
        await pubSubService.joinGroup('presence');
        await pubSubService.joinGroup(`commands:${userEmail}`);
        await presenceClient.setOnline();
        if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
          await requestWakeLock();
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
  } catch (e) {
    console.warn('[WS] onPageShow handler failed', e);
  }
};

    window.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('pageshow', onPageShow);

    // Sleep detector: if the tab sleeps, interval fire will be delayed significantly.
    let lastTick = Date.now();
    const tick = setInterval(async () => {
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;
      if (delta > 60_000) {
        console.warn('[WS] sleep detected, forcing reconnect');
        await pubSubService.reconnect();
        await presenceClient.setOnline();
        if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
          await requestWakeLock();
        }
      }
    }, 15_000);

    return () => {
      mounted = false;
      window.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('pageshow', onPageShow);
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

  return { videoRef, audioRef, isStreaming };
}
