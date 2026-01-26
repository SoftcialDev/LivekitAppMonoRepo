/**
 * @fileoverview useAutoReloadWhenIdle - Hook for auto-reloading page when idle
 * @description Automatically reloads the page at specified intervals when streaming is not active.
 * Prevents reload during stream initialization by checking for recent START commands.
 * Includes watchdog mechanism to ensure the reload interval continues functioning.
 */

import { useEffect, useRef } from 'react';
import { logDebug, logError, logWarn } from '@/shared/utils/logger';
import { START_COMMAND_PROTECTION_WINDOW_MS } from '../../constants';
import type { IUseAutoReloadWhenIdleOptions } from './types/useAutoReloadWhenIdleTypes';

/**
 * Auto-reloads the page when streaming is not active
 * @param isStreaming - Whether streaming is currently active
 * @param options - Configuration options
 * @param options.intervalMs - Interval in milliseconds between reload attempts (default: 120000)
 * @param options.onlyWhenVisible - Whether to reload only when page is visible (default: false)
 */
export function useAutoReloadWhenIdle(
  isStreaming: boolean,
  options: IUseAutoReloadWhenIdleOptions = {}
): void {
  const { intervalMs = 120_000, onlyWhenVisible = false } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);
  const lastReloadAttemptRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isStreaming) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      try {
        localStorage.removeItem('lastStartCommandTimestamp');
      } catch (error) {
        logWarn('[useAutoReloadWhenIdle] Failed to clear START timestamp', { error });
      }
      return;
    }

    const scheduleReload = (): void => {
      try {
        if (onlyWhenVisible && document.visibilityState !== 'visible') {
          logDebug('[useAutoReloadWhenIdle] Page not visible, skipping reload');
          return;
        }

        try {
          const lastStartTimestamp = localStorage.getItem('lastStartCommandTimestamp');
          if (lastStartTimestamp) {
            const timestamp = parseInt(lastStartTimestamp, 10);
            const timeSinceStart = Date.now() - timestamp;
            
            if (timeSinceStart < START_COMMAND_PROTECTION_WINDOW_MS) {
              logDebug('[useAutoReloadWhenIdle] Skipping reload - START command received recently', {
                timeSinceStart,
                protectionWindow: START_COMMAND_PROTECTION_WINDOW_MS,
              });
              return;
            } else {
              localStorage.removeItem('lastStartCommandTimestamp');
              logDebug('[useAutoReloadWhenIdle] Cleared expired START timestamp', {
                timeSinceStart,
              });
            }
          }
        } catch (error) {
          logWarn('[useAutoReloadWhenIdle] Error checking START timestamp', { error });
        }

        logDebug('[useAutoReloadWhenIdle] Reloading page due to idle timeout', {
          intervalMs,
          isStreaming,
        });
        lastReloadAttemptRef.current = Date.now();
        globalThis.location.reload();
      } catch (error) {
        logError('[useAutoReloadWhenIdle] Error during reload', { error });
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(scheduleReload, intervalMs);
      }
    };

    intervalRef.current = setInterval(scheduleReload, intervalMs);

    const watchdogInterval = intervalMs * 2;
    const checkWatchdog = (): void => {
      const timeSinceLastAttempt = Date.now() - lastReloadAttemptRef.current;
      
      if (timeSinceLastAttempt > watchdogInterval) {
        logWarn('[useAutoReloadWhenIdle] Watchdog detected interval may have stopped, restarting', {
          timeSinceLastAttempt,
          intervalMs,
        });
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(scheduleReload, intervalMs);
        lastReloadAttemptRef.current = Date.now();
      }
    };

    watchdogRef.current = setInterval(checkWatchdog, watchdogInterval) as unknown as NodeJS.Timeout;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
    };
  }, [isStreaming, intervalMs, onlyWhenVisible]);
}

