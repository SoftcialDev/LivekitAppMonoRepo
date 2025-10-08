/**
 * @fileoverview useWakeLock - Screen Wake Lock management hook
 * @summary Manages acquiring and releasing the Screen Wake Lock with auto-reacquire.
 * @description Provides an ergonomic API to acquire/release the Screen Wake Lock,
 * automatically re-acquire on visibility changes and release events when configured.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

type WakeLockSentinelAny = any;

export interface UseWakeLockOptions {
  /**
   * When true, the hook will automatically attempt to acquire the wake lock
   * whenever the document becomes visible and on release events.
   * Defaults to true.
   */
  auto?: boolean;
}

export interface UseWakeLockApi {
  /** Returns true if wake lock API is supported by the browser. */
  supported: boolean;
  /** Returns true if a wake lock is currently held. */
  held: boolean;
  /** Attempts to acquire the screen wake lock (idempotent). */
  acquire: () => Promise<void>;
  /** Releases the wake lock if held (idempotent). */
  release: () => Promise<void>;
  /**
   * Convenience helper to acquire or release depending on a condition.
   * If condition is true, acquire (and retry on visibility when necessary), otherwise release.
   */
  acquireWhen: (condition: boolean) => Promise<void>;
}

/**
 * React hook to manage the Screen Wake Lock.
 *
 * @param options - Optional configuration for auto-reacquire behavior.
 * @returns API to control the wake lock and derived state.
 */
export function useWakeLock(options: UseWakeLockOptions = {}): UseWakeLockApi {
  const { auto = true } = options;
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const sentinelRef = useRef<WakeLockSentinelAny | null>(null);
  const [held, setHeld] = useState<boolean>(false);
  const pendingAcquireRef = useRef<boolean>(false);

  const doAcquire = useCallback(async (): Promise<void> => {
    if (!supported) return;
    if (document.visibilityState !== 'visible') {
      // Not allowed while hidden; mark pending and try later.
      pendingAcquireRef.current = true;
      setHeld(false);
      return;
    }
    try {
      // Idempotent: if already held, verify and return
      if (sentinelRef.current) {
        setHeld(true);
        return;
      }
      const wl = await (navigator as any).wakeLock.request('screen');
      sentinelRef.current = wl;
      setHeld(true);
      // Reacquire on release event if configured
      wl.addEventListener?.('release', () => {
        setHeld(false);
        sentinelRef.current = null;
        if (auto) {
          // Attempt re-acquire on next tick (will defer if hidden)
          void doAcquire();
        }
      });
    } catch (err: any) {
      // NotAllowedError likely due to visibility; mark pending and retry on visibility
      pendingAcquireRef.current = true;
      setHeld(false);
    }
  }, [auto, supported]);

  const doRelease = useCallback(async (): Promise<void> => {
    pendingAcquireRef.current = false;
    try {
      await sentinelRef.current?.release?.();
    } catch {}
    sentinelRef.current = null;
    setHeld(false);
  }, []);

  // Visibility handling: when the tab becomes visible, attempt pending acquire
  useEffect(() => {
    if (!supported) return;
    const onVisibility = (): void => {
      if (document.visibilityState === 'visible' && (auto || pendingAcquireRef.current)) {
        void doAcquire();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onVisibility);
    };
  }, [auto, supported, doAcquire]);

  const acquireWhen = useCallback(async (condition: boolean): Promise<void> => {
    if (condition) {
      await doAcquire();
    } else {
      await doRelease();
    }
  }, [doAcquire, doRelease]);

  return {
    supported,
    held,
    acquire: doAcquire,
    release: doRelease,
    acquireWhen,
  };
}


