/**
 * @fileoverview useSnapshot hook types
 * @summary Type definitions for useSnapshot hook
 * @description Types for snapshot capture and submission functionality
 */

import type { SnapshotReason } from '@/modules/snapshots/types/snapshotTypes';

/**
 * Return type of the useSnapshot hook
 */
export interface IUseSnapshotReturn {
  /** Reference to the video element for frame capture */
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Whether the snapshot modal is currently open */
  isModalOpen: boolean;
  /** Base64 data URL of the captured screenshot */
  screenshot: string;
  /** Selected snapshot reason from dropdown */
  reason: SnapshotReason | null;
  /** Description text (required when reason is "OTHER") */
  description: string;
  /** Whether the snapshot submission is in progress */
  isSubmitting: boolean;
  /** Sets the selected reason */
  setReason: (reason: SnapshotReason | null) => void;
  /** Sets the description text */
  setDescription: (description: string) => void;
  /** Opens the snapshot modal and captures the current video frame */
  openModal: () => void;
  /** Closes the snapshot modal and resets form state */
  closeModal: () => void;
  /** Submits the snapshot report to the backend */
  confirm: () => Promise<void>;
}

