import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { CameraCommandClient } from '../../../services/camaraCommandClient';
import { useToast } from '../../../components/ToastContext';

/**
 * useVideoActions hook
 *
 * Exposes three callbacks for controlling and chatting with a PSO:
 *  - handlePlay(email): issues a START command via the backend
 *  - handleStop(email): issues a STOP command via the backend
 *  - handleChat(email): opens a fresh Teams chat window
 *
 * On success or failure of START/STOP, shows a toast notification.
 *
 * @returns An object with `handlePlay`, `handleStop` and `handleChat`.
 */
export function useVideoActions() {
  const { account } = useAuth();
  const currentUser = account?.username ?? '';
  const commandClient = useMemo(() => new CameraCommandClient(), []);
  const { showToast } = useToast();

  /**
   * Start streaming video for the given PSO email.
   * @param email The PSO’s email address.
   */
  const handlePlay = useCallback(
    async (email: string) => {
      console.log('Starting stream for', email);
      try {
        await commandClient.start(email);
        console.log('START command sent for', email);
        showToast(`Sending start stream command for ${email}`, 'success');
      } catch (err: any) {
        console.error('Failed to send START command for', email, err);
        showToast(`Failed to start stream for ${email}`, 'error');
      }
    },
    [commandClient, showToast]
  );

  /**
   * Stop streaming video for the given PSO email.
   * @param email The PSO’s email address.
   */
  const handleStop = useCallback(
    async (email: string) => {
      console.log('Stopping stream for', email);
      try {
        await commandClient.stop(email);
        console.log('STOP command sent for', email);
        showToast(`Stopped stream for ${email}`, 'success');
      } catch (err: any) {
        console.error('Failed to send STOP command for', email, err);
        showToast(`Failed to stop stream for ${email}`, 'error');
      }
    },
    [commandClient, showToast]
  );

  /**
   * Open a brand-new, blank Microsoft Teams chat
   * between the session user and the PSO’s email.
   * @param email The PSO’s email address.
   */
  const handleChat = useCallback(
    (email: string) => {
      const participants = encodeURIComponent(`${currentUser},${email}`);
      const topicName = encodeURIComponent(`New chat ${Date.now()}`);
      const url = `https://teams.microsoft.com/l/chat/0/0?users=${participants}&topicName=${topicName}`;
      window.open(url, '_blank');
    },
    [currentUser]
  );

  return { handlePlay, handleStop, handleChat };
}
