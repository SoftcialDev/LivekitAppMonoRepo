/**
 * @fileoverview useSnapshot.ts - Hook for capturing and submitting snapshot reports
 * @summary Provides functionality to capture video frames and submit snapshot reports
 * @description This hook manages the snapshot capture flow, including video frame capture,
 * modal state management, reason selection via dropdown, and conditional description field.
 */

import { sendSnapshotReport } from '@/shared/api/snapshotsClient';
import { useToast } from '@/shared/ui/ToastContext';
import { useState, useRef } from 'react';
import { SnapshotReason } from '@/shared/types/snapshot';

/**
 * Options for the useSnapshot hook.
 */
export interface UseSnapshotOptions {
  /**
   * The email address of the PSO being reported.
   */
  psoEmail: string;
}

/**
 * Return type of the useSnapshot hook.
 */
export interface UseSnapshot {
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

/**
 * Hook that captures a video frame as a snapshot, opens a modal to
 * collect a reason and optional description, and sends the report to the backend.
 *
 * @param psoEmail - The email address of the PSO being reported
 * @returns UseSnapshot object with state and functions for snapshot management
 */
export function useSnapshot(psoEmail: string): UseSnapshot {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<string>('');
  const [reason, setReason] = useState<SnapshotReason | null>(null);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Captures the current frame from the video and opens the modal.
   */
  const openModal = () => {
    const vid = videoRef.current;
    if (!vid) return;

    const canvas = document.createElement('canvas');
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setScreenshot(dataUrl);
    setIsModalOpen(true);
  };

  /**
   * Closes the modal and resets form state.
   */
  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setReason(null);
    setDescription('');
  };

  /**
   * Validates and submits the snapshot report to the server.
   */
  const confirm = async () => {
    if (!reason) {
      showToast('Please select a reason', 'error');
      return;
    }

    if (reason === SnapshotReason.OTHER && !description.trim()) {
      showToast('Description is required when reason is "Other"', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const base64 = screenshot.split(',')[1];
      await sendSnapshotReport({
        psoEmail,
        reason,
        description: reason === SnapshotReason.OTHER ? description : undefined,
        imageBase64: base64
      });
      showToast('Snapshot report sent successfully', 'success');
      setIsModalOpen(false);
      setReason(null);
      setDescription('');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to send snapshot', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    videoRef,
    isModalOpen,
    screenshot,
    reason,
    description,
    setReason,
    setDescription,
    isSubmitting,
    openModal,
    closeModal,
    confirm,
  };
}
