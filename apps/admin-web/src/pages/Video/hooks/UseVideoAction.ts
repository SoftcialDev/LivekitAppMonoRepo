import { CameraCommandClient } from '@/shared/api/camaraCommandClient';
import { getOrCreateChat, openChatWindow } from '@/shared/api/chatClient';
import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/ui/ToastContext';
import { useCallback, useMemo } from 'react';


/**
 * Hook: useVideoActions
 *
 * Exposes callbacks for controlling a PSO’s video stream and chat:
 *
 * - `handlePlay(email)` &rarr; sends a START command to begin streaming  
 * - `handleStop(email)` &rarr; sends a STOP command to end streaming  
 * - `handleChat(email)` &rarr; opens (or focuses) the Teams chat window  
 *
 * All failures/successes when starting/stopping show a toast notification.
 *
 * @returns An object with:
 *   - `handlePlay(email: string): Promise<void>`  
 *   - `handleStop(email: string): Promise<void>`  
 *   - `handleChat(email: string): Promise<void>`
 */
export function useVideoActions() {
  const { account } = useAuth();
  const currentUser = account?.username ?? '';
  const commandClient = useMemo(() => new CameraCommandClient(), []);
  const { showToast } = useToast();

  /**
   * Send a START command to the backend to begin streaming for a PSO.
   *
   * @param email – PSO’s email address.
   * @returns Promise that resolves once the command is sent.
   * @throws Will `showToast(..., 'error')` on failure.
   *
   * @example
   * ```ts
   * await handlePlay('pso@example.com');
   * ```
   */
  const handlePlay = useCallback(
    async (email: string): Promise<void> => {
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
   * Send a STOP command to the backend to end streaming for a PSO.
   *
   * @param email – PSO’s email address.
   * @returns Promise that resolves once the command is sent.
   * @throws Will `showToast(..., 'error')` on failure.
   *
   * @example
   * ```ts
   * await handleStop('pso@example.com');
   * ```
   */
  const handleStop = useCallback(
    async (email: string): Promise<void> => {
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
   * Opens (or focuses) the InContact Teams chat window for a PSO.
   *
   * 1. Ensures a chat exists (`getOrCreateChat`)  
   * 2. Opens/focuses that Teams window (`openChatWindow`)  
   *
   * @param email – PSO’s email address.
   * @returns Promise that resolves once the window is opened.
   * @throws Will `showToast(..., 'error')` on failure.
   *
   * @example
   * ```ts
   * await handleChat('pso@example.com');
   * ```
   */
  const handleChat = useCallback(
    async (email: string): Promise<void> => {
      try {
        const chatId = await getOrCreateChat({ psoEmail: email });
        openChatWindow(chatId);
        showToast(`Opened InContact chat with ${email}`, 'success');
      } catch (err: any) {
        console.error('Failed to open chat for', email, err);
        showToast(`Failed to open InContact chat for ${email}`, 'error');
      }
    },
    [showToast]
  );

  return { handlePlay, handleStop, handleChat };
}


