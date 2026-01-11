/**
 * @fileoverview Track attachment types
 * @summary Type definitions for track attachment hook
 * @description Types for managing track attachment and detachment
 */

import type { RemoteVideoTrack } from 'livekit-client';
import type { IUseAudioAttachmentReturn } from '../../audio/types/audioAttachmentTypes';

/**
 * Options for useTrackAttachment hook
 */
export interface IUseTrackAttachmentOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  audioAttachment: IUseAudioAttachmentReturn;
}

/**
 * Return type for useTrackAttachment hook
 */
export interface IUseTrackAttachmentReturn {
  attachTrack: (pub: any) => boolean;
  detachTrack: (trackSid: string, track: RemoteVideoTrack | null) => void;
  scheduleDelayedDetach: (trackSid: string, track: RemoteVideoTrack | null, delayMs?: number) => void;
  cancelPendingDetach: (trackSid: string) => void;
  cleanup: () => void;
  getCurrentVideoTrackSid: () => string | null;
  setCurrentVideoTrackSid: (trackSid: string | null) => void;
  isTrackAttached: (trackSid: string) => boolean;
  markTrackAttached: (trackSid: string) => void;
  markTrackDetached: (trackSid: string) => void;
}

