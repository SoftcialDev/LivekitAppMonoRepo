/**
 * @fileoverview VideoCardDisplay - Video display component for VideoCard
 * @summary Displays video stream or placeholder with status message and timer
 * @description Component that renders the video element when streaming is active,
 * or a placeholder with status message and timer when not streaming. Manages video
 * display state, error handling, and synchronization with connection status.
 * Uses a fixed 4:3 aspect ratio container with object-cover to minimize black bars
 * while maintaining uniform card dimensions across the grid.
 */

import React, { useEffect, useRef } from 'react';
import { logError } from '@/shared/utils/logger';
import { CompactTimer } from '../../TimerDisplay';
import { RefreshButton } from '../../RefreshButton';
import { useCameraFailureStore } from '../../../stores/camera-failure-store';
import type { IVideoCardDisplayProps } from '../types/videoCardComponentTypes';

/**
 * VideoCardDisplay component
 * @description Renders video element when streaming is active, or placeholder with status
 * message and timer when not streaming. The component manages the display state
 * based on streaming status and connection state, automatically clearing stale
 * error messages when a new connection attempt begins. Container uses a fixed 4:3
 * aspect ratio (75% padding-bottom) for uniform sizing across the grid. Video uses
 * object-cover CSS property to fill the container and minimize black bars, which may
 * result in slight cropping if the video aspect ratio differs significantly from 4:3.
 * Error messages are displayed only during the connecting state and are automatically
 * cleared when a new connection attempt starts to prevent showing stale error information.
 * @param props - Component props
 * @param props.shouldStream - Whether the stream should be active
 * @param props.accessToken - LiveKit access token for the stream
 * @param props.videoRef - React ref for the video element
 * @param props.statusMessage - Optional status message to display when not streaming
 * @param props.timerInfo - Optional timer information for break/status display
 * @param props.email - PSO email address for error tracking and refresh button
 * @param props.audioRef - React ref for the audio element
 * @param props.connecting - Whether the stream is currently connecting
 * @returns React element rendering the video display or placeholder
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
  const clearError = useCameraFailureStore((state) => state.clearError);
  const previousConnectingRef = useRef(connecting);

  /**
   * Clears camera failure error when a new connection attempt starts
   * @description Monitors the connecting state and clears any existing error messages
   * when transitioning from not connecting to connecting state. This prevents stale
   * error messages from persisting across connection attempts. Uses a ref to track
   * the previous connecting state and only clears errors when a new connection attempt
   * begins (transition from false to true).
   */
  useEffect(() => {
    const wasConnecting = previousConnectingRef.current;
    const isConnecting = connecting;

    // If we're starting a new connection attempt (was not connecting, now is connecting)
    if (!wasConnecting && isConnecting) {
      // Clear any previous error to avoid showing stale error messages
      if (cameraFailureError) {
        clearError(email);
      }
    }

    previousConnectingRef.current = connecting;
  }, [connecting, cameraFailureError, email, clearError]);

  /**
   * Determines whether to show the video element
   * @description Video is shown only when shouldStream is true and not currently connecting.
   * During connection attempts, the placeholder is shown instead. This ensures users see
   * a loading state during connection rather than a blank or error state.
   * @returns True if video should be displayed, false otherwise
   */
  const showVideo = shouldStream && !connecting;

  /**
   * Determines whether to show error message
   * @description Error messages are displayed only during the connecting state to synchronize
   * with the connection attempt duration. Once video is playing, errors are hidden to avoid
   * cluttering the interface. Errors are automatically cleared when a new connection attempt
   * starts via the useEffect hook.
   * @returns True if error message should be displayed, false otherwise
   */
  const showError = connecting && cameraFailureError;

  /**
   * Container aspect ratio calculation
   * @description Uses 4:3 aspect ratio (75% padding-bottom) for better fit with typical
   * webcam feeds and to reduce black bars. This ensures all video cards have uniform
   * dimensions while providing better video coverage compared to 16:9. The padding-bottom
   * technique creates a responsive container that maintains aspect ratio regardless of width.
   * @returns CSS padding-bottom percentage value for 4:3 aspect ratio
   */
  const containerPaddingBottom = '75%'; // 4:3 aspect ratio (3/4 * 100)

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
            className="absolute inset-0 w-full h-full object-cover rounded-xl"
            onError={(e) => {
              /**
               * Handles video element errors
               * @description Logs video playback errors with structured logging.
               * Captures error code, message, and associated email for debugging.
               * @param e - React synthetic event from video element error
               */
              const error = e.currentTarget.error;
              if (error) {
                logError('[VideoCardDisplay] Video element error', {
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
          {/* Show error only during connecting state (synchronized with connecting) */}
          {showError && (
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

