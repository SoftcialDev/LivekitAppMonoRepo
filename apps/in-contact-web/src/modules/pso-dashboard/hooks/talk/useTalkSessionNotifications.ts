/**
 * @fileoverview useTalkSessionNotifications - Hook for talk session notifications
 * @summary Listens to WebSocket notifications for talk session start/end
 * @description Subscribes to talk session notifications and provides callbacks for session events
 */

import { useState, useEffect, useRef } from 'react';
import { webSocketService } from '@/shared/services/webSocket';
import { logDebug, logError } from '@/shared/utils/logger';
import { playIncomingCallSound, playHangUpSound } from '@/shared/utils/audioPlayer';
import type {
  IUseTalkSessionNotificationsOptions,
  IUseTalkSessionNotificationsReturn,
  ITalkSessionStartMessage,
} from './types/useTalkSessionNotificationsTypes';

/**
 * Hook for listening to talk session notifications via WebSocket
 * 
 * @param options - Configuration options
 * @returns Object containing talk session state
 */
export function useTalkSessionNotifications(
  options: IUseTalkSessionNotificationsOptions
): IUseTalkSessionNotificationsReturn {
  const { psoEmail, onTalkSessionStart, onTalkSessionEnd } = options;
  
  const [isTalkActive, setIsTalkActive] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  const [justEnded, setJustEnded] = useState(false);
  const [supervisorName, setSupervisorName] = useState<string | null>(null);
  
  const handlerRef = useRef<((message: unknown) => void) | null>(null);
  const justEndedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!psoEmail) {
      return;
    }
    
    // Handler for WebSocket messages
    const handleMessage = (message: unknown): void => {
      try {
        const msg = message as Record<string, unknown>;
        
        // Handle talk session start - admin-web uses 'talk_session_start' type directly
        if (msg.type === 'talk_session_start') {
          const data = msg as { psoEmail?: string; supervisorEmail?: string; supervisorName?: string };
          const messagePsoEmail = data.psoEmail?.toLowerCase();
          const filterPsoEmail = psoEmail.toLowerCase();
          
          if (messagePsoEmail !== filterPsoEmail) {
            logDebug('[useTalkSessionNotifications] Message filtered out - email mismatch', {
              messagePsoEmail,
              filterPsoEmail,
            });
            return;
          }
          
          logDebug('[useTalkSessionNotifications] Talk session started', { psoEmail, data });
          playIncomingCallSound();
          
          setIsTalkActive(true);
          setIsIncoming(true);
          setJustEnded(false);
          setSupervisorName((data.supervisorName as string) || null);
          
          // Reset isIncoming after 3 seconds
          setTimeout(() => {
            setIsIncoming(false);
          }, 3000);
          
          if (onTalkSessionStart) {
            onTalkSessionStart({
              supervisorEmail: data.supervisorEmail as string | undefined,
              supervisorName: data.supervisorName as string | undefined,
            });
          }
        }
        
        // Handle talk session end - admin-web uses 'talk_session_stop' type directly
        if (msg.type === 'talk_session_stop') {
          const data = msg as { psoEmail?: string };
          const messagePsoEmail = data.psoEmail?.toLowerCase();
          const filterPsoEmail = psoEmail.toLowerCase();
          
          if (messagePsoEmail && messagePsoEmail !== filterPsoEmail) {
            logDebug('[useTalkSessionNotifications] Message filtered out - email mismatch', {
              messagePsoEmail,
              filterPsoEmail,
            });
            return;
          }
          
          logDebug('[useTalkSessionNotifications] Talk session ended', { psoEmail });
          playHangUpSound();
          
          setIsTalkActive(false);
          setIsIncoming(false);
          setJustEnded(true);
          setSupervisorName(null);
          
          // Reset justEnded after a short delay
          if (justEndedTimeoutRef.current) {
            clearTimeout(justEndedTimeoutRef.current);
          }
          justEndedTimeoutRef.current = setTimeout(() => {
            setJustEnded(false);
          }, 3000);
          
          if (onTalkSessionEnd) {
            onTalkSessionEnd();
          }
        }
      } catch (error) {
        logError('[useTalkSessionNotifications] Error handling message', { error, psoEmail });
      }
    };
    
    handlerRef.current = handleMessage;
    
    // Subscribe to WebSocket messages
    const unsubscribe = webSocketService.onMessage(handleMessage);
    
    return () => {
      unsubscribe();
      if (justEndedTimeoutRef.current) {
        clearTimeout(justEndedTimeoutRef.current);
      }
    };
  }, [psoEmail, onTalkSessionStart, onTalkSessionEnd]);
  
  return {
    isTalkActive,
    isIncoming,
    justEnded,
    supervisorName,
  };
}

