/**
 * @fileoverview Track attachment utilities
 * @summary Utility functions for attaching and detaching tracks
 * @description Pure functions for track attachment logic without side effects
 */

import type { RemoteVideoTrack, RemoteAudioTrack } from 'livekit-client';
import { logDebug, logWarn } from '@/shared/utils/logger';

/**
 * Checks if a track is already attached to a video element
 * @param videoElement - Video element to check
 * @param trackId - Track ID to check for
 * @returns True if track is already attached
 */
export function isTrackAttachedToVideo(
  videoElement: HTMLVideoElement,
  trackId: string
): boolean {
  if (!videoElement.srcObject) {
    return false;
  }

  if (!(videoElement.srcObject instanceof MediaStream)) {
    return false;
  }

  const existingTracks = videoElement.srcObject.getVideoTracks();
  return existingTracks.some((t) => t.id === trackId);
}

/**
 * Attaches a video track to a video element
 * @param track - Video track to attach
 * @param videoElement - Video element to attach to
 * @param trackSid - Track SID for logging
 * @returns True if attachment succeeded
 */
export function attachVideoTrack(
  track: RemoteVideoTrack,
  videoElement: HTMLVideoElement,
  trackSid: string
): boolean {
  try {
    track.attach(videoElement);
    logDebug('[trackAttachmentUtils] Video track attached successfully', { trackSid });
    return true;
  } catch (error) {
    logWarn('[trackAttachmentUtils] Failed to attach video track', { error, trackSid });
    return false;
  }
}

/**
 * Detaches a video track from a video element
 * @param track - Video track to detach
 * @param videoElement - Video element to detach from
 * @param trackSid - Track SID for logging
 * @returns True if detachment succeeded
 */
export function detachVideoTrack(
  track: RemoteVideoTrack,
  videoElement: HTMLVideoElement,
  trackSid: string
): boolean {
  try {
    track.detach(videoElement);
    logDebug('[trackAttachmentUtils] Video track detached successfully', { trackSid });
    return true;
  } catch (error) {
    logWarn('[trackAttachmentUtils] Failed to detach video track', { error, trackSid });
    return false;
  }
}

