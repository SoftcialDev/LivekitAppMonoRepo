
import React, { useRef, useEffect } from 'react';
import { Room, createLocalVideoTrack, createLocalAudioTrack } from 'livekit-client';
import { getLiveKitToken, RoomWithToken } from '../services/livekitClient';

const DashboardPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const roomRef  = useRef<Room | null>(null);

  // Detect if running under Electron
  const isElectron = typeof window !== 'undefined'
    && (window as any).process
    && (window as any).process.versions
    && !!(window as any).process.versions.electron;

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // 1) permissions once in browser; skip under Electron
        if (!isElectron && !localStorage.getItem('lk-permissions')) {
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStorage.setItem('lk-permissions', 'granted');
        }

        // 2) get LiveKit per-room tokens + URL
        const { rooms, livekitUrl } = await getLiveKitToken();
        if (!rooms.length) {
          throw new Error('No LiveKit rooms returned for this user');
        }
        const { room: ownRoom, token: ownToken } = rooms[0];

        // 3) ensure we only proceed if still mounted
        if (!mounted) return;

        // 4) connect
        const room = new Room();
        await room.connect(livekitUrl, ownToken);
        roomRef.current = room;

        // 5) create & publish
        const [videoTrack, audioTrack] = await Promise.all([
          createLocalVideoTrack(),
          createLocalAudioTrack(),
        ]);
        await room.localParticipant.publishTrack(videoTrack);
        await room.localParticipant.publishTrack(audioTrack);

        // 6) attach to elements
        if (videoRef.current) {
          videoTrack.attach(videoRef.current);
        }
        if (audioRef.current) {
          audioTrack.attach(audioRef.current);
        }
      } catch (err) {
        console.error('LiveKit init error:', err);
      }
    }

    init();

    return () => {
      mounted = false;
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [isElectron]);

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--color-primary-dark)] p-4">
      <div className="flex flex-col h-full w-full max-w-4xl bg-[var(--color-primary-dark)] rounded-xl overflow-hidden">
        <div className="flex-1 min-h-0 bg-black rounded-xl overflow-hidden">
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
