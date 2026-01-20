/**
 * @fileoverview VideoCardDisplay - Video display component for VideoCard
 * @summary Displays video stream or placeholder with status message and timer
 * @description Component that renders the video element when streaming is active,
 * or a placeholder with status message and timer when not streaming.
 */

import React from 'react';
import { CompactTimer } from '../../TimerDisplay';
import { RefreshButton } from '../../RefreshButton';
import { useCameraFailureStore } from '../../../stores/camera-failure-store';
import type { IVideoCardDisplayProps } from '../types/videoCardComponentTypes';

/**
 * VideoCardDisplay component
 * 
 * Renders video element when streaming is active, or placeholder with status
 * message and timer when not streaming. Container uses fixed 16:9 aspect ratio
 * for uniform sizing across grid. Video uses object-contain to prevent cropping,
 * which may result in black bars if video aspect ratio differs from 16:9.
 */
export const VideoCardDisplay: React.FC<IVideoCardDisplayProps> = ({
  shouldStream,
  accessToken,
  videoRef,
  statusMessage,
  timerInfo,
  email,
  audioRef,
  connecting = false,
}) => {
  const cameraFailureError = useCameraFailureStore((state) => state.getError(email));

  // Only show video if shouldStream is true and not connecting (and no error to show)
  // If there's a camera failure error, always show the placeholder with error message
  const showVideo = shouldStream && !connecting && !cameraFailureError;

  // Use fixed 16:9 aspect ratio for consistent card sizes across the grid
  // This ensures all video cards have uniform dimensions regardless of video source aspect ratio
  const containerPaddingBottom = '56.25%'; // 16:9 aspect ratio (9/16 * 100)

  return (
    <div 
      className="relative w-full rounded-xl overflow-hidden" 
      style={{ 
        backgroundColor: '#000000',
        paddingBottom: containerPaddingBottom,
      }}
    >
      {showVideo ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls={false}
            className="absolute inset-0 w-full h-full object-contain rounded-xl"
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
          >
            <track kind="captions" srcLang="en" label="English" />
          </video>
          <audio ref={audioRef} autoPlay className="hidden">
            <track kind="captions" srcLang="en" label="English" />
          </audio>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl video-card-placeholder" style={{ backgroundColor: '#000000' }}>
          {cameraFailureError && (
            <span className="text-xl font-medium mb-2 px-4 text-center text-red-400">
              {cameraFailureError}
            </span>
          )}
          {statusMessage && (
            <span className="text-xl font-medium mb-2 px-4 text-center text-yellow-400">
              {statusMessage}
            </span>
          )}
          {timerInfo && (
            <div className="mt-2">
              <CompactTimer timerInfo={timerInfo} />
            </div>
          )}
          <audio ref={audioRef} autoPlay className="hidden">
            <track kind="captions" srcLang="en" label="English" />
          </audio>
        </div>
      )}

      <RefreshButton email={email} />
    </div>
  );
};

