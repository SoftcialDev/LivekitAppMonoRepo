/**
 * @fileoverview useAudioPlay hook
 * @summary Hook for safely playing HTMLAudioElement with retry logic
 * @description Handles audio playback with limited retries and user interaction detection.
 * Provides a safe way to play audio elements that respects browser autoplay policies
 * and limits retry attempts to prevent infinite loops.
 */

import { useCallback, useRef } from 'react';
import { logWarn, logDebug } from '@/shared/utils/logger';
import { DEFAULT_MAX_RETRIES, DEFAULT_RETRY_DELAY_MS } from './constants/audioPlayConstants';
import type { IUseAudioPlayOptions, IUseAudioPlayReturn } from './types/audioPlayTypes';

/**
 * Hook for safely playing audio elements with limited retry logic
 * 
 * @param options - Configuration options
 * @returns Object with playAudio function
 */
export function useAudioPlay(options: IUseAudioPlayOptions = {}): IUseAudioPlayReturn {
  const { maxRetries = DEFAULT_MAX_RETRIES, retryDelay = DEFAULT_RETRY_DELAY_MS } = options;
  const retryCountRef = useRef<number>(0);

  const playAudio = useCallback(
    async (audioElement: HTMLAudioElement | null): Promise<void> => {
      if (!audioElement || typeof audioElement.play !== 'function') {
        return;
      }

      retryCountRef.current = 0;

      const tryPlay = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (retryCountRef.current >= maxRetries) {
            logWarn('[useAudioPlay] Max retries reached - user interaction may be required');
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
              logDebug('[useAudioPlay] Audio playing successfully');
              retryCountRef.current = 0;
              resolve();
            })
            .catch((err: Error) => {
              retryCountRef.current++;

              if (err.name === 'NotAllowedError') {
                logWarn('[useAudioPlay] User interaction required to play audio');
                reject(err);
                return;
              }

              if (retryCountRef.current < maxRetries) {
                logWarn('[useAudioPlay] Play failed, retrying', { error: err, attempt: retryCountRef.current });
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

