/**
 * @fileoverview useStreamSessionEvents hook
 * @description Handles streamingSessionUpdated custom events
 */

import { useEffect } from 'react';
import { StreamingStopReason } from '../../enums';
import { logDebug } from '@/shared/utils/logger';
import { getStatusFromStopReason } from './utils';
import type { CredsMap, StreamingStatusInfo } from '../../types';
import type { IUseStreamSessionEventsOptions } from './types/useStreamSessionEventsTypes';

/**
 * Handles streamingSessionUpdated custom events
 * @param options - Configuration options for session events
 */
export function useStreamSessionEvents(options: IUseStreamSessionEventsOptions): void {
  const {
    emailsRef,
    setCredsMap,
    clearStopStatusTimer,
  } = options;

  useEffect(() => {
    const handleStreamingSessionUpdate = (event: CustomEvent): void => {
      const { session } = event.detail;
      if (!session?.email) return;
      
      const emailKey = String(session.email).toLowerCase();
      const currentEmails = emailsRef.current;
      
      if (!currentEmails.includes(emailKey)) {
        return;
      }
      
      logDebug('Streaming session updated via event', { email: emailKey });
      
      if (session.stoppedAt) {
        const stopReason = session.stopReason;
        const stoppedAt = session.stoppedAt;
        const userStatus = getStatusFromStopReason(stopReason);
        
        const statusInfo: StreamingStatusInfo = {
          email: session.email,
          status: userStatus,
          lastSession: {
            stopReason: stopReason as StreamingStopReason | null,
            stoppedAt: stoppedAt
          }
        };
        
        setCredsMap((prev: CredsMap) => ({
          ...prev,
          [emailKey]: {
            ...(prev[emailKey] ?? { loading: false }),
            statusInfo
          }
        }));
        
        clearStopStatusTimer(emailKey);
      } else {
        // Session is active (stoppedAt is null)
        // Only remove statusInfo if stream actually started successfully (has accessToken)
        // If no accessToken, preserve statusInfo because stream may have failed to start
        setCredsMap((prev: CredsMap) => {
          const current = prev[emailKey];
          if (!current) return prev;
          
          // If there's no accessToken, the stream hasn't started successfully yet
          // Preserve statusInfo to keep timer visible in case stream fails
          if (!current.accessToken) {
            logDebug('[useStreamSessionEvents] Session active but no accessToken yet, preserving statusInfo', { email: emailKey });
            return prev; // Don't remove statusInfo yet
          }
          
          // Stream started successfully (has accessToken), safe to remove statusInfo
          const { statusInfo, ...rest } = current;
          return {
            ...prev,
            [emailKey]: rest
          };
        });
      }
    };
    
    globalThis.addEventListener('streamingSessionUpdated', handleStreamingSessionUpdate as EventListener);
    
    return () => {
      globalThis.removeEventListener('streamingSessionUpdated', handleStreamingSessionUpdate as EventListener);
    };
  }, [emailsRef, setCredsMap, clearStopStatusTimer]);
}

