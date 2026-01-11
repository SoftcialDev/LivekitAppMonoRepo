/**
 * @fileoverview Audio play types
 * @summary Type definitions for audio play hook
 * @description Types for managing audio playback with retry logic
 */

/**
 * Options for useAudioPlay hook
 */
export interface IUseAudioPlayOptions {
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
export interface IUseAudioPlayReturn {
  /**
   * Attempts to play the audio element with retry logic
   * Stops retrying if NotAllowedError (requires user interaction)
   * @param audioElement - The HTMLAudioElement to play
   * @returns Promise that resolves when playback starts or rejects if all retries fail
   */
  playAudio: (audioElement: HTMLAudioElement | null) => Promise<void>;
}

