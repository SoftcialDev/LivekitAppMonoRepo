/**
 * @fileoverview useVideoActions hook
 * @summary Hook for video streaming control actions
 * @description Provides callbacks for controlling PSO video streams and chat
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/modules/auth';
import { useToast } from '@/ui-kit/feedback';
import { useChat } from '../chat';
import { CameraCommandClient } from '../../api';
import { logInfo, logError } from '@/shared/utils/logger';

/**
 * Hook that exposes callbacks for controlling a PSO's video stream and chat
 * 
 * Provides:
 * - `handlePlay(email)` - sends a START command to begin streaming
 * - `handleStop(email, reason?)` - sends a STOP command to end streaming
 * - `handleChat(email)` - opens (or focuses) the Teams chat window
 * 
 * All failures/successes when starting/stopping show a toast notification.
 * 
 * @returns Object with handlePlay, handleStop, and handleChat functions
 */
export function useVideoActions() {
  const { account } = useAuth();
  const currentUser = account?.username ?? '';
  const commandClient = useMemo(() => new CameraCommandClient(), []);
  const { showToast } = useToast();
  const { handleChat } = useChat();

  /**
   * Send a START command to the backend to begin streaming for a PSO.
   *
   * @param email - PSO's email address
   * @returns Promise that resolves once the command is sent
   * @throws Shows toast error on failure
   */
  const handlePlay = useCallback(
    async (email: string): Promise<void> => {
      try {
        await commandClient.start(email);
        logInfo('Stream start command sent', { email, currentUser });
        showToast(`Sending start stream command for ${email}`, 'success');
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logError('Failed to start stream', { error, email, currentUser });
        showToast(`Failed to start stream for ${email}`, 'error');
      }
    },
    [commandClient, showToast, currentUser]
  );

  /**
   * Send a STOP command to the backend to end streaming for a PSO.
   *
   * @param email - PSO's email address
   * @param reason - Optional reason for stopping the stream
   * @returns Promise that resolves once the command is sent
   * @throws Shows toast error on failure
   */
  const handleStop = useCallback(
    async (email: string, reason?: string): Promise<void> => {
      try {
        await commandClient.stop(email, reason);
        logInfo('Stream stop command sent', { email, reason, currentUser });
        const reasonText = reason ? ` (${reason})` : '';
        showToast(`Stopped stream for ${email}${reasonText}`, 'success');
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logError('Failed to stop stream', { error, email, reason, currentUser });
        showToast(`Failed to stop stream for ${email}`, 'error');
      }
    },
    [commandClient, showToast, currentUser]
  );

  return { handlePlay, handleStop, handleChat };
}

