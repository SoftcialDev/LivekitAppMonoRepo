/**
 * @fileoverview useTalkSessionNotifications - Hook for talk session notifications
 * @summary Listens to WebSocket notifications for talk session start/end events
 * @description Subscribes to WebSocket messages for talk session lifecycle events (start/end)
 * and manages local state for UI feedback. Plays audio notifications and provides callbacks
 * for parent components to react to session events.
 */

import { useState, useEffect, useRef } from 'react';
import { webSocketService } from '@/shared/services/webSocket';
import { logDebug, logError } from '@/shared/utils/logger';
import { playIncomingCallSound, playHangUpSound } from '@/shared/utils/audioPlayer';
import type {
  IUseTalkSessionNotificationsOptions,
  IUseTalkSessionNotificationsReturn,
  ITalkSessionEndSetters,
  ITalkSessionStartConfig,
} from './types/useTalkSessionNotificationsTypes';

/**
 * Handles talk session start message from WebSocket
 * 
 * Filters messages by PSO email, updates state to indicate an active incoming session,
 * plays audio notification, and invokes the start callback if provided.
 * 
 * @param config - Configuration object containing all handler parameters
 */
function handleTalkSessionStart(config: ITalkSessionStartConfig): void {
  const { data, filterPsoEmail, onTalkSessionStart, setters, currentIsTalkActive } = config;
  const { setIsTalkActive, setIsIncoming, setJustEnded, setSupervisorName } = setters;
  
  const messagePsoEmail = data.psoEmail?.toLowerCase();
  
  // Filter out messages not intended for this PSO
  if (messagePsoEmail !== filterPsoEmail) {
    logDebug('[useTalkSessionNotifications] Message filtered out - email mismatch', {
      messagePsoEmail,
      filterPsoEmail,
    });
    return;
  }
  
  // Don't play incoming sound if session is already active (prevents duplicate sounds on stop/start)
  if (currentIsTalkActive) {
    logDebug('[useTalkSessionNotifications] Talk session already active, skipping incoming sound', {
      psoEmail: filterPsoEmail,
    });
    return;
  }
  
  logDebug('[useTalkSessionNotifications] Talk session started', { psoEmail: filterPsoEmail, data });
  playIncomingCallSound();
  
  // Update state to reflect active incoming session
  setIsTalkActive(true);
  setIsIncoming(true);
  setJustEnded(false);
  setSupervisorName((data.supervisorName as string) || null);
  
  // Reset incoming flag after 3 seconds (UI feedback duration)
  setTimeout(() => {
    setIsIncoming(false);
  }, 3000);
  
  // Invoke callback if provided
  if (onTalkSessionStart) {
    onTalkSessionStart({
      supervisorEmail: data.supervisorEmail,
      supervisorName: data.supervisorName,
    });
  }
}

/**
 * Handles talk session end message from WebSocket
 * 
 * Filters messages by PSO email, updates state to indicate session has ended,
 * plays hang-up sound notification, and manages UI feedback timing.
 * 
 * @param data - WebSocket message data containing PSO email
 * @param filterPsoEmail - Normalized PSO email to filter messages for this hook instance
 * @param onTalkSessionEnd - Optional callback to invoke when session ends
 * @param setters - State setters configuration object for updating multiple state values
 * @param justEndedTimeoutRef - Ref for tracking timeout used for UI feedback cleanup
 */
function handleTalkSessionEnd(
  data: { psoEmail?: string },
  filterPsoEmail: string,
  onTalkSessionEnd: (() => void) | undefined,
  setters: ITalkSessionEndSetters,
  justEndedTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
): void {
  const messagePsoEmail = data.psoEmail?.toLowerCase();
  
  // Filter out messages not intended for this PSO
  if (messagePsoEmail && messagePsoEmail !== filterPsoEmail) {
    logDebug('[useTalkSessionNotifications] Message filtered out - email mismatch', {
      messagePsoEmail,
      filterPsoEmail,
    });
    return;
  }
  
  logDebug('[useTalkSessionNotifications] Talk session ended', { psoEmail: filterPsoEmail });
  const hangUpSoundPromise = playHangUpSound();
  
  // Extract state setters from configuration object
  const { setIsTalkActive, setIsIncoming, setJustEnded, setSupervisorName } = setters;
  
  // Update state to reflect session has ended
  setIsTalkActive(false);
  setIsIncoming(false);
  setJustEnded(true);
  setSupervisorName(null);
  
  // Clear any existing timeout before setting a new one
  if (justEndedTimeoutRef.current) {
    clearTimeout(justEndedTimeoutRef.current);
    justEndedTimeoutRef.current = null;
  }
  
  /**
   * Handles successful sound playback completion
   * 
   * Resets the just-ended flag when the hang-up sound finishes playing.
   */
  const handleSoundSuccess = (): void => {
    setJustEnded(false);
  };
  
  /**
   * Handles sound playback failure
   * 
   * Sets a fallback timeout to reset the just-ended flag after 2 seconds
   * if the sound fails to play (ensures UI feedback doesn't persist indefinitely).
   */
  const handleSoundFailure = (): void => {
    justEndedTimeoutRef.current = setTimeout(() => {
      setJustEnded(false);
    }, 2000);
  };
  
  // Wait for sound to finish, then reset UI feedback
  hangUpSoundPromise.then(handleSoundSuccess).catch(handleSoundFailure);
  
  // Invoke callback if provided
  if (onTalkSessionEnd) {
    onTalkSessionEnd();
  }
}

/**
 * Hook for listening to talk session notifications via WebSocket
 * 
 * Subscribes to WebSocket messages for talk session lifecycle events and manages
 * local state for UI feedback. Handles message filtering, audio notifications,
 * and state updates when sessions start or end.
 * 
 * @param options - Configuration options for the hook
 * @param options.psoEmail - PSO email address to filter messages for
 * @param options.onTalkSessionStart - Optional callback invoked when a session starts
 * @param options.onTalkSessionEnd - Optional callback invoked when a session ends
 * @returns Object containing talk session state values
 * @returns returns.isTalkActive - Whether a talk session is currently active
 * @returns returns.isIncoming - Whether the session is incoming (supervisor initiated)
 * @returns returns.justEnded - Whether the session just ended (for UI feedback)
 * @returns returns.supervisorName - Name of the supervisor in the active/ended session
 * 
 * @example
 * ```typescript
 * const { isTalkActive, isIncoming, justEnded, supervisorName } = useTalkSessionNotifications({
 *   psoEmail: 'pso@example.com',
 *   onTalkSessionStart: (message) => {
 *     console.log('Session started with', message.supervisorName);
 *   },
 *   onTalkSessionEnd: () => {
 *     console.log('Session ended');
 *   },
 * });
 * ```
 */
export function useTalkSessionNotifications(
  options: IUseTalkSessionNotificationsOptions
): IUseTalkSessionNotificationsReturn {
  const { psoEmail, onTalkSessionStart, onTalkSessionEnd } = options;
  
  // State for tracking session status
  const [isTalkActive, setIsTalkActive] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  const [justEnded, setJustEnded] = useState(false);
  const [supervisorName, setSupervisorName] = useState<string | null>(null);
  
  // Refs for cleanup and handler tracking
  const handlerRef = useRef<((message: unknown) => void) | null>(null);
  const justEndedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Subscribe to WebSocket messages when PSO email is available
  useEffect(() => {
    if (!psoEmail) {
      return;
    }
    
    const filterPsoEmail = psoEmail.toLowerCase();
    
    /**
     * Handler for incoming WebSocket messages
     * 
     * Filters and processes talk session messages, delegating to appropriate
     * handlers based on message type.
     * 
     * @param message - Raw WebSocket message
     */
    const handleMessage = (message: unknown): void => {
      try {
        const msg = message as Record<string, unknown>;
        
        // Handle session start messages
        if (msg.type === 'talk_session_start') {
          const data = msg as { psoEmail?: string; supervisorEmail?: string; supervisorName?: string };
          handleTalkSessionStart({
            data,
            filterPsoEmail,
            onTalkSessionStart,
            setters: {
              setIsTalkActive,
              setIsIncoming,
              setJustEnded,
              setSupervisorName,
            },
            currentIsTalkActive: isTalkActive,
          });
        }
        
        // Handle session end messages
        if (msg.type === 'talk_session_stop') {
          const data = msg as { psoEmail?: string };
          handleTalkSessionEnd(
            data,
            filterPsoEmail,
            onTalkSessionEnd,
            {
              setIsTalkActive,
              setIsIncoming,
              setJustEnded,
              setSupervisorName,
            },
            justEndedTimeoutRef
          );
        }
      } catch (error) {
        logError('[useTalkSessionNotifications] Error handling message', { error, psoEmail });
      }
    };
    
    handlerRef.current = handleMessage;
    
    // Subscribe to WebSocket messages
    const unsubscribe = webSocketService.onMessage(handleMessage);
    
    // Cleanup: unsubscribe and clear timeout on unmount
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
