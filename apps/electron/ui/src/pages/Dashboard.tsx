import React, { useRef, useEffect, useState } from 'react';
import {
  Room,
  createLocalVideoTrack,
  createLocalAudioTrack,
} from 'livekit-client';
import { getLiveKitToken } from '../services/livekitClient';
import {
  PendingCommandsClient,
  PendingCommand,
} from '../services/pendingCommandsClient';
import { PresenceClient } from '../services/presenceClient';
import { WebPubSubClientService } from '../services/webpubsubClient';
import { useAuth } from '../hooks/useAuth';

const DashboardPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const roomRef = useRef<Room | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const { initialized, account } = useAuth();

  const pendingClient = useRef(new PendingCommandsClient()).current;
  const presenceClient = useRef(new PresenceClient()).current;
  const pubSubService = useRef(new WebPubSubClientService()).current;

  /**
   * Handles an incoming camera command.
   *
   * @param cmd - The pending command received from Web PubSub or fallback.
   */
  const handleCommand = async (cmd: PendingCommand) => {
    console.log(`[Cmd] Received ${cmd.command} at ${cmd.timestamp}`);
    try {
      // START: connect to LiveKit and publish media
      if (cmd.command === 'START' && !isStreaming) {
        console.log('[Stream] Starting…');
        const { rooms, livekitUrl } = await getLiveKitToken();
        const { token } = rooms[0];
        const room = new Room();
        await room.connect(livekitUrl, token);
        roomRef.current = room;

        const [v, a] = await Promise.all([
          createLocalVideoTrack(),
          createLocalAudioTrack(),
        ]);
        await room.localParticipant.publishTrack(v);
        await room.localParticipant.publishTrack(a);
        v.attach(videoRef.current!);
        a.attach(audioRef.current!);

        setIsStreaming(true);
        console.log('[Presence] setting online');
        await presenceClient.setOnline();
      }

      // STOP: always process STOP to teardown streaming
      if (cmd.command === 'STOP') {
        console.log('[Cmd] STOP received');
        if (isStreaming) {
          console.log('[Stream] Stopping…');
          roomRef.current?.disconnect();
          roomRef.current = null;
          setIsStreaming(false);
        }
        console.log('[Presence] setting offline');
        await presenceClient.setOffline();
      }

      // Acknowledge the command in backend
      const ackCount = await pendingClient.acknowledge([cmd.id]);
      console.log(`[Cmd] Acknowledged ${cmd.id} (count=${ackCount})`);
    } catch (err) {
      console.error('[Error] handling command', err);
    }
  };

  useEffect(() => {
    if (!initialized || !account) return;
    const userEmail = account.username.toLowerCase();
    let mounted = true;

    (async () => {
      try {
        console.log('[WS] connecting to PubSub…');
        await pubSubService.connect(userEmail);
        console.log('[WS] connected');

        // Handle WS disconnects and fetch missed commands
        pubSubService.onDisconnected(async () => {
          console.warn('[WS] disconnected – fetching pending…');
          if (!mounted) return;
          const missed = await pendingClient.fetch();
          console.log('[Cmd] fetched', missed.length, 'pending commands');
          if (missed.length > 0) {
            const latest = missed.reduce((p, c) =>
              new Date(c.timestamp) > new Date(p.timestamp) ? c : p
            );
            await handleCommand(latest);
          }
        });

        // Subscribe to live group messages
        pubSubService.onMessage(data => handleCommand(data as PendingCommand));

        // Initial fallback fetch for any missed commands
        const missed = await pendingClient.fetch();
        console.log('[Cmd] fetched', missed.length, 'pending commands');
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
      console.log('[App] cleanup: disconnect WS & set offline');
      pubSubService.disconnect();
      presenceClient.setOffline();
      roomRef.current?.disconnect();
    };
  }, [initialized, account]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 p-4">
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
