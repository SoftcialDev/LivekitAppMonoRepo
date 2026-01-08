/**
 * @fileoverview useAudioPlay - Hook for safely playing HTMLAudioElement with retry logic
 * @summary Handles audio playback with limited retries and user interaction detection
 * @description Provides a safe way to play audio elements that respects browser autoplay
 * policies and limits retry attempts to prevent infinite loops.
 */

import { useCallback, useRef } from 'react';

/**
 * Options for useAudioPlay hook
 */
export interface UseAudioPlayOptions {
  /**
   * Maximum number of retry attempts (default: 2)
   */
  maxRetries?: number;
  /**
   * Delay between retries in milliseconds (default: 300)
   */
  retryDelay?: number;
}

/**
 * Return type for useAudioPlay hook
 */
export interface UseAudioPlay {
  /**
   * Attempts to play the audio element with retry logic
   * Stops retrying if NotAllowedError (requires user interaction)
   * @param audioElement - The HTMLAudioElement to play
   * @returns Promise that resolves when playback starts or rejects if all retries fail
   */
  playAudio: (audioElement: HTMLAudioElement | null) => Promise<void>;
}

/**
 * Hook for safely playing audio elements with limited retry logic
 * @param options - Configuration options
 * @returns Object with playAudio function
 */
export function useAudioPlay(options: UseAudioPlayOptions = {}): UseAudioPlay {
  const { maxRetries = 2, retryDelay = 300 } = options;
  const retryCountRef = useRef<number>(0);

  const playAudio = useCallback(
    async (audioElement: HTMLAudioElement | null): Promise<void> => {
      if (!audioElement || typeof audioElement.play !== 'function') {
        return;
      }

      // Reset retry count for new playback attempt
      retryCountRef.current = 0;

      const tryPlay = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (retryCountRef.current >= maxRetries) {
            console.warn('[useAudioPlay] Max retries reached - user interaction may be required');
            reject(new Error('Max retries reached'));
            return;
          }

          const playPromise = audioElement.play();
          if (!playPromise) {
            resolve();
            return;
          }

          playPromise
            .then(() => {
              console.log('[useAudioPlay] Audio playing successfully');
              retryCountRef.current = 0; // Reset on success
              resolve();
            })
            .catch((err: Error) => {
              retryCountRef.current++;

              // NotAllowedError means user interaction is required - don't retry
              if (err.name === 'NotAllowedError') {
                console.warn('[useAudioPlay] User interaction required to play audio');
                reject(err);
                return;
              }

              // For other errors, retry if we haven't exceeded max retries
              if (retryCountRef.current < maxRetries) {
                console.warn('[useAudioPlay] Play failed, retrying:', err);
                setTimeout(() => {
                  tryPlay().then(resolve).catch(reject);
                }, retryDelay);
              } else {
                reject(err);
              }
            });
        });
      };

      return tryPlay();
    },
    [maxRetries, retryDelay]
  );

  return { playAudio };
}

