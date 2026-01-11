/**
 * @fileoverview Audio attachment types
 * @summary Type definitions for audio attachment hook
 * @description Types for managing audio track attachment logic
 */

import type { RemoteAudioTrack } from 'livekit-client';

/**
 * Options for useAudioAttachment hook
 */
export interface IUseAudioAttachmentOptions {
  /**
   * Reference to the HTML audio element
   */
  audioRef: React.RefObject<HTMLAudioElement>;
  /**
   * Whether the admin has started a talk session
   */
  isTalking: boolean;
  /**
   * Whether there's an active talk session for the PSO
   */
  hasActiveSession: boolean;
  /**
   * Email of the supervisor in the active session (if any)
   */
  activeSupervisorEmail: string | null;
  /**
   * Email of the current admin
   */
  currentAdminEmail: string | null;
  /**
   * Whether audio is muted
   */
  isAudioMuted: boolean;
  /**
   * Reference to the LiveKit room
   */
  roomRef: React.RefObject<any>;
  /**
   * Identity of the remote participant (PSO)
   */
  roomName: string | null;
}

/**
 * Return type for useAudioAttachment hook
 */
export interface IUseAudioAttachmentReturn {
  /**
   * Determines if audio should be attached based on current state
   */
  shouldAttachAudio: (
    hasActiveSession: boolean,
    activeSupervisorEmail: string | null,
    currentAdminEmail: string | null,
    isTalking: boolean
  ) => boolean;
  /**
   * Attaches and plays an audio track
   */
  attachAudioTrack: (track: RemoteAudioTrack) => void;
  /**
   * Re-evaluates and attaches existing audio tracks when isTalking changes
   */
  reEvaluateAudioTracks: () => void;
}

