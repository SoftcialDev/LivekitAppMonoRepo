/**
 * @fileoverview useTalkSessionNotifications.ts - Hook for handling talk session WebSocket notifications
 * @summary Provides real-time audio alerts and console logging for talk session events
 * @description This hook subscribes to WebSocket messages for talk session start and end events.
 * It plays distinct audio notifications (incoming call, hang up) and logs event details
 * to the console, optionally filtering events by a specific PSO email.
 */

import { useEffect } from 'react';
import { WebPubSubClientService } from '@/shared/api/webpubsubClient';
import { playIncomingCallSound, playHangUpSound } from '@/shared/utils/audioPlayer';
import { TalkSessionStartMessage } from '@/shared/types/talkSession';

/**
 * Props for the useTalkSessionNotifications hook.
 */
export interface UseTalkSessionNotificationsOptions {
  /**
   * The email of the PSO to filter notifications for.
   * If provided, only messages relevant to this PSO will trigger handlers.
   */
  psoEmail: string;
  /**
   * Callback function to be executed when a talk session starts.
   * @param message - The `TalkSessionStartMessage` received from the WebSocket.
   */
  onTalkSessionStart?: (message: TalkSessionStartMessage) => void;
  /**
   * Callback function to be executed when a talk session ends.
   * @param message - The `TalkSessionEndedMessage` received from the WebSocket.
   */
  onTalkSessionEnd?: () => void;
}

/**
 * A React hook that listens for talk session start and end notifications
 * via WebSocket and triggers corresponding actions like playing sounds and
 * executing callbacks.
 *
 * @param options - Configuration properties for the hook.
 */
export function useTalkSessionNotifications(
  options: UseTalkSessionNotificationsOptions
): void {
  const { psoEmail, onTalkSessionStart, onTalkSessionEnd } = options;

  useEffect(() => {
    if (!psoEmail) {
      console.warn('[useTalkSessionNotifications] psoEmail is not provided. Talk session notifications will not be filtered.');
    }

    /**
     * Handles incoming talk session start messages.
     * Plays an incoming call sound and executes the `onTalkSessionStart` callback.
     * @param message - The received `TalkSessionStartMessage`.
     */
    const handleTalkSessionStart = (message: TalkSessionStartMessage) => {
      if (psoEmail && message.psoEmail.toLowerCase() !== psoEmail.toLowerCase()) {
        return;
      }
      playIncomingCallSound();
      onTalkSessionStart?.(message);
    };

    /**
     * Handles incoming talk session end messages.
     * Plays a hang up sound and executes the `onTalkSessionEnd` callback.
     * @param message - The received `TalkSessionEndedMessage`.
     */
    const handleTalkSessionEnd = (message: { psoEmail?: string }) => {
      if (psoEmail && message.psoEmail?.toLowerCase() !== psoEmail.toLowerCase()) {
        return;
      }
      playHangUpSound();
      onTalkSessionEnd?.();
    };

    const client = WebPubSubClientService.getInstance();
    if (!client) {
      return;
    }

    const handleMessage = (msg: any): void => {
      if (msg?.type === 'talk_session_start') {
        handleTalkSessionStart(msg as TalkSessionStartMessage);
      }

      if (msg?.type === 'talk_session_stop') {
        handleTalkSessionEnd(msg as { psoEmail?: string });
      }
    };

    const unsubscribe = client.onMessage(handleMessage);

    return () => {
      unsubscribe();
    };
  }, [psoEmail, onTalkSessionStart, onTalkSessionEnd]);
}

