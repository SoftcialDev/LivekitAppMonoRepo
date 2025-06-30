import React, { useRef, useEffect, useState } from 'react';
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
import { useAuth } from '../hooks/useAuth';

const DashboardPage: React.FC = () => {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const audioRef     = useRef<HTMLAudioElement>(null);
  const roomRef      = useRef<Room | null>(null);
  const tracksRef    = useRef<{ video?: LocalVideoTrack; audio?: LocalAudioTrack }>({});
  const streamingRef = useRef(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const { initialized, account } = useAuth();
  const userEmail = account?.username.toLowerCase() ?? '';

  // clients
  const pendingClient   = useRef(new PendingCommandsClient()).current;
  const presenceClient  = useRef(new PresenceClient()).current;
  const streamingClient = useRef(new StreamingClient()).current;
  const pubSubService   = useRef(new WebPubSubClientService()).current;

  const handleCommand = async (cmd: PendingCommand) => {
    console.log(`[Cmd] ${cmd.command} @ ${cmd.timestamp}`);
    console.log('→ before:', streamingRef.current);

    try {
      if (cmd.command === 'START' && !streamingRef.current) {
        console.log('[Stream] STARTing…');
        const { rooms, livekitUrl } = await getLiveKitToken();
        const { token }             = rooms[0];
        const room = new Room();
        await room.connect(livekitUrl, token);
        roomRef.current = room;

        const [v, a] = await Promise.all([
          createLocalVideoTrack(),
          createLocalAudioTrack(),
        ]);
        tracksRef.current.video = v;
        tracksRef.current.audio = a;

        await room.localParticipant.publishTrack(v);
        await room.localParticipant.publishTrack(a);

        if (videoRef.current) v.attach(videoRef.current);
        if (audioRef.current) a.attach(audioRef.current);

        streamingRef.current = true;
        setIsStreaming(true);

        // notify presence + streaming
        console.log('[Streaming] ACTIVE');
        await streamingClient.setActive();
      }

      if (cmd.command === 'STOP' && streamingRef.current) {
        console.log('[Stream] STOPping…');
        const { video, audio } = tracksRef.current;
        if (video) { video.stop(); video.detach(); }
        if (audio) { audio.stop(); audio.detach(); }
        tracksRef.current = {};

        console.log('[Stream] disconnecting…');
        await roomRef.current?.disconnect();
        roomRef.current = null;
        console.log('[Stream] disconnected');

        streamingRef.current = false;
        setIsStreaming(false);

        console.log('[Streaming] INACTIVE');
        await streamingClient.setInactive();
      }

      console.log('→ after:', streamingRef.current);
      const ackCount = await pendingClient.acknowledge([cmd.id]);
      console.log(`[Cmd] ACK’d ${cmd.id} (count=${ackCount})`);
    } catch (err) {
      console.error('[Error] handling command', err);
    }
  };

  useEffect(() => {
    if (!initialized || !userEmail) return;
    let mounted = true;

    (async () => {
      try {
        console.log('[WS] connecting…');
        await pubSubService.connect(userEmail);
        console.log('[WS] connected');
        console.log('[Presence] ONLINE');
        await presenceClient.setOnline();

        // ───────────────────────────────────────────────────────────
        // Try to resume the last session if it stopped less than 5 minutes ago
        // ───────────────────────────────────────────────────────────
        try {
          const last = await streamingClient.fetchLastSession();
          const stoppedAt = last.stoppedAt ? new Date(last.stoppedAt) : null;
          const now = new Date();
          // if still active or stopped under 5m ago → resume
          if (!stoppedAt || (now.getTime() - stoppedAt.getTime()) < 5 * 60_000) {
            console.log('[Streaming] resuming last session automatically');
            const { rooms, livekitUrl } = await getLiveKitToken();
            const { token }             = rooms[0];
            const room = new Room();
            await room.connect(livekitUrl, token);
            roomRef.current = room;

            const [v, a] = await Promise.all([
              createLocalVideoTrack(),
              createLocalAudioTrack(),
            ]);
            tracksRef.current.video = v;
            tracksRef.current.audio = a;

            await room.localParticipant.publishTrack(v);
            await room.localParticipant.publishTrack(a);

            if (videoRef.current) v.attach(videoRef.current);
            if (audioRef.current) a.attach(audioRef.current);

            streamingRef.current = true;
            setIsStreaming(true);
            console.log('[Streaming] ACTIVE (resumed)');
            await streamingClient.setActive();
          }
        } catch (resumeErr) {
          console.warn('[Streaming] resume skipped:', resumeErr);
        }

        // WS disconnect → mark streaming inactive
        pubSubService.onDisconnected(async () => {
          if (!mounted) return;
          console.warn('[WS] disconnected');
          presenceClient.setOffline();
          if (streamingRef.current) {
            console.log('[Streaming] marking INACTIVE on WS close');
            await streamingClient.setInactive();
            streamingRef.current = false;
            setIsStreaming(false);
          }
        });

        // live commands
        pubSubService.onMessage(data => {
          if (!mounted) return;
          handleCommand(data as PendingCommand);
        });

        // fallback fetch
        const missed = await pendingClient.fetch();
        console.log('[Cmd] fetched', missed.length, 'pending');
        for (const cmd of missed) {
          if (!mounted) break;
          await handleCommand(cmd);
        }
      } catch (err) {
        console.error('[App] init error', err);
      }
    })();

    return () => {
      mounted = false;
      console.log('[App] cleanup');
      pubSubService.disconnect();
      roomRef.current?.disconnect();
      presenceClient.setOffline();
    };
  }, [initialized, userEmail]);

  return (
    <div className="flex items-center justify-center h-screen p-4 bg-[#764E9F]">
      <div className="flex flex-col h-full w-full max-w-4xl rounded-xl overflow-hidden bg-black">
        <div className="flex-1 min-h-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            controls={false}
            className="w-full h-full object-cover"
          />
          <audio ref={audioRef} autoPlay hidden />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
