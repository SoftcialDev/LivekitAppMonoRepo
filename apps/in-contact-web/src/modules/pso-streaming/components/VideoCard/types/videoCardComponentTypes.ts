/**
 * @fileoverview VideoCard component types
 * @summary Type definitions for VideoCard sub-components
 * @description Type definitions for VideoCard header, display, controls, and modal components
 */

import type { TimerInfo } from '../../../types';
import type { SnapshotReason } from '@/modules/snapshots/types/snapshotTypes';
import type { StreamingStopReason } from '../../../enums/streamingStopReason';

/**
 * Props for VideoCardHeader component
 */
export interface IVideoCardHeaderProps {
  showHeader: boolean;
  psoName?: string;
  name: string;
  supervisorEmail?: string;
  supervisorName?: string;
  onSupervisorChange?: (psoEmail: string, newSupervisorEmail: string) => void;
  email: string;
  disableControls: boolean;
  portalMinWidthPx?: number;
}

/**
 * Props for VideoCardDisplay component
 */
export interface IVideoCardDisplayProps {
  shouldStream: boolean;
  accessToken?: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  statusMessage?: string;
  timerInfo: TimerInfo | null;
  email: string;
  audioRef: React.RefObject<HTMLAudioElement>;
}

/**
 * Props for VideoCardControls component
 */
export interface IVideoCardControlsProps {
  shouldStream: boolean;
  connecting: boolean;
  disableControls: boolean;
  recordingLoading: boolean;
  talkLoading: boolean;
  playLabel: string;
  onToggle?: (email: string, reason?: StreamingStopReason | string) => void;
  email: string;
  onStopReasonSelect: (reason: StreamingStopReason) => void;
  onChat: (email: string) => void;
  canTalkControl: boolean;
  isCountdownActive: boolean;
  isTalking: boolean;
  countdown: number | null;
  talkLabel: string;
  talkDisabled: boolean;
  onTalkClick: () => Promise<void>;
  canSnapshot: boolean;
  snapshotDisabled: boolean;
  onSnapshotClick: () => void;
  canRecord: boolean;
  recordDisabled: boolean;
  isRecording: boolean;
  onRecordClick: () => void | Promise<void>;
}

/**
 * Props for VideoCardSnapshotModal component
 */
export interface IVideoCardSnapshotModalProps {
  isModalOpen: boolean;
  email: string;
  screenshot: string;
  reason: SnapshotReason | null;
  description: string;
  snapshotReasons: SnapshotReason[];
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onReasonSelect: (reason: SnapshotReason | null) => void;
  onDescriptionChange: (description: string) => void;
}

