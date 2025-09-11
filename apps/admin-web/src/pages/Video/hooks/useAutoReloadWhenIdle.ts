import { useEffect, useRef } from 'react';

type Options = {
  /**
   * Interval between reloads (ms). Default: 120000 (2 minutes).
   */
  intervalMs?: number;

  /**
   * Reload only when the tab is visible. Default: true.
   */
  onlyWhenVisible?: boolean;

  /**
   * Key used in sessionStorage to guard against too-frequent reloads.
   * Default: "autoReload.lastRun".
   */
  storageKey?: string;
};

/**
 * useAutoReloadWhenIdle
 * ---------------------
 * Automatically reloads the page at a fixed interval **only when streaming is NOT active**.
 * The timer is cleaned up as soon as `isStreaming` becomes `true`.
 *
 * Safety features:
 * - Skips reloads if the document is hidden (configurable).
 * - Uses `sessionStorage` to avoid accidental rapid reloads if the component remounts.
 *
 * @param isStreaming - Whether streaming is currently active.
 * @param options - Optional behavior overrides (interval, visibility check, storage key).
 *
 * @example
 * ```tsx
 * const { isStreaming } = useStreamingDashboard();
 * useAutoReloadWhenIdle(isStreaming, { intervalMs: 120_000, onlyWhenVisible: true });
 * ```
 */
export function useAutoReloadWhenIdle(
  isStreaming: boolean,
  {
    intervalMs = 60_000,
    onlyWhenVisible = true,
    storageKey = 'autoReload.lastRun',
  }: Options = {},
) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // If streaming is active, clear any pending timer and exit
    if (isStreaming) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const shouldReload = (): boolean => {
      // Respect tab visibility if requested
      if (onlyWhenVisible && document.visibilityState !== 'visible') return false;

      // Guard against overly frequent reloads across remounts
      const now = Date.now();
      const last = Number(sessionStorage.getItem(storageKey) || '0');
      if (now - last < intervalMs - 1000) return false;

      return true;
    };

    // Start interval when not streaming
    timerRef.current = window.setInterval(() => {
      if (!isStreaming && shouldReload()) {
        try {
          sessionStorage.setItem(storageKey, String(Date.now()));
        } catch {
          // ignore storage errors
        }
        window.location.reload(); // Hard reload (F5)
      }
    }, intervalMs);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isStreaming, intervalMs, onlyWhenVisible, storageKey]);
}
