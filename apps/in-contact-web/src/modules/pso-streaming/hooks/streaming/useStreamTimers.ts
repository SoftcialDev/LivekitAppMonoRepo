/**
 * @fileoverview useStreamTimers hook
 * @description Manages timer cleanup functions for stream operations
 */

import { useCallback, useRef } from 'react';
import type { IUseStreamTimersReturn } from './types/useStreamTimersTypes';

/**
 * Manages timer cleanup functions for stream operations
 * @returns Timer refs and cleanup functions
 */
export function useStreamTimers(): IUseStreamTimersReturn {
  const pendingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const stopStatusTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const retryTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const startConnectionTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const clearPendingTimer = useCallback((email: string): void => {
    const key = email.toLowerCase();
    const timer = pendingTimersRef.current[key];
    if (timer) {
      clearTimeout(timer);
      delete pendingTimersRef.current[key];
    }
  }, []);

  const clearStopStatusTimer = useCallback((email: string): void => {
    const key = email.toLowerCase();
    const timer = stopStatusTimersRef.current[key];
    if (timer) {
      clearTimeout(timer);
      delete stopStatusTimersRef.current[key];
    }
  }, []);

  const clearRetryTimer = useCallback((email: string): void => {
    const key = email.toLowerCase();
    const timer = retryTimersRef.current[key];
    if (timer) {
      clearTimeout(timer);
      delete retryTimersRef.current[key];
    }
  }, []);

  const clearStartConnectionTimer = useCallback((email: string): void => {
    const key = email.toLowerCase();
    const timer = startConnectionTimersRef.current[key];
    if (timer) {
      clearTimeout(timer);
      delete startConnectionTimersRef.current[key];
    }
  }, []);

  const clearAllTimers = useCallback((): void => {
    Object.values(pendingTimersRef.current).forEach(clearTimeout);
    pendingTimersRef.current = {};
    Object.values(stopStatusTimersRef.current).forEach(clearTimeout);
    stopStatusTimersRef.current = {};
    Object.values(retryTimersRef.current).forEach(clearTimeout);
    retryTimersRef.current = {};
    Object.values(startConnectionTimersRef.current).forEach(clearTimeout);
    startConnectionTimersRef.current = {};
  }, []);

  return {
    pendingTimersRef,
    stopStatusTimersRef,
    retryTimersRef,
    startConnectionTimersRef,
    clearPendingTimer,
    clearStopStatusTimer,
    clearRetryTimer,
    clearStartConnectionTimer,
    clearAllTimers,
  };
}

