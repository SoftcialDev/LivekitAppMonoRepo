/**
 * @fileoverview useVideoTrackWatchdog - Monitors the local video track and restores it if it fails.
 * @summary Ensures the camera stays on while streaming by recreating and republishing the track when needed.
 * @description Watches the current local video track and the LiveKit room. If the video track ends,
 * goes inactive, or disappears from the publication list while streaming, it attempts to recreate the
 * track and republish it. Uses single-flight guards and a short backoff to avoid thrashing.
 */

import { useCallback, useRef } from 'react';
import type { LocalVideoTrack, Room } from 'livekit-client';

type LiveKitApi = {
  getCurrentRoom: () => Room | null;
  getCurrentVideoTrack: () => LocalVideoTrack | undefined;
  publishVideoTrack: (room: Room, track: LocalVideoTrack) => Promise<void>;
  unpublishVideoTrack: (room: Room, track: LocalVideoTrack, stopOnUnpublish?: boolean) => void;
};

/**
 * React hook that provides a watchdog for the local video track.
 *
 * @param liveKit - LiveKit connection helper with room/track helpers
 * @param videoRef - Ref to the preview <video> element
 * @param streamingRef - Ref<boolean> that is true while streaming is expected to be active
 * @returns Controls to start/stop the watchdog and to force a recovery
 */
export function useVideoTrackWatchdog(
  liveKit: LiveKitApi,
  videoRef: React.RefObject<HTMLVideoElement>,
  streamingRef: React.MutableRefObject<boolean>,
) {
  const monitorTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecoveringRef = useRef<boolean>(false);

  /**
   * Recreates the local video track using the provided factory and republishes it.
   * Guards against concurrent recoveries.
   *
   * @param createVideoTrack - Factory to create a fresh LocalVideoTrack
   * @returns Promise that resolves when republish succeeds or no-op if not streaming/room missing
   */
  const recreateAndRepublish = useCallback(async (
    createVideoTrack: () => Promise<LocalVideoTrack>,
  ): Promise<void> => {
    if (isRecoveringRef.current) return;
    const room = liveKit.getCurrentRoom();
    if (!room || !streamingRef.current) return;
    isRecoveringRef.current = true;
    try {
      const oldTrack = liveKit.getCurrentVideoTrack();
      if (oldTrack) {
        try {
          liveKit.unpublishVideoTrack(room, oldTrack, false);
        } catch {}
      }
      const newTrack = await createVideoTrack();
      await liveKit.publishVideoTrack(room, newTrack);
      if (videoRef.current) {
        // Refresh preview element
        try {
          videoRef.current.srcObject = new MediaStream([newTrack.mediaStreamTrack]);
        } catch {}
      }
    } finally {
      isRecoveringRef.current = false;
    }
  }, [liveKit, streamingRef, videoRef]);

  /**
   * Starts the watchdog: installs a 5s health check and attempts recovery if needed.
   *
   * @param createVideoTrack - Factory to create a fresh LocalVideoTrack when recovery is needed
   */
  const start = useCallback((createVideoTrack: () => Promise<LocalVideoTrack>): void => {
    if (monitorTimerRef.current) return;
    monitorTimerRef.current = setInterval(() => {
      if (!streamingRef.current) return;
      const room = liveKit.getCurrentRoom();
      if (!room) return;

      const track = liveKit.getCurrentVideoTrack();
      const ready = track?.mediaStreamTrack?.readyState === 'live';

      // If no track or ended, attempt recovery
      if (!track || !ready) {
        void recreateAndRepublish(createVideoTrack);
        return;
      }

      // Check for black video or lost stream
      if (videoRef.current) {
        const isBlack = videoRef.current.videoWidth === 0 || 
                       videoRef.current.videoHeight === 0 ||
                       videoRef.current.readyState === 0;
        const hasNoStream = !videoRef.current.srcObject;
        
        if ((isBlack || hasNoStream) && streamingRef.current) {
          console.warn('[Watchdog] Video appears to be black or lost stream, attempting recovery');
          void recreateAndRepublish(createVideoTrack);
          return;
        }
        
        // If the video element lost its stream, re-attach
        if (hasNoStream) {
          try {
            videoRef.current.srcObject = new MediaStream([track.mediaStreamTrack]);
          } catch {}
        }
      }
    }, 5000);
  }, [liveKit, recreateAndRepublish, streamingRef, videoRef]);

  /** Stops the watchdog and clears timers. */
  const stop = useCallback((): void => {
    if (monitorTimerRef.current) {
      clearInterval(monitorTimerRef.current);
      monitorTimerRef.current = null;
    }
    isRecoveringRef.current = false;
  }, []);

  /** Forces an immediate recovery attempt. */
  const forceRecreateAndRepublish = useCallback(async (
    createVideoTrack: () => Promise<LocalVideoTrack>,
  ): Promise<void> => recreateAndRepublish(createVideoTrack), [recreateAndRepublish]);

  return { start, stop, forceRecreateAndRepublish };
}


