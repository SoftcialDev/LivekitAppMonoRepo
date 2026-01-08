/**
 * @fileoverview useTalkSessionNotifications.ts - Hook for handling talk session WebSocket notifications
 * @summary Provides real-time audio alerts and console logging for talk session events
 * @description This hook subscribes to WebSocket messages for talk session start and end events.
 * It plays distinct audio notifications (incoming call, hang up) and logs event details
 * to the console, optionally filtering events by a specific PSO email.
 */

import { useEffect, useState } from 'react';
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
 * Return type for useTalkSessionNotifications hook
 */
export interface UseTalkSessionNotificationsReturn {
  /**
   * Whether a talk session is currently active
   */
  isTalkActive: boolean;
  /**
   * Whether the call is in the incoming phase (first 3 seconds)
   */
  isIncoming: boolean;
  /**
   * Whether the call just ended (showing hang up message)
   */
  justEnded: boolean;
  /**
   * Name of the supervisor in the active talk session
   */
  supervisorName: string | null;
}

/**
 * A React hook that listens for talk session start and end notifications
 * via WebSocket and triggers corresponding actions like playing sounds and
 * executing callbacks.
 *
 * @param options - Configuration properties for the hook.
 * @returns Object containing talk session state information
 */
export function useTalkSessionNotifications(
  options: UseTalkSessionNotificationsOptions
): UseTalkSessionNotificationsReturn {
  const { psoEmail, onTalkSessionStart, onTalkSessionEnd } = options;
  
  const [isTalkActive, setIsTalkActive] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  const [justEnded, setJustEnded] = useState(false);
  const [supervisorName, setSupervisorName] = useState<string | null>(null);
  const [endedSupervisorName, setEndedSupervisorName] = useState<string | null>(null);

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
      console.log('[useTalkSessionNotifications] Talk session start received:', {
        messagePsoEmail: message.psoEmail,
        filterPsoEmail: psoEmail,
        match: psoEmail && message.psoEmail?.toLowerCase() === psoEmail.toLowerCase()
      });
      
      if (psoEmail && message.psoEmail?.toLowerCase() !== psoEmail.toLowerCase()) {
        console.log('[useTalkSessionNotifications] Message filtered out - email mismatch');
        return;
      }
      
      console.log('[useTalkSessionNotifications] Playing incoming call sound');
      playIncomingCallSound();
      setIsTalkActive(true);
      setIsIncoming(true);
      setSupervisorName(message.supervisorName || null);
      onTalkSessionStart?.(message);
      
      setTimeout(() => {
        setIsIncoming(false);
      }, 3000);
    };

    /**
     * Handles incoming talk session end messages.
     * Plays a hang up sound and executes the `onTalkSessionEnd` callback.
     * @param message - The received `TalkSessionEndedMessage`.
     */
    const handleTalkSessionEnd = (message: { psoEmail?: string }) => {
      console.log('[useTalkSessionNotifications] Talk session end received:', {
        messagePsoEmail: message.psoEmail,
        filterPsoEmail: psoEmail,
        match: psoEmail && message.psoEmail?.toLowerCase() === psoEmail.toLowerCase()
      });
      
      if (psoEmail && message.psoEmail?.toLowerCase() !== psoEmail.toLowerCase()) {
        console.log('[useTalkSessionNotifications] Message filtered out - email mismatch');
        return;
      }
      
      console.log('[useTalkSessionNotifications] Playing hang up sound');
      playHangUpSound();
      setEndedSupervisorName(supervisorName);
      setIsTalkActive(false);
      setIsIncoming(false);
      setJustEnded(true);
      setSupervisorName(null);
      onTalkSessionEnd?.();
      
      setTimeout(() => {
        setJustEnded(false);
        setEndedSupervisorName(null);
      }, 3000);
    };

    const client = WebPubSubClientService.getInstance();
    if (!client) {
      return;
    }

    const handleMessage = (msg: any): void => {
      if (msg?.type === 'talk_session_start') {
        console.log('[useTalkSessionNotifications] Received talk_session_start message:', msg);
        handleTalkSessionStart(msg as TalkSessionStartMessage);
      }

      if (msg?.type === 'talk_session_stop') {
        console.log('[useTalkSessionNotifications] Received talk_session_stop message:', msg);
        handleTalkSessionEnd(msg as { psoEmail?: string });
      }
    };

    const unsubscribe = client.onMessage(handleMessage);

    return () => {
      unsubscribe();
    };
  }, [psoEmail, onTalkSessionStart, onTalkSessionEnd]);

  return {
    isTalkActive,
    isIncoming,
    justEnded,
    supervisorName: supervisorName || endedSupervisorName
  };
}

