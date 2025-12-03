/**
 * @fileoverview useTalkSessionNotifications - Hook for listening to talk session WebSocket messages
 * @summary Handles incoming call notifications for PSOs
 */

import { useEffect } from 'react';
import { WebPubSubClientService } from '@/shared/api/webpubsubClient';
import { playIncomingCallSound, playHangUpSound } from '@/shared/utils/audioPlayer';
import { TalkSessionStartMessage } from '@/shared/types/talkSession';

/**
 * Options for useTalkSessionNotifications
 */
export interface UseTalkSessionNotificationsOptions {
  /**
   * Email of the PSO to listen for talk session notifications
   */
  psoEmail: string;

  /**
   * Callback invoked when a talk session starts
   * @param message - Talk session start message
   */
  onTalkSessionStart?: (message: TalkSessionStartMessage) => void;

  /**
   * Callback invoked when a talk session ends
   */
  onTalkSessionEnd?: () => void;
}

/**
 * Hook that listens for talk session WebSocket messages and plays notification sounds
 * @param options - Configuration options
 */
export function useTalkSessionNotifications(
  options: UseTalkSessionNotificationsOptions
): void {
  const { psoEmail, onTalkSessionStart, onTalkSessionEnd } = options;

  useEffect(() => {
    if (!psoEmail) {
      return;
    }

    const client = WebPubSubClientService.getInstance();
    if (!client) {
      return;
    }

    const handleMessage = (msg: any): void => {
      if (msg?.type === 'talk_session_start') {
        const message = msg as TalkSessionStartMessage;

        if (message.psoEmail?.toLowerCase() === psoEmail.toLowerCase()) {
          playIncomingCallSound();
          onTalkSessionStart?.(message);
        }
      }

      if (msg?.type === 'talk_session_stop') {
        const message = msg as { psoEmail?: string };

        if (message.psoEmail?.toLowerCase() === psoEmail.toLowerCase()) {
          playHangUpSound();
          onTalkSessionEnd?.();
        }
      }
    };

    const unsubscribe = client.onMessage(handleMessage);

    return () => {
      unsubscribe();
    };
  }, [psoEmail, onTalkSessionStart, onTalkSessionEnd]);
}

