/**
 * @fileoverview useAutoReloadWhenIdle - Hook for auto-reloading page when idle
 * @summary Automatically reloads the page when idle and streaming
 * @description Reloads the page at specified intervals when streaming is active
 * to prevent connection issues and keep the page fresh.
 */

import { useEffect, useRef } from 'react';
import { logDebug } from '@/shared/utils/logger';
import type { IUseAutoReloadWhenIdleOptions } from './types/useAutoReloadWhenIdleTypes';

/**
 * Hook for auto-reloading the page when NOT streaming (idle)
 *
 * @param isStreaming - Whether streaming is currently active
 * @param options - Configuration options
 * @remarks
 * This hook automatically reloads the page at a fixed interval ONLY when streaming is NOT active.
 * The timer is cleaned up as soon as isStreaming becomes true.
 */
export function useAutoReloadWhenIdle(
  isStreaming: boolean,
  options: IUseAutoReloadWhenIdleOptions = {}
): void {
  const { intervalMs = 120_000, onlyWhenVisible = false } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If streaming is active, clear any pending timer and exit
    if (isStreaming) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Only reload when NOT streaming
    intervalRef.current = setInterval(() => {
      // Check visibility if onlyWhenVisible is true
      if (onlyWhenVisible && document.visibilityState !== 'visible') {
        logDebug('[useAutoReloadWhenIdle] Page not visible, skipping reload');
        return;
      }

      logDebug('[useAutoReloadWhenIdle] Reloading page due to idle timeout', {
        intervalMs,
        isStreaming,
      });
      globalThis.location.reload();
    }, intervalMs);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isStreaming, intervalMs, onlyWhenVisible]);
}

