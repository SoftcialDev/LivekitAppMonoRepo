/**
 * @fileoverview useTrackAttachment hook
 * @summary Hook for attaching and detaching tracks
 * @description Handles basic track attachment/detachment logic with smooth transitions
 */

import { useRef, useCallback } from 'react';
import type { RemoteVideoTrack, RemoteAudioTrack } from 'livekit-client';
import { logDebug, logWarn } from '@/shared/utils/logger';
import { isTrackAttachedToVideo, attachVideoTrack, detachVideoTrack } from '../utils/trackAttachmentUtils';
import {
  scheduleDelayedDetach,
  cancelPendingDetach,
  clearAllPendingDetaches,
} from '../utils/trackTransitionUtils';
import type {
  IUseTrackAttachmentOptions,
  IUseTrackAttachmentReturn,
} from '../types/trackAttachmentTypes';
import type { PendingUnpublishMap } from '../types/trackTransitionTypes';

/**
 * Hook for managing track attachment and detachment
 * @param options - Configuration options
 * @returns Track attachment functions
 */
export function useTrackAttachment(
  options: IUseTrackAttachmentOptions
): IUseTrackAttachmentReturn {
  const { videoRef, audioRef, audioAttachment } = options;

  const attachedTracksRef = useRef<Set<string>>(new Set());
  const currentVideoTrackSidRef = useRef<string | null>(null);
  const pendingUnpublishRef = useRef<PendingUnpublishMap>(new Map());

  const attachTrack = useCallback(
    (pub: any): boolean => {
      const { track, kind, isSubscribed, trackSid } = pub;

      if (!isSubscribed || !track || !trackSid) {
        logDebug('[useTrackAttachment] Track not ready', {
          kind,
          isSubscribed,
          hasTrack: !!track,
          trackSid,
        });
        return false;
      }

      if (attachedTracksRef.current.has(trackSid)) {
        logDebug('[useTrackAttachment] Track already attached, skipping', {
          kind,
          trackSid,
        });
        if (kind === 'video') {
          currentVideoTrackSidRef.current = trackSid;
        }
        return false;
      }

      if (kind === 'video') {
        if (!videoRef.current) {
          return false;
        }

        // Check if already attached to element
        if (isTrackAttachedToVideo(videoRef.current, track.id)) {
          logDebug('[useTrackAttachment] Track already attached to video element', {
            trackSid,
            trackId: track.id,
          });
          attachedTracksRef.current.add(trackSid);
          currentVideoTrackSidRef.current = trackSid;
          return true;
        }

        // Handle track replacement for smooth transition
        const oldTrackSid = currentVideoTrackSidRef.current;
        if (oldTrackSid && oldTrackSid !== trackSid) {
          cancelPendingDetach(oldTrackSid, pendingUnpublishRef.current);
          logDebug('[useTrackAttachment] Cancelled pending unpublish - new track ready', {
            oldTrackSid,
            newTrackSid: trackSid,
          });
        }

        const success = attachVideoTrack(track as RemoteVideoTrack, videoRef.current, trackSid);
        if (success) {
          attachedTracksRef.current.add(trackSid);
          currentVideoTrackSidRef.current = trackSid;
          logDebug('[useTrackAttachment] Video track attached', {
            trackSid,
            replacedOldTrack: oldTrackSid && oldTrackSid !== trackSid,
          });
        }
        return success;
      } else if (kind === 'audio') {
        try {
          audioAttachment.attachAudioTrack(track as RemoteAudioTrack);
          attachedTracksRef.current.add(trackSid);
          logDebug('[useTrackAttachment] Audio track attached', { trackSid });
          return true;
        } catch (error) {
          logWarn('[useTrackAttachment] Failed to attach audio track', { error, trackSid });
          return false;
        }
      }

      return false;
    },
    [videoRef, audioRef, audioAttachment]
  );

  const detachTrack = useCallback(
    (trackSid: string, track: RemoteVideoTrack | null): void => {
      if (!track || !videoRef.current) {
        return;
      }

      detachVideoTrack(track, videoRef.current, trackSid);
      attachedTracksRef.current.delete(trackSid);

      if (currentVideoTrackSidRef.current === trackSid) {
        currentVideoTrackSidRef.current = null;
      }
    },
    [videoRef]
  );

  const scheduleDelayedDetachForTrack = useCallback(
    (trackSid: string, track: RemoteVideoTrack | null, delayMs: number = 300): void => {
      if (!videoRef.current) {
        return;
      }

      scheduleDelayedDetach(
        trackSid,
        track,
        videoRef.current,
        pendingUnpublishRef.current,
        currentVideoTrackSidRef,
        delayMs
      );
    },
    [videoRef]
  );

  const cancelPendingDetachForTrack = useCallback((trackSid: string): void => {
    cancelPendingDetach(trackSid, pendingUnpublishRef.current);
  }, []);

  const cleanup = useCallback((): void => {
    clearAllPendingDetaches(pendingUnpublishRef.current);
    attachedTracksRef.current.clear();
    currentVideoTrackSidRef.current = null;
  }, []);

  return {
    attachTrack,
    detachTrack,
    scheduleDelayedDetach: scheduleDelayedDetachForTrack,
    cancelPendingDetach: cancelPendingDetachForTrack,
    cleanup,
    getCurrentVideoTrackSid: () => currentVideoTrackSidRef.current,
    setCurrentVideoTrackSid: (trackSid: string | null) => {
      currentVideoTrackSidRef.current = trackSid;
    },
    isTrackAttached: (trackSid: string) => attachedTracksRef.current.has(trackSid),
    markTrackAttached: (trackSid: string) => attachedTracksRef.current.add(trackSid),
    markTrackDetached: (trackSid: string) => attachedTracksRef.current.delete(trackSid),
  };
}

