/**
 * @fileoverview Track transition utilities
 * @summary Utility functions for smooth track transitions
 * @description Handles delayed detach logic for smooth transitions between tracks
 */

import type { RemoteVideoTrack } from 'livekit-client';
import { logDebug } from '@/shared/utils/logger';
import { detachVideoTrack } from './trackAttachmentUtils';
import type { PendingUnpublishMap } from '../types/trackTransitionTypes';

/**
 * Creates a delayed detach operation for smooth transitions
 * @param trackSid - Track SID to detach
 * @param track - Track to detach
 * @param videoElement - Video element
 * @param pendingMap - Map of pending operations
 * @param currentTrackSidRef - Reference to current track SID
 * @param delayMs - Delay in milliseconds before detaching
 * @returns Timeout ID or null if cancelled
 */
export function scheduleDelayedDetach(
  trackSid: string,
  track: RemoteVideoTrack | null,
  videoElement: HTMLVideoElement | null,
  pendingMap: PendingUnpublishMap,
  currentTrackSidRef: { current: string | null },
  delayMs: number = 300
): NodeJS.Timeout | null {
  // Cancel existing pending detach for this track
  const existing = pendingMap.get(trackSid);
  if (existing) {
    clearTimeout(existing.timeout);
    pendingMap.delete(trackSid);
  }

  if (!track || !videoElement) {
    return null;
  }

  const timeout = setTimeout(() => {
    pendingMap.delete(trackSid);

    // Only detach if this is still not the current track (no replacement found)
    if (currentTrackSidRef.current === trackSid) {
      logDebug('[trackTransitionUtils] Skipping detach - new track already attached', { trackSid });
    } else {
      detachVideoTrack(track, videoElement, trackSid);
      logDebug('[trackTransitionUtils] Track detached after delay (no replacement)', { trackSid });
    }
  }, delayMs);

  pendingMap.set(trackSid, { trackSid, timeout });
  return timeout;
}

/**
 * Cancels a pending detach operation
 * @param trackSid - Track SID to cancel
 * @param pendingMap - Map of pending operations
 */
export function cancelPendingDetach(
  trackSid: string,
  pendingMap: PendingUnpublishMap
): void {
  const pending = pendingMap.get(trackSid);
  if (pending) {
    clearTimeout(pending.timeout);
    pendingMap.delete(trackSid);
    logDebug('[trackTransitionUtils] Cancelled pending detach', { trackSid });
  }
}

/**
 * Clears all pending detach operations
 * @param pendingMap - Map of pending operations
 */
export function clearAllPendingDetaches(pendingMap: PendingUnpublishMap): void {
  pendingMap.forEach(({ timeout }) => {
    clearTimeout(timeout);
  });
  pendingMap.clear();
}

