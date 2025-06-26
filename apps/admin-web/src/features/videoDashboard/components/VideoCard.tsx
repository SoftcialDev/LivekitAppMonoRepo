import React, { useRef, useEffect } from 'react';
import UserIndicator from '../../../components/UserIndicator';
import {
  Room,
  RoomEvent,
  ParticipantEvent,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteVideoTrack,
} from 'livekit-client';
import type { VideoCardProps } from '../types/VideoCardProps';

/**
 * VideoCard
 *
 * Renders a rounded card with:
 * 1️⃣ Optional header row: `UserIndicator` showing avatar + name  
 * 2️⃣ Video area:  
 *    • If `stream` or `videoSrc` is provided, plays that media  
 *    • Else if `accessToken`+`roomName` are provided, connects to LiveKit,
 *      subscribes to the remote participant matching `email`, and attaches their
 *      video track.  
 *    • Otherwise shows “No Stream.”  
 * 3️⃣ Action buttons: Play/Stop toggles video; Chat opens chat for that email.
 *
 * @param props.showHeader — when false, hides the avatar/name row.
 */
const VideoCard: React.FC<VideoCardProps> = ({
  name,
  email,
  stream,
  videoSrc,
  onStop,
  onPlay,
  onChat,
  showHeader = true,
  className = '',
  accessToken,
  roomName,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);

  // 1) Render either provided stream or videoSrc
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (stream) {
      vid.srcObject = stream;
      vid.play().catch(() => {});
    } else if (videoSrc) {
      vid.srcObject = null;
      vid.src = videoSrc;
      vid.play().catch(() => {});
    } else {
      vid.srcObject = null;
      vid.src = '';
    }
  }, [stream, videoSrc]);

  // 2) If accessToken + roomName are set, connect & subscribe
  useEffect(() => {
    if (!accessToken || !roomName) return;
    const vid = videoRef.current;
    if (!vid) return;

    let lkRoom: Room | null = null;
    let canceled = false;

    const subscribeTo = (participant: RemoteParticipant) => {
      const publications = Array.from(participant.getTrackPublications().values())
        .filter((pub): pub is RemoteTrackPublication => pub.track != null);
      publications.forEach(pub => {
        if (pub.kind === 'video' && pub.isSubscribed && pub.track) {
          (pub.track as RemoteVideoTrack).attach(vid);
        }
      });
      participant.on(
        ParticipantEvent.TrackSubscribed,
        (track) => {
          if (track instanceof RemoteVideoTrack) {
            track.attach(vid);
          }
        }
      );
    };

    const connectAndSubscribe = async () => {
      try {
        const room = new Room();
        const wsUrl = import.meta.env.VITE_LIVEKIT_WS_URL;
        if (!wsUrl) {
          console.warn('[VideoCard] VITE_LIVEKIT_WS_URL not defined');
          return;
        }
        await room.connect(wsUrl, accessToken);
        if (canceled) {
          room.disconnect();
          return;
        }
        lkRoom = room;
        roomRef.current = room;

        // subscribe to all existing remote participants
        for (const participant of room.remoteParticipants.values()) {
          if (
            participant.identity.toLowerCase() === email.toLowerCase()
          ) {
            subscribeTo(participant);
          }
        }

        // future joins
        room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          if (
            participant.identity.toLowerCase() === email.toLowerCase()
          ) {
            subscribeTo(participant);
          }
        });

        // handle disconnect
        room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
          if (
            participant.identity.toLowerCase() === email.toLowerCase()
          ) {
            if (videoRef.current) {
              videoRef.current.srcObject = null;
              videoRef.current.src = '';
            }
          }
        });
      } catch (err) {
        console.error('[VideoCard] LiveKit connect error:', err);
      }
    };

    connectAndSubscribe();

    return () => {
      canceled = true;
      if (lkRoom) {
        lkRoom.disconnect();
      }
      roomRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = '';
      }
    };
  }, [accessToken, roomName, email]);

  const hasVideo = Boolean(stream || videoSrc || accessToken);

  const StopIcon = (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="var(--color-primary-dark)">
      <path d="M4 4h16v16H4z" />
    </svg>
  );
  const PlayIcon = (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="var(--color-primary-dark)">
      <path d="M8 5l11 7-11 7z" />
    </svg>
  );

  return (
    <div
      className={`
        flex flex-col h-full bg-[var(--color-primary-dark)]
        rounded-xl overflow-hidden ${className}
      `}
    >
      {showHeader && (
        <div className="flex items-center px-2 py-1">
          <UserIndicator
            user={{
              email,
              name,
              fullName: name, 
              status: 'offline',
            }}
            outerClass="w-5 h-5"
            innerClass="w-4 h-4"
            bgClass="bg-[var(--color-secondary)]"
            borderClass="border-2 border-[var(--color-primary-dark)]"
            nameClass="text-white truncate cursor-pointer hover:text-[var(--color-secondary-hover)]"
          />
        </div>
      )}

      <div className="flex-1 min-h-0 bg-black rounded-xl overflow-hidden">
        {hasVideo ? (
          <video
            ref={videoRef}
            autoPlay={Boolean(accessToken || stream)}
            playsInline
            muted={Boolean(stream)}
            controls={Boolean(videoSrc)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white">No Stream</span>
          </div>
        )}
      </div>

      <div className="flex space-x-2 mt-2">
        <button
          onClick={() => (hasVideo ? onStop(email) : onPlay(email))}
          className="
            flex-1 flex items-center justify-center space-x-2
            py-2 bg-white text-[var(--color-primary-dark)] font-semibold
            hover:bg-[var(--color-primary)] hover:text-white
            transition-colors cursor-pointer rounded-xl
          "
        >
          <span className="w-6 h-6 flex-shrink-0">
            {hasVideo ? StopIcon : PlayIcon}
          </span>
          <span>{hasVideo ? 'Stop' : 'Play'}</span>
        </button>
        <button
          onClick={() => onChat(email)}
          className="
            flex-1 flex items-center justify-center space-x-2
            py-2 bg-[var(--color-secondary)]
            text-[var(--color-primary-dark)] font-semibold
            hover:bg-[var(--color-primary)] hover:text-white
            transition-colors cursor-pointer rounded-xl
          "
        >
          <span>💬</span>
          <span>Chat</span>
        </button>
      </div>
    </div>
  );
};

export default VideoCard;
