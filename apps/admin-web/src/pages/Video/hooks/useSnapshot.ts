import { sendSnapshotReport } from '@/shared/api/snapshotsClient';
import { useToast } from '@/shared/ui/ToastContext';
import { useState, useRef } from 'react';


/**
 * Hook that captures a video frame as a snapshot, opens a modal to
 * collect a reason, and sends the report (image + metadata) to the backend.
 *
 * @param psoEmail
 *   The identifier of the PSO (here we pass the email string).
 */
export function useSnapshot(psoEmail: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [screenshot,   setScreenshot]   = useState<string>('');
  const [reason,       setReason]       = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Capture the current frame from the video and open the modal.
   */
  const openModal = () => {
    const vid = videoRef.current;
    if (!vid) return;

    const canvas = document.createElement('canvas');
    canvas.width  = vid.videoWidth;
    canvas.height = vid.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);

    // JPEG at 80% quality
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setScreenshot(dataUrl);
    setIsModalOpen(true);
  };

  /**
   * Close the modal and reset the reason.
   */
  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setReason('');
  };

  /**
   * Send the snapshot report to the server, then show success or error toasts.
   */
  const confirm = async () => {
    setIsSubmitting(true);
    try {
      const base64 = screenshot.split(',')[1];
      await sendSnapshotReport({ psoEmail, reason, imageBase64: base64 });
      showToast('Snapshot report sent successfully', 'success');
      setIsModalOpen(false);
      setReason('');
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
    setReason,
    isSubmitting,
    openModal,
    closeModal,
    confirm,
  };
}
