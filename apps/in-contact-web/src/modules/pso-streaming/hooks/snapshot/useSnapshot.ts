/**
 * @fileoverview useSnapshot hook
 * @summary Hook for capturing and submitting snapshot reports
 * @description This hook manages the snapshot capture flow, including video frame capture,
 * modal state management, reason selection via dropdown, and conditional description field
 */

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/ui-kit/feedback';
import { sendSnapshotReport } from '../../api/snapshotClient';
import { useSnapshotReasonsStore } from '../../stores/snapshot-reasons-store';
import type { SnapshotReason } from '@/modules/snapshots/types/snapshotTypes';
import { logError } from '@/shared/utils/logger';
import type { IUseSnapshotReturn } from './types/useSnapshotTypes';

/**
 * Hook that captures a video frame as a snapshot, opens a modal to
 * collect a reason and optional description, and sends the report to the backend.
 * 
 * @param psoEmail - The email address of the PSO being reported
 * @returns IUseSnapshotReturn object with state and functions for snapshot management
 */
export function useSnapshot(psoEmail: string): IUseSnapshotReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { showToast } = useToast();
  const reasons = useSnapshotReasonsStore((state) => state.reasons);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<string>('');
  const [reason, setReason] = useState<SnapshotReason | null>(null);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Captures the current frame from the video and opens the modal.
   */
  const openModal = useCallback(() => {
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
  }, []);

  /**
   * Closes the modal and resets form state.
   */
  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setReason(null);
    setDescription('');
  }, [isSubmitting]);

  /**
   * Validates and submits the snapshot report to the server.
   */
  const confirm = useCallback(async () => {
    if (!reason) {
      showToast('Please select a reason', 'error');
      return;
    }

    const selectedReason = reasons.find(r => r.id === reason.id);
    if (selectedReason?.code === 'OTHER' && !description.trim()) {
      showToast('Description is mandatory for "Other" reason', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const base64 = screenshot.split(',')[1];
      await sendSnapshotReport({
        psoEmail,
        reasonId: reason.id,
        description: description.trim() || undefined,
        imageBase64: base64,
      });
      showToast('Snapshot report sent successfully', 'success');
      setIsModalOpen(false);
      setReason(null);
      setDescription('');
    } catch (err) {
      logError('Failed to send snapshot report', { error: err });
      const errorMessage = err instanceof Error ? err.message : 'Failed to send snapshot';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [reason, description, screenshot, psoEmail, reasons, showToast]);

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

