import { useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';

/**
 * useVideoActions hook
 *
 * Exposes three callbacks for controlling and chatting with a PSO:
 *  - handlePlay(email): starts the video stream
 *  - handleStop(email): stops the video stream
 *  - handleChat(email): opens a fresh Teams chat window
 *
 * @returns An object with `handlePlay`, `handleStop` and `handleChat`.
 */
export function useVideoActions() {
  const { account } = useAuth();
  const currentUser = account?.username ?? '';

  /**
   * Start streaming video for the given PSO email.
   * @param email The PSO’s email address.
   */
  const handlePlay = useCallback((email: string) => {
    console.log('Starting stream for', email);
    // TODO: call your API/WebSocket to start
  }, []);

  /**
   * Stop streaming video for the given PSO email.
   * @param email The PSO’s email address.
   */
  const handleStop = useCallback((email: string) => {
    console.log('Stopping stream for', email);
    // TODO: call your API/WebSocket to stop
  }, []);

  /**
   * Open a brand-new, blank Microsoft Teams chat
   * between the session user and the PSO’s email.
   * @param email The PSO’s email address.
   */
  const handleChat = useCallback((email: string) => {
    const participants = encodeURIComponent(`${currentUser},${email}`);
    const topicName    = encodeURIComponent(`New chat ${Date.now()}`);
    const url = `https://teams.microsoft.com/l/chat/0/0?users=${participants}&topicName=${topicName}`;
    window.open(url, '_blank');
  }, [currentUser]);

  return { handlePlay, handleStop, handleChat };
}
