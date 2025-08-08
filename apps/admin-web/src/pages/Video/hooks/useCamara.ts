import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Room,
  LocalVideoTrack,
  LocalAudioTrack,
  createLocalVideoTrack,
  createLocalAudioTrack,
} from 'livekit-client';
import { useAuth } from '@/shared/auth/useAuth';
import { PendingCommand, PendingCommandsClient } from '@/shared/api/pendingCommandsClient';
import { PresenceClient } from '@/shared/api/presenceClient';
import { StreamingClient } from '@/shared/api/streamingClient';
import { WebPubSubClientService } from '@/shared/api/webpubsubClient';
import { getLiveKitToken } from '@/shared/api/livekitClient';

/**
 * Feature switches
 * - KEEP_AWAKE_WHEN_IDLE keeps the tab awake even when not streaming, which greatly reduces
 *   the chance that the browser throttles timers or disconnects WebSocket when the OS powers down the screen.
 */
const KEEP_AWAKE_WHEN_IDLE = true;

/**
 * Basic wake lock sentinel typing for browsers that expose navigator.wakeLock.
 */
type WakeLockSentinelAny = any;

/**
 * Requests camera and microphone permission once so that later track creation
 * does not trigger new permission prompts. If the user denies access, it shows
 * a list of detected cameras with guidance to enable permissions and refresh.
 * If the default device is busy (e.g., in use by another app), it logs a warning
 * and returns so the caller can attempt alternative devices.
 *
 * @remarks
 * - This function stops all acquired media tracks immediately after permission
 *   is granted; it is only meant to prime permissions, not to keep a live stream.
 * - It distinguishes between `NotAllowedError` (permission denied) and
 *   `NotReadableError` (device busy).
 *
 * @returns {Promise<void>} Resolves when permission is confirmed or the busy-device
 * condition is handled; rejects for permission denial or unexpected errors.
 *
 * @throws {DOMException} Throws when the user denies permission (`NotAllowedError`)
 * and rethrows any unexpected error types. For `NotReadableError`, it does not throw.
 *
 * @example
 * ```ts
 * try {
 *   await ensureCameraPermission();
 *   // Safe to call createLocalVideoTrack/createLocalAudioTrack now
 * } catch (e) {
 *   // Handle explicit permission denial or unexpected errors
 * }
 * ```
 */
async function ensureCameraPermission(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices
        .filter((d) => d.kind === 'videoinput')
        .map((c) => c.label || `ID: ${c.deviceId}`);
      alert(
        `Camera access blocked.\nDetected cameras: ${cams.join(', ')}\n\n` +
          `Enable camera & microphone permissions for this site and refresh.`,
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
 * Attempts to create a `LocalVideoTrack` by prioritizing specific cameras,
 * falling back when a device is busy or unavailable.
 *
 * The selection order is:
 *  1. Camera with label containing `"Logi C270 HD"`
 *  2. Any other camera except those matching `"Logitech C930e"`
 *  3. The browser's default camera
 *
 * @remarks
 * - Filters out Logitech C930e devices from all attempts.
 * - If a camera fails with a `NotReadableError` (device busy), the next
 *   available camera in the list is tried.
 * - Any other error type is rethrown immediately.
 * - If all prioritized devices fail, a default camera is requested with no
 *   device ID constraint.
 *
 * @param cameras - Array of `MediaDeviceInfo` objects representing available
 *                  video input devices.
 *
 * @returns {Promise<LocalVideoTrack>} Resolves with the first successfully
 * created `LocalVideoTrack` according to the priority rules.
 *
 * @throws {DOMException} Throws if all prioritized devices fail for reasons
 * other than `NotReadableError`.
 *
 * @example
 * ```ts
 * const devices = await navigator.mediaDevices.enumerateDevices();
 * const cams = devices.filter(d => d.kind === 'videoinput');
 * const track = await createVideoTrackWithFallback(cams);
 * track.attach(videoElement);
 * ```
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
 * Responsibilities
 * - Acquire media permissions once and gracefully handle busy devices
 * - Choose preferred camera and publish tracks to a LiveKit room
 * - Maintain presence and handle START/STOP commands via WebPubSub
 * - Keep the tab awake during streaming and (optionally) when idle
 * - Recover cleanly after OS/browser sleep using visibility/network hooks and a drift detector
 *
 * Returns
 * - videoRef: attach this to a <video> element to render the local camera
 * - audioRef: reserved for future local audio rendering (not required to publish)
 * - isStreaming: UI-friendly boolean state
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
  const pubSubService = useRef(new WebPubSubClientService()).current;

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
 * Initiates the streaming session by:
 * 1. Ensuring a connection to the WebPubSub service and joining the presence group.
 * 2. Requesting camera and microphone permissions.
 * 3. Selecting and publishing a prioritized video track.
 * 4. Connecting to a LiveKit room and publishing both video and (optionally) audio tracks.
 * 5. Acquiring a screen wake lock to prevent the device from sleeping while streaming.
 * 6. Updating presence and streaming state in the backend.
 *
 * @remarks
 * - If streaming is already active (`streamingRef.current` is true), the function exits early.
 * - Skips publishing audio if microphone access fails.
 * - Uses `createVideoTrackWithFallback` to prefer specific cameras over others.
 * - Attaches the video track to the provided `videoRef` element for local preview.
 * - Wake lock is requested immediately after publishing the video track.
 * - Presence and streaming status are updated through the respective API clients.
 *
 * @async
 * @returns {Promise<void>} Resolves when the streaming session is fully started and presence is updated.
 *
 * @throws Will propagate any unexpected errors during LiveKit connection or track publication.
 *
 * @example
 * ```ts
 * await startStream();
 * // The local video preview will appear and presence will be marked as active.
 * ```
 */
const startStream = useCallback(async () => {
  if (streamingRef.current) return;

  if (!pubSubService.isConnected()) {
    await pubSubService.connect(userEmail);
    await presenceClient.setOnline();
    await pubSubService.joinGroup('presence');
  }

  try {
    await ensureCameraPermission();
  } catch {
    return;
  }

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

  const { rooms, livekitUrl } = await getLiveKitToken();
  const room = new Room();
  await room.connect(livekitUrl, rooms[0].token);
  roomRef.current = room;
  console.info('[WS] LiveKit connected');

  tracksRef.current.video = videoTrack;
  await room.localParticipant.publishTrack(videoTrack);
  videoTrack.attach(videoRef.current!);

  await requestWakeLock();

  try {
    const audioTrack = await createLocalAudioTrack();
    tracksRef.current.audio = audioTrack;
    await room.localParticipant.publishTrack(audioTrack);
    // Not attaching local audio element by default; publish is enough.
  } catch (err) {
    console.warn('[Stream] mic setup failed, continuing without audio', err);
  }

  streamingRef.current = true;
  setIsStreaming(true);
  console.info('[Streaming] ACTIVE');
  await streamingClient.setActive();
}, [
  streamingClient,
  pubSubService,
  presenceClient,
  userEmail,
  requestWakeLock,
]);

/**
 * Stops the active streaming session by:
 * 1. Stopping and detaching the published video track.
 * 2. Stopping the published audio track (without detaching, as it's not attached to a DOM element).
 * 3. Clearing track references to free memory.
 * 4. Optionally releasing the screen wake lock if the application is not configured
 *    to keep the device awake while idle (`KEEP_AWAKE_WHEN_IDLE` is false).
 * 5. Disconnecting from the LiveKit room.
 * 6. Updating internal state flags and notifying the backend that streaming is inactive.
 *
 * @remarks
 * - If no active streaming session exists (`streamingRef.current` is false), the function exits immediately.
 * - The audio track is never detached because it is not bound to an audio element for local playback.
 * - When `KEEP_AWAKE_WHEN_IDLE` is `true`, the wake lock will persist after stopping the stream,
 *   preventing the device from sleeping while the user remains online.
 *
 * @async
 * @returns {Promise<void>} Resolves once tracks are stopped, the room is disconnected,
 * and the inactive state is reported to the backend.
 *
 * @example
 * ```ts
 * await stopStream();
 * // The camera and microphone will stop, the LiveKit room will disconnect,
 * // and the user's streaming status will be set to inactive.
 * ```
 */
const stopStream = useCallback(async () => {
  if (!streamingRef.current) return;

  const { video, audio } = tracksRef.current;
  video?.stop();
  video?.detach();
  audio?.stop(); // do not call detach on audio
  tracksRef.current = {};

  if (!KEEP_AWAKE_WHEN_IDLE) {
    await releaseWakeLock();
  }

  await roomRef.current?.disconnect();
  roomRef.current = null;

  streamingRef.current = false;
  setIsStreaming(false);
  console.info('[Streaming] INACTIVE');
  await streamingClient.setInactive();
}, [streamingClient, releaseWakeLock]);

/**
 * Processes an incoming pending command and executes the corresponding
 * streaming action (`START` or `STOP`). If the command contains a valid `id`,
 * it will be acknowledged back to the pending command service.
 *
 * @remarks
 * - Supported commands are:
 *   - `"START"`: initiates the streaming session via {@link startStream}.
 *   - `"STOP"`: terminates the streaming session via {@link stopStream}.
 * - Any other command string is treated as `"STOP"` by default in this implementation.
 * - Acknowledgement is only sent if `cmd.id` is truthy.
 * - Errors during acknowledgement are caught and logged as warnings without throwing.
 *
 * @param cmd - The {@link PendingCommand} object containing:
 *   - `command`: `"START"` or `"STOP"`.
 *   - `timestamp`: When the command was issued (for logging/debugging).
 *   - `id` (optional): Identifier used for acknowledging the command.
 *
 * @returns {Promise<void>} Resolves once the command has been processed and, if applicable,
 * the acknowledgement has been sent. Does not reject on acknowledgement errors.
 *
 * @example
 * ```ts
 * await handleCommand({ command: 'START', timestamp: Date.now(), id: '123' });
 * // → Starts streaming and acknowledges the command with ID '123'.
 *
 * await handleCommand({ command: 'STOP', timestamp: Date.now() });
 * // → Stops streaming without sending any acknowledgement (no id present).
 * ```
 */
const handleCommand = useCallback(
  async (cmd: PendingCommand) => {
    console.info(`[WS Cmd] "${cmd.command}" @ ${cmd.timestamp}`);
    if (cmd.command === 'START') {
      await startStream();
    } else {
      await stopStream();
    }
    if (cmd.id) {
      try {
        await pendingClient.acknowledge([cmd.id]);
        console.debug(`[WS Cmd] acknowledged ${cmd.id}`);
      } catch (err) {
        console.warn(`Failed to acknowledge ${cmd.id}`, err);
      }
    }
  },
  [pendingClient, startStream, stopStream],
);

/**
 * Initializes and manages the WebSocket (Web PubSub) connection, presence tracking,
 * wake lock handling, and restoration of recent streaming sessions when the component mounts.
 *
 * @remarks
 * This effect:
 * 1. Connects to the Web PubSub service using the authenticated user's email.
 * 2. Marks the user as online in the presence service.
 * 3. Requests a wake lock if {@link KEEP_AWAKE_WHEN_IDLE} is enabled and no active stream exists.
 * 4. Checks the most recent streaming session:
 *    - If it stopped less than 5 minutes ago, automatically resumes streaming.
 * 5. Subscribes to WebSocket events:
 *    - **Disconnected:** Marks the user offline and stops streaming.
 *    - **Connected:** Rejoins the `"presence"` group, marks online, and re-requests wake lock if needed.
 *    - **Message:** Parses incoming JSON messages and executes {@link handleCommand} if the command is `"START"` or `"STOP"`.
 * 6. Fetches and processes any missed commands on mount.
 *
 * @dependency
 * - {@link pubSubService} for WS connection and message handling.
 * - {@link presenceClient} for updating presence status.
 * - {@link streamingClient} for retrieving last session details.
 * - {@link handleCommand} to process START/STOP commands.
 * - {@link startStream} / {@link stopStream} to manage streaming state.
 * - {@link requestWakeLock} to keep device awake.
 *
 * @triggers
 * - Runs when `initialized` or `userEmail` changes.
 *
 * @cleanup
 * - Marks the component as unmounted.
 * - Disconnects the WebSocket.
 * - Disconnects from the LiveKit room if active.
 * - Sets the user offline in the presence service.
 *
 * @example
 * ```ts
 * useEffect(() => {
 *   // Will connect WS, set presence online, restore streaming if needed,
 *   // and handle reconnection events automatically.
 * }, [initialized, userEmail]);
 * ```
 */
useEffect(() => {
  if (!initialized || !userEmail) return;
  let mounted = true;

  (async () => {
    console.debug('[WS] connecting…');
    await pubSubService.connect(userEmail);
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

    pubSubService.onDisconnected(async () => {
      if (!mounted) return;
      console.warn('[WS] disconnected');
      await presenceClient.setOffline();
      await stopStream();
    });

    pubSubService.onConnected(async () => {
      if (!mounted) return;
      console.info('[WS] reconnected');
      await pubSubService.joinGroup('presence');
      await presenceClient.setOnline();
      if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
        await requestWakeLock();
      }
    });

    pubSubService.onMessage(async (raw) => {
      let msg: any;
      try {
        msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        return;
      }
      if (msg.command === 'START' || msg.command === 'STOP') {
        await handleCommand(msg as PendingCommand);
      }
    });

    const missed = await pendingClient.fetch();
    console.info(`[WS] fetched ${missed.length} commands`);
    for (const cmd of missed) {
      if (!mounted) break;
      await handleCommand(cmd);
    }
  })();

   /**
 * Handles the `visibilitychange` event to re-acquire wake lock and restore presence
 * when the page becomes visible again after being hidden.
 *
 * @remarks
 * - Only triggers actions when `document.visibilityState` is `"visible"`.
 * - Re-requests a wake lock if {@link KEEP_AWAKE_WHEN_IDLE} is enabled
 *   or a stream is currently active (`streamingRef.current`).
 * - Ensures the user rejoins the `"presence"` group and is marked online
 *   in the presence service.
 *
 * @returns {Promise<void>} Resolves when wake lock and presence updates are completed.
 */
const onVisible = async (): Promise<void> => {
  if (document.visibilityState === 'visible') {
    if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
      await requestWakeLock();
    }
    await pubSubService.joinGroup('presence');
    await presenceClient.setOnline();
  }
};

/**
 * Handles the `online` event (browser regains network connectivity) to
 * re-acquire wake lock and restore presence after a connectivity loss.
 *
 * @remarks
 * - Re-requests a wake lock if {@link KEEP_AWAKE_WHEN_IDLE} is enabled
 *   or a stream is currently active (`streamingRef.current`).
 * - Ensures the user rejoins the `"presence"` group and is marked online
 *   in the presence service.
 *
 * @returns {Promise<void>} Resolves when wake lock and presence updates are completed.
 */
const onOnline = async (): Promise<void> => {
  if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
    await requestWakeLock();
  }
  await pubSubService.joinGroup('presence');
  await presenceClient.setOnline();
};

/**
 * Handles the `pageshow` event (page is restored from the bfcache or session history)
 * to re-acquire wake lock and restore presence.
 *
 * @remarks
 * - This event can fire when navigating back to the page or restoring it from
 *   the browser's Back/Forward Cache (bfcache).
 * - Re-requests a wake lock if {@link KEEP_AWAKE_WHEN_IDLE} is enabled
 *   or a stream is currently active (`streamingRef.current`).
 * - Ensures the user rejoins the `"presence"` group and is marked online
 *   in the presence service.
 *
 * @returns {Promise<void>} Resolves when wake lock and presence updates are completed.
 */
const onPageShow = async (): Promise<void> => {
  if (KEEP_AWAKE_WHEN_IDLE || streamingRef.current) {
    await requestWakeLock();
  }
  await pubSubService.joinGroup('presence');
  await presenceClient.setOnline();
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
        console.warn('[WS] sleep detected, forcing rejoin');
        try {
          await pubSubService.disconnect();
        } catch {}
        await pubSubService.connect(userEmail);
        await pubSubService.joinGroup('presence');
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
        pubSubService.disconnect();
        roomRef.current?.disconnect();
        presenceClient.setOffline();
      })();
    };
  }, [
    initialized,
    userEmail,
    pubSubService,
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
