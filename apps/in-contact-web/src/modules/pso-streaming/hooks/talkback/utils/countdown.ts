/**
 * @fileoverview Countdown utilities
 * @summary Helper functions for managing countdown timers
 * @description Utilities for starting and managing countdown intervals
 */

import { COUNTDOWN_INTERVAL_MS, COUNTDOWN_DURATION_MS } from '../constants/talkbackConstants';
import type { ICountdownCallbacks } from '../types/countdownTypes';

/**
 * Starts a countdown timer and executes a callback when it completes
 * 
 * @param callbacks - Callbacks for countdown events
 * @returns Function to cancel the countdown
 */
export function startCountdown(
  callbacks: ICountdownCallbacks
): () => void {
  callbacks.onCountdownStart();
  callbacks.onCountdownUpdate(3);

  let currentCountdown = 3;
  const countdownInterval = setInterval(() => {
    currentCountdown -= 1;
    if (currentCountdown > 0) {
      callbacks.onCountdownUpdate(currentCountdown);
    } else {
      clearInterval(countdownInterval);
      callbacks.onCountdownUpdate(null);
      callbacks.onCountdownEnd();
    }
  }, COUNTDOWN_INTERVAL_MS);

  const timeoutId = window.setTimeout(async () => {
    clearInterval(countdownInterval);
    callbacks.onCountdownUpdate(null);
    callbacks.onCountdownEnd();

    try {
      await callbacks.onComplete();
    } catch (error) {
      throw error;
    }
  }, COUNTDOWN_DURATION_MS);

  // Return cancel function
  return () => {
    clearInterval(countdownInterval);
    clearTimeout(timeoutId);
    callbacks.onCountdownUpdate(null);
    callbacks.onCountdownEnd();
  };
}

