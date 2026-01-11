/**
 * @fileoverview Types for usePsoTalkResponse hook
 * @summary Type definitions for PSO talk response hook
 */

import type { Room } from 'livekit-client';

/**
 * Options for the usePsoTalkResponse hook
 */
export interface IUsePsoTalkResponseOptions {
  /**
   * Reference to the current LiveKit room
   */
  roomRef: React.RefObject<Room | null>;
  /**
   * Whether the talk session is currently active
   */
  isTalkActive: boolean;
}

/**
 * Return type for usePsoTalkResponse hook
 */
export interface IUsePsoTalkResponse {
  /**
   * Whether the microphone is currently published
   */
  isMicrophonePublished: boolean;
  /**
   * Whether microphone permission is being requested
   */
  isRequestingPermission: boolean;
  /**
   * Error message if microphone setup failed
   */
  error: string | null;
}

