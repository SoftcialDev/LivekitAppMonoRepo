import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { CameraCommandClient } from '../../../services/camaraCommandClient';
import { useToast } from '../../../components/ToastContext';
import { getOrCreateChat, openChatWindow } from '@/services/chatClient';

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
   * Opens (or reuses) the InContact Teams chat window for a PSO.
   *
   * @param email
   *   The PSO’s email address.
   *
   * @example
   * ```ts
   * await handleChat("pso@example.com");
   * // → backend returns chatId, then opens/focuses the same Teams window
   * ```
   */
  const handleChat = useCallback(
    async (email: string) => {
      try {
        // 1) Call your API to find or create the chat and get back its chatId
        const chatId = await getOrCreateChat({ psoEmail: email });

        // 2) Open (or focus) the named Teams window
        openChatWindow(chatId);

        showToast(`Opened InContact chat with ${email}`, "success");
      } catch (err: any) {
        console.error("Failed to open chat for", email, err);
        showToast(`Failed to open InContact chat for ${email}`, "error");
      }
    },
    [showToast]
  );

  return { handlePlay, handleStop, handleChat };
}
