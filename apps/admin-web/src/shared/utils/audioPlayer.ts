/**
 * @fileoverview audioPlayer.ts - Utility for playing notification sounds
 * @summary Provides functions to play incoming call and hang up sounds
 * @description This utility abstracts the HTML5 Audio API to play specific
 * notification sounds. Sound paths can be configured via environment variables
 * to allow for easy customization without code changes.
 */

/**
 * Default path for the incoming call sound file.
 */
const DEFAULT_INCOMING_CALL_SOUND = '/sounds/incoming-call.wav';

/**
 * Default path for the hang up sound file.
 */
const DEFAULT_HANG_UP_SOUND = '/sounds/hang-up.wav';

/**
 * Default volume level for notification sounds (0.0 to 1.0).
 */
const DEFAULT_VOLUME = 0.7;

/**
 * Retrieves the sound file path from environment variables.
 * If the environment variable is not set or not a string, it falls back to a default value.
 * This function is client-side safe, returning the default if `window` is undefined.
 *
 * @param envVar - The name of the environment variable (e.g., 'VITE_TALK_INCOMING_CALL_SOUND').
 * @param defaultValue - The default path to use if the environment variable is not found.
 * @returns The resolved sound file path.
 */
function getSoundPath(envVar: string, defaultValue: string): string {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  const envValue = import.meta.env[envVar];
  return envValue && typeof envValue === 'string' ? envValue : defaultValue;
}

/**
 * Creates and plays an audio element with a specified sound path and volume.
 * Stops playback after 2 seconds maximum.
 *
 * @param soundPath - The URL or path to the audio file.
 * @param volume - The volume level for the audio, clamped between 0.0 and 1.0.
 */
function playSound(soundPath: string, volume: number = DEFAULT_VOLUME): void {
  try {
    console.log('[AudioPlayer] Attempting to play sound:', soundPath);
    const audio = new Audio(soundPath);
    audio.volume = Math.max(0, Math.min(1, volume));
    
    const stopTimeout = setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 2000);
    
    audio.addEventListener('ended', () => {
      clearTimeout(stopTimeout);
      console.log('[AudioPlayer] Sound playback ended:', soundPath);
    });
    
    audio.addEventListener('error', (error) => {
      clearTimeout(stopTimeout);
      console.error('[AudioPlayer] Audio error:', soundPath, error);
    });
    
    audio.addEventListener('loadeddata', () => {
      console.log('[AudioPlayer] Audio loaded successfully:', soundPath);
    });
    
    audio.play().then(() => {
      console.log('[AudioPlayer] Sound playing successfully:', soundPath);
    }).catch((error) => {
      clearTimeout(stopTimeout);
      console.error('[AudioPlayer] Failed to play sound:', soundPath, error);
    });
  } catch (error) {
    console.error('[AudioPlayer] Error creating audio element:', error);
  }
}

/**
 * Plays the configured incoming call notification sound.
 * The sound path is determined by `VITE_TALK_INCOMING_CALL_SOUND` environment variable
 * or defaults to `/sounds/incoming-call.wav`.
 */
export function playIncomingCallSound(): void {
  const soundPath = getSoundPath(
    'VITE_TALK_INCOMING_CALL_SOUND',
    DEFAULT_INCOMING_CALL_SOUND
  );
  console.log('[AudioPlayer] Playing incoming call sound from:', soundPath);
  playSound(soundPath, DEFAULT_VOLUME);
}

/**
 * Plays the configured hang up notification sound.
 * The sound path is determined by `VITE_TALK_HANG_UP_SOUND` environment variable
 * or defaults to `/sounds/hang-up.wav`.
 */
export function playHangUpSound(): void {
  const soundPath = getSoundPath(
    'VITE_TALK_HANG_UP_SOUND',
    DEFAULT_HANG_UP_SOUND
  );
  playSound(soundPath, DEFAULT_VOLUME);
}

