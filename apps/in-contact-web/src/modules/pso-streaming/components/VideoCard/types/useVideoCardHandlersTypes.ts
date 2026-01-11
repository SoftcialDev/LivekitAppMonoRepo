/**
 * @fileoverview useVideoCardHandlers hook types
 * @summary Type definitions for useVideoCardHandlers hook
 * @description Type definitions for useVideoCardHandlers hook options and return type
 */

import type { StreamingStopReason } from '../../../enums/streamingStopReason';

/**
 * Options for useVideoCardHandlers hook
 */
export interface IUseVideoCardHandlersOptions {
  email: string;
  onToggle?: (email: string, reason?: StreamingStopReason | string) => void;
  onChat: (email: string) => void;
  isCountdownActive: boolean;
  isTalking: boolean;
  cancelTalk: () => void;
  stopTalk: () => Promise<void>;
  startTalk: () => Promise<void>;
  activeSupervisorName: string | null;
  activeSupervisorEmail: string | null;
  openModal: () => void;
  toggleRecording: () => void;
}

/**
 * Return type for useVideoCardHandlers hook
 */
export interface IUseVideoCardHandlersReturn {
  handleStopReasonSelect: (reason: StreamingStopReason) => void;
  handlePlayClick: () => void;
  handleChatClick: () => void;
  handleTalkClick: () => Promise<void>;
  handleSnapshotClick: () => void;
  handleRecordClick: () => void;
}

