/**
 * @fileoverview VideoCardDisplay - Video display component for VideoCard
 * @summary Displays video stream or placeholder with status message and timer
 * @description Component that renders the video element when streaming is active,
 * or a placeholder with status message and timer when not streaming.
 */

import React from 'react';
import { CompactTimer } from '../../TimerDisplay';
import { RefreshButton } from '../../RefreshButton';
import type { IVideoCardDisplayProps } from '../types/videoCardComponentTypes';

/**
 * VideoCardDisplay component
 * 
 * Renders the video display area with:
 * - Video element when streaming is active
 * - Placeholder with status message and timer when not streaming
 * - Refresh button overlay
 * - Hidden audio element for remote microphone
 * 
 * @param props - Component props
 * @returns React element rendering the video display area
 */
export const VideoCardDisplay: React.FC<IVideoCardDisplayProps> = ({
  shouldStream,
  accessToken,
  videoRef,
  statusMessage,
  timerInfo,
  email,
  audioRef,
}) => {
  // Only show video if shouldStream is true (not just if accessToken exists)
  // This ensures timer is shown when shouldStream is false, even if accessToken exists
  const showVideo = shouldStream;

  return (
    <div className="relative w-full pb-[56.25%] bg-black rounded-xl">
      {showVideo ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls={false}
            className="absolute inset-0 w-full h-full object-cover rounded-xl"
            onError={(e) => {
              const error = e.currentTarget.error;
              if (error) {
                console.error('[VideoCardDisplay] Video element error', {
                  error,
                  code: error.code,
                  message: error.message,
                  email,
                });
              }
            }}
          />
          <audio ref={audioRef} autoPlay className="hidden" />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {statusMessage && (
            <span className="text-xl font-medium text-yellow-400 mb-2">
              {statusMessage}
            </span>
          )}
          {timerInfo && (
            <div className="mt-2">
              <CompactTimer timerInfo={timerInfo} />
            </div>
          )}
          <audio ref={audioRef} autoPlay className="hidden" />
        </div>
      )}

      <RefreshButton email={email} />
    </div>
  );
};

