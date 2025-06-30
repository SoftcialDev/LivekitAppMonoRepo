import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Room,
  LocalVideoTrack,
  LocalAudioTrack,
  createLocalVideoTrack,
  createLocalAudioTrack,
} from 'livekit-client';
import { getLiveKitToken } from '../services/livekitClient';
import {
  PendingCommandsClient,
  PendingCommand,
} from '../services/pendingCommandsClient';
import { PresenceClient } from '../services/presenceClient';
import { StreamingClient } from '../services/streamingClient';
import { WebPubSubClientService } from '../services/webpubsubClient';
import { useAuth } from './useAuth';

/**
 * Custom hook to manage LiveKit streaming lifecycle, presence,
 * pending-command delivery via Web PubSub, and selection of a
 * specific camera device with fallback preferences.
 *
 * @remarks
 * - On mount, logs connected camera count and labels (after requesting
 *   video permission).  
 * - Chooses in order:
 *   1. “Logi C270 HD”  
 *   2. any other Logitech camera (label includes “Logi” or “Logitech”)  
 *   3. default camera  
 * - Connects to Web PubSub using the user’s email as group name.  
 * - Sets presence online/offline.  
 * - Resumes an active or recently stopped session (<5 min) on mount.  
 * - Publishes local audio/video tracks when starting.  
 * - Acknowledges and handles START/STOP commands.  
 *
 * @returns
 * - `videoRef` – ref to attach the local video track element  
 * - `audioRef` – ref to attach the local audio track element  
 * - `isStreaming` – boolean flag for current streaming state
 */
export function useStreamingDashboard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const roomRef = useRef<Room | null>(null);
  const tracksRef = useRef<{
    video?: LocalVideoTrack;
    audio?: LocalAudioTrack;
  }>({});
  const streamingRef = useRef(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const { initialized, account } = useAuth();
  const userEmail = account?.username.toLowerCase() ?? '';

  const pendingClient = useRef(new PendingCommandsClient()).current;
  const presenceClient = useRef(new PresenceClient()).current;
  const streamingClient = useRef(new StreamingClient()).current;
  const pubSubService = useRef(new WebPubSubClientService()).current;

  /**
   * Start streaming:
   * 1. Enumerate cameras and select by preference:
   *    a) “Logi C270 HD”  
   *    b) any other Logitech (“Logi” or “Logitech” in label)  
   *    c) default  
   * 2. Connect to LiveKit.  
   * 3. Create & publish tracks.  
   * 4. Attach tracks to DOM.  
   * 5. Update streaming state & presence.
   */
  const startStream = useCallback(async () => {
    if (streamingRef.current) {
      console.debug('[Stream] already streaming; skipping start');
      return;
    }
    console.debug('[Stream] attempting to start…');

    // --- Camera enumeration & selection with fallback ---
    let videoCaptureOptions: { deviceId?: string; facingMode?: "user" | "environment" | "left" | "right" } | undefined;
    if (navigator.mediaDevices?.enumerateDevices) {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter(d => d.kind === 'videoinput');
        console.info(`Detected ${cams.length} video input device(s):`);
        cams.forEach((cam, idx) => {
          console.info(`  [${idx + 1}] Label: "${cam.label || 'Unknown'}", ID: ${cam.deviceId}`);
        });

        // 1) Try exact "Logi C270 HD"
        let chosen = cams.find(c => c.label.includes('Logi C270 HD'));
        if (chosen) {
          console.info(`[Camera] Selecting exact match "${chosen.label}"`);
        } else {
          // 2) Try any other Logitech
          chosen = cams.find(c =>
            /Logi(?:tech)?/i.test(c.label)
          );
          if (chosen) {
            console.warn(`[Camera] "Logi C270 HD" not found; falling back to Logitech camera "${chosen.label}"`);
          } else {
            console.warn('[Camera] No Logitech camera found; using default camera');
          }
        }

        if (chosen) {
          videoCaptureOptions = { deviceId: chosen.deviceId };
        }
      } catch (err) {
        console.warn('[Camera] Could not enumerate devices; using default', err);
      }
    }

    // --- LiveKit connection & track publishing ---
    const { rooms, livekitUrl } = await getLiveKitToken();
    const { token } = rooms[0];
    const room = new Room();
    await room.connect(livekitUrl, token);
    roomRef.current = room;

    const [videoTrack, audioTrack] = await Promise.all([
      createLocalVideoTrack(videoCaptureOptions),
      createLocalAudioTrack(),
    ]);
    tracksRef.current = { video: videoTrack, audio: audioTrack };

    await room.localParticipant.publishTrack(videoTrack);
    await room.localParticipant.publishTrack(audioTrack);

    videoTrack.attach(videoRef.current!);
    audioTrack.attach(audioRef.current!);

    streamingRef.current = true;
    setIsStreaming(true);
    console.info('[Streaming] ACTIVE');
    await streamingClient.setActive();
  }, [streamingClient]);

  /**
   * Stop streaming:
   * - Unpublish & detach tracks.  
   * - Disconnect the LiveKit room.  
   * - Update streaming state & presence.
   */
  const stopStream = useCallback(async () => {
    if (!streamingRef.current) {
      console.debug('[Stream] not streaming; skipping stop');
      return;
    }
    console.debug('[Stream] stopping…');
    const { video, audio } = tracksRef.current;
    video?.stop(); video?.detach();
    audio?.stop(); audio?.detach();
    tracksRef.current = {};

    await roomRef.current?.disconnect();
    roomRef.current = null;

    streamingRef.current = false;
    setIsStreaming(false);
    console.info('[Streaming] INACTIVE');
    await streamingClient.setInactive();
  }, [streamingClient]);

  /**
   * Handle an incoming pending command: START or STOP.
   * After executing, acknowledge the command.
   *
   * @param cmd – the pending command object received from the server
   */
  const handleCommand = useCallback(
    async (cmd: PendingCommand) => {
      console.debug(`[Cmd] received ${cmd.command} @ ${cmd.timestamp}`);
      if (cmd.command === 'START') {
        await startStream();
      }
      if (cmd.command === 'STOP') {
        await stopStream();
      }
      const ackCount = await pendingClient.acknowledge([cmd.id]);
      console.debug(`[Cmd] acknowledged ${cmd.id} (count=${ackCount})`);
    },
    [pendingClient, startStream, stopStream]
  );

  /**
   * Main effect: on mount, connect to PubSub, set presence,
   * resume recent sessions, subscribe to live commands,
   * fetch & handle pending commands; and clean up on unmount.
   */
  useEffect(() => {
    if (!initialized || !userEmail) return;
    let mounted = true;

    (async () => {
      console.debug('[WS] connecting to PubSub…');
      await pubSubService.connect(userEmail);
      console.info('[WS] connected');
      await presenceClient.setOnline();

      // Resume a session if it stopped <5 minutes ago
      try {
        const last = await streamingClient.fetchLastSession();
        const stoppedAt = last.stoppedAt ? new Date(last.stoppedAt) : null;
        const ageMs = stoppedAt ? Date.now() - stoppedAt.getTime() : Infinity;
        if (!stoppedAt || ageMs < 5 * 60_000) {
          console.info('[Streaming] resuming previous session');
          await startStream();
        }
      } catch (err) {
        console.warn('[Streaming] resume skipped:', err);
      }

      // On WebSocket disconnect, mark offline & stop streaming
      pubSubService.onDisconnected(async () => {
        if (!mounted) return;
        console.warn('[WS] disconnected');
        await presenceClient.setOffline();
        await stopStream();
      });

      // Listen for live commands
      pubSubService.onMessage(data => {
        if (mounted) handleCommand(data as PendingCommand);
      });

      // Fetch & process any missed commands
      const missed = await pendingClient.fetch();
      console.info(`[Cmd] fetched ${missed.length} pending`);
      for (const cmd of missed) {
        if (!mounted) break;
        await handleCommand(cmd);
      }
    })();

    return () => {
      mounted = false;
      console.debug('[App] cleaning up');
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
