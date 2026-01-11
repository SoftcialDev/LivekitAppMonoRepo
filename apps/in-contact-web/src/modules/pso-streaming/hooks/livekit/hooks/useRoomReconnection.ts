/**
 * @fileoverview useRoomReconnection hook
 * @summary Hook for managing room reconnection logic
 * @description Handles reconnection attempts with exponential backoff
 */

import { useRef, useCallback } from 'react';
import { DisconnectReason } from 'livekit-client';
import { logDebug, logWarn } from '@/shared/utils/logger';
import {
  createInitialReconnectionState,
  resetReconnectionState,
  updateReconnectionState,
  calculateReconnectionDelay,
} from '../utils/reconnectionUtils';
import type {
  IReconnectionState,
  IUseRoomReconnectionOptions,
  IUseRoomReconnectionReturn,
} from '../types/roomConnectionTypes';

/**
 * Hook for managing room reconnection
 * @param options - Configuration options
 * @returns Reconnection functions
 */
export function useRoomReconnection(
  options: IUseRoomReconnectionOptions
): IUseRoomReconnectionReturn {
  const { shouldStream, onReconnect } = options;

  const reconnectionStateRef = useRef<IReconnectionState>(createInitialReconnectionState());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const canceledRef = useRef(false);

  const handleDisconnection = useCallback(
    (reason?: DisconnectReason): void => {
      if (canceledRef.current || !shouldStream) {
        return;
      }

      const reasonCode = reason ? String(reason) : 'unknown';
      const isServerShutdown = reason === DisconnectReason.SERVER_SHUTDOWN;

      if (isServerShutdown) {
        logWarn('[useRoomReconnection] Server shutdown, not reconnecting', { reason: reasonCode });
        reconnectionStateRef.current = resetReconnectionState(reconnectionStateRef.current);
        return;
      }

      // Update reconnection state
      reconnectionStateRef.current = updateReconnectionState(reconnectionStateRef.current, reason);

      // Calculate reconnection delay
      const delayResult = calculateReconnectionDelay({
        reason,
        state: reconnectionStateRef.current,
      });

      if (!delayResult.shouldReconnect) {
        logWarn('[useRoomReconnection] Not reconnecting (max attempts reached)', {
          attempts: reconnectionStateRef.current.attempts,
        });
        reconnectionStateRef.current = resetReconnectionState(reconnectionStateRef.current);
        return;
      }

      logDebug('[useRoomReconnection] Scheduling reconnection', {
        reason: reasonCode,
        delayMs: delayResult.delayMs,
        attempt: reconnectionStateRef.current.attempts,
        isRefreshDetected: delayResult.isRefreshDetected,
      });

      // Cancel any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        if (shouldStream && !canceledRef.current) {
          logDebug('[useRoomReconnection] Attempting reconnection', {
            attempt: reconnectionStateRef.current.attempts,
          });
          onReconnect();
        }
      }, delayResult.delayMs);
    },
    [shouldStream, onReconnect]
  );

  const reset = useCallback((): void => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectionStateRef.current = resetReconnectionState(reconnectionStateRef.current);
  }, []);

  const cancel = useCallback((): void => {
    canceledRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  return {
    handleDisconnection,
    reset,
    cancel,
  };
}

