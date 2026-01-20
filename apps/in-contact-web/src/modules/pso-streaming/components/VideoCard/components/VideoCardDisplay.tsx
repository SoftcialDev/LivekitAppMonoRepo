/**
 * @fileoverview VideoCardDisplay - Video display component for VideoCard
 * @summary Displays video stream or placeholder with status message and timer
 * @description Component that renders the video element when streaming is active,
 * or a placeholder with status message and timer when not streaming.
 */

import React, { useState, useCallback } from 'react';
import { CompactTimer } from '../../TimerDisplay';
import { RefreshButton } from '../../RefreshButton';
import type { IVideoCardDisplayProps } from '../types/videoCardComponentTypes';

/**
 * VideoCardDisplay component
 * 
 * Renders video element when streaming is active, or placeholder with status
 * message and timer when not streaming. Container adapts to video aspect ratio
 * to prevent cropping.
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

  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.videoWidth && video.videoHeight) {
      const ratio = video.videoHeight / video.videoWidth;
      setAspectRatio(ratio);
    }
  }, []);

  const containerPaddingBottom = aspectRatio ? `${aspectRatio * 100}%` : '56.25%';

  return (
    <div 
      className="relative w-full bg-black! rounded-xl" 
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
            onLoadedMetadata={handleLoadedMetadata}
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
          <audio ref={audioRef} autoPlay className="hidden">
            <track kind="captions" srcLang="en" label="English" />
          </audio>
        </div>
      )}

      <RefreshButton email={email} />
    </div>
  );
};

