import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Room,
  LocalVideoTrack,
  createLocalVideoTrack,
} from 'livekit-client';
import { getLiveKitToken } from '../services/livekitClient';
import { PendingCommandsClient, PendingCommand } from '../services/pendingCommandsClient';
import { PresenceClient } from '../services/presenceClient';
import { StreamingClient } from '../services/streamingClient';
import { WebPubSubClientService } from '../services/webpubsubClient';
import { useAuth } from '../features/auth/hooks/useAuth';

/**
 * Requests camera access once.
 * - If the user denies (NotAllowedError), alerts detected cameras and asks to enable & refresh.
 * - If the default device is busy (NotReadableError), logs a warning and returns.
 *
 * @throws NotAllowedError if permission is denied
 */
async function ensureCameraPermission(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices
        .filter(d => d.kind === 'videoinput')
        .map(c => c.label || `ID: ${c.deviceId}`);
      alert(
        `Camera access blocked.\nDetected cameras: ${cams.join(', ')}\n\n` +
        `Please enable camera permission for this site in your browser settings and refresh.`
      );
      throw err;
    }
    if (err.name === 'NotReadableError') {
      console.warn('[Camera] Default device busy, will try others', err);
      return;
    }
    throw err;
  }
}

/**
 * Tries to create a LocalVideoTrack in this order:
 *  1. “Logi C270 HD”
 *  2. Any other camera (excluding “Logitech C930e”)
 * If a device fails with NotReadableError, moves on to the next.
 * If all attempts fail, falls back to default camera.
 *
 * @param cameras – list of 'videoinput' devices
 * @returns a working LocalVideoTrack
 * @throws any error other than NotReadableError
 */
async function createVideoTrackWithFallback(
  cameras: MediaDeviceInfo[]
): Promise<LocalVideoTrack> {
  const filtered = cameras.filter(c => !/Logi(?:tech)? C930e/i.test(c.label));
  const prioritized: MediaDeviceInfo[] = [];
  const c270 = filtered.find(c => c.label.includes('Logi C270 HD'));
  if (c270) prioritized.push(c270);
  for (const cam of filtered) {
    if (cam !== c270) prioritized.push(cam);
  }

  for (const cam of prioritized) {
    try {
      return await createLocalVideoTrack({ deviceId: { exact: cam.deviceId } });
    } catch (err: any) {
      if (err.name === 'NotReadableError') {
        console.warn(`[Camera] "${cam.label}" busy, trying next…`, err);
        continue;
      }
      throw err;
    }
  }

  // last resort: default camera
  return createLocalVideoTrack();
}

/**
 * Hook that manages LiveKit streaming:
 * - Requests permission once
 * - Picks “Logi C270 HD” first, excludes C930e
 * - Falls back on NotReadableError
 * - Connects/disconnects, publishes tracks
 * - Handles presence and START/STOP commands with proper parsing
 *
 * @returns
 *  videoRef: RefObject<HTMLVideoElement>;
 *  audioRef: RefObject<HTMLAudioElement>;
 *  isStreaming: boolean;
 */
export function useStreamingDashboard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const roomRef = useRef<Room | null>(null);
  const tracksRef = useRef<{ video?: LocalVideoTrack;}>({});
  const streamingRef = useRef(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const { initialized, account } = useAuth();
  const userEmail = account?.username.toLowerCase() ?? '';

  const pendingClient = useRef(new PendingCommandsClient()).current;
  const presenceClient = useRef(new PresenceClient()).current;
  const streamingClient = useRef(new StreamingClient()).current;
  const pubSubService = useRef(new WebPubSubClientService()).current;

  /** Starts the stream, handling permission and device fallback. */
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
      const cams = devices.filter(d => d.kind === 'videoinput');
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

    await room.localParticipant.publishTrack(videoTrack);
    videoTrack.attach(videoRef.current!);


    streamingRef.current = true;
    setIsStreaming(true);
    console.info('[Streaming] ACTIVE');
    await streamingClient.setActive();
  }, [streamingClient]);

  /** Stops the stream and disconnects. */
  const stopStream = useCallback(async () => {
    if (!streamingRef.current) return;

    const { video } = tracksRef.current;
    video?.stop(); video?.detach();
    tracksRef.current = {};

    await roomRef.current?.disconnect();
    roomRef.current = null;

    streamingRef.current = false;
    setIsStreaming(false);
    console.info('[Streaming] INACTIVE');
    await streamingClient.setInactive();
  }, [streamingClient]);

  /** Processes a PendingCommand, with correct fields. */
const handleCommand = useCallback(
  async (cmd: PendingCommand) => {
    console.info(`[WS Cmd] "${cmd.command}" @ ${cmd.timestamp}`);

    // Ejecuta siempre el START/STOP
    if (cmd.command === 'START') {
      await startStream();
    } else {
      await stopStream();
    }

    // Sólo ack si tenemos un id válido
    if (cmd.id) {
      try {
        await pendingClient.acknowledge([cmd.id]);
        console.debug(`[WS Cmd] acknowledged ${cmd.id}`);
      } catch (err) {
        console.warn(`Failed to acknowledge ${cmd.id}`, err);
      }
    }
  },
  [pendingClient, startStream, stopStream]
);

  useEffect(() => {
    if (!initialized || !userEmail) return;
    let mounted = true;

    (async () => {
      console.debug('[WS] connecting…');
      await pubSubService.connect(userEmail);
      console.info(`[WS] connected to "${userEmail}"`);
      await presenceClient.setOnline();

      // resume short sessions
      try {
        const last = await streamingClient.fetchLastSession();
        const stoppedAt = last.stoppedAt ? new Date(last.stoppedAt) : null;
        if (!stoppedAt || Date.now() - stoppedAt.getTime() < 5 * 60_000) {
          console.info('[Streaming] resuming');
          await startStream();
        }
      } catch { /* none */ }

      pubSubService.onDisconnected(async () => {
        if (!mounted) return;
        console.warn('[WS] disconnected');
        await presenceClient.setOffline();
        await stopStream();
      });

      pubSubService.onMessage(async (raw) => {
  let msg: any;
  try {
    msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return; // mensaje no JSON válido
  }

  // Sólo procesar si viene con un comando válido
  if (msg.command === 'START' || msg.command === 'STOP') {
    await handleCommand(msg as PendingCommand);
  }
  // de lo contrario (presencia, etc.) lo ignoramos aquí
});

      const missed = await pendingClient.fetch();
      console.info(`[WS] fetched ${missed.length} commands`);
      for (const cmd of missed) {
        if (!mounted) break;
        await handleCommand(cmd);
      }
    })();

    return () => {
      mounted = false;
      console.debug('[App] cleanup');
      pubSubService.disconnect();
      roomRef.current?.disconnect();
      presenceClient.setOffline();
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
  ]);

  return { videoRef, audioRef, isStreaming };
}
