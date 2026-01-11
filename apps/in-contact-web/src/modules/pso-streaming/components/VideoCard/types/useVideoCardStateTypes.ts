/**
 * @fileoverview useVideoCardState hook types
 * @summary Type definitions for useVideoCardState hook
 * @description Type definitions for useVideoCardState hook options and return type
 */

import type { UserRole } from '@/modules/auth/enums';

/**
 * Options for useVideoCardState hook
 */
export interface IUseVideoCardStateOptions {
  shouldStream: boolean;
  connecting: boolean;
  disconnecting: boolean;
  disableControls: boolean;
  currentRole: UserRole | null | undefined;
  isTalking: boolean;
  isCountdownActive: boolean;
  countdown: number | null;
  talkLoading: boolean;
  recordingLoading: boolean;
  isRecording: boolean;
}

/**
 * Return type for useVideoCardState hook
 */
export interface IUseVideoCardStateReturn {
  mediaReady: boolean;
  playLabel: string;
  isPlayDisabled: boolean;
  talkLabel: string;
  talkDisabled: boolean;
  recordDisabled: boolean;
  snapshotDisabled: boolean;
  canTalkControl: boolean;
  canSnapshot: boolean;
  canRecord: boolean;
}

