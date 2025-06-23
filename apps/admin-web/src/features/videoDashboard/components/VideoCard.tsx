import React, { useRef, useEffect } from 'react';
import UserIndicator from '../../../components/UserIndicator';

export interface VideoCardProps {
  /** Display name of the user. */
  name: string;
  /** User's email for callbacks. */
  email: string;
  /** Real MediaStream to render (if any). */
  stream?: MediaStream;
  /** Local video URL for testing or mock playback. */
  videoSrc?: string;
  /**
   * Handler for Stop/Play button.
   * @param email The user’s email address.
   */
  onStop: (email: string) => void;
  onPlay: (email: string) => void;
  /**
   * Handler for Chat button.
   * @param email The user’s email address.
   */
  onChat: (email: string) => void;
  /** Hide the top header row (avatar + name) when false. Defaults to true. */
  showHeader?: boolean;
  /** Extra Tailwind CSS classes, e.g. "w-full h-full". */
  className?: string;
}

/**
 * VideoCard component.
 *
 * Renders:
 *  1. (Optional) Header row with a UserIndicator (avatar + name).
 *  2. Video or placeholder area.
 *  3. Action buttons row: Play/Stop & Chat.
 *
 * @param props.showHeader — if false, the avatar/name row is omitted.
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
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (stream) {
      vid.srcObject = stream;
    } else if (videoSrc) {
      vid.srcObject = null;
      vid.src = videoSrc;
    } else {
      vid.srcObject = null;
      vid.src = '';
    }
  }, [stream, videoSrc]);

  const hasVideo = Boolean(stream || videoSrc);

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
        rounded-xl overflow-hidden
        ${className}
      `}
    >
      {showHeader && (
        <div className="flex items-center px-2 py-1">
          <UserIndicator
            user={{ email, name }}
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
            autoPlay={!!stream}
            playsInline
            muted={!!stream}
            controls={!!videoSrc}
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
