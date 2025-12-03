/**
 * @fileoverview AudioPlayer - Utility for playing notification sounds
 * @summary Provides functions to play incoming call and hang up sounds
 */

/**
 * Default path for incoming call sound
 */
const DEFAULT_INCOMING_CALL_SOUND = '/sounds/incoming-call.wav';

/**
 * Default path for hang up sound
 */
const DEFAULT_HANG_UP_SOUND = '/sounds/hang-up.wav';

/**
 * Default volume for notification sounds (0.0 to 1.0)
 */
const DEFAULT_VOLUME = 0.3;

/**
 * Gets the configured sound path from environment variables or returns default
 * @param envVar - Environment variable name
 * @param defaultValue - Default path if env var is not set
 * @returns Sound file path
 */
function getSoundPath(envVar: string, defaultValue: string): string {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  const envValue = import.meta.env[envVar];
  return envValue && typeof envValue === 'string' ? envValue : defaultValue;
}

/**
 * Creates and plays an audio file
 * @param soundPath - Path to the audio file
 * @param volume - Volume level (0.0 to 1.0)
 */
function playSound(soundPath: string, volume: number = DEFAULT_VOLUME): void {
  try {
    const audio = new Audio(soundPath);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch((error) => {
      console.warn('[AudioPlayer] Failed to play sound:', soundPath, error);
    });
  } catch (error) {
    console.warn('[AudioPlayer] Error creating audio element:', error);
  }
}

/**
 * Plays the incoming call notification sound
 * Volume is set to a low level to avoid startling the user
 */
export function playIncomingCallSound(): void {
  const soundPath = getSoundPath(
    'VITE_TALK_INCOMING_CALL_SOUND',
    DEFAULT_INCOMING_CALL_SOUND
  );
  playSound(soundPath, DEFAULT_VOLUME);
}

/**
 * Plays the hang up notification sound
 * Volume is set to a low level to avoid startling the user
 */
export function playHangUpSound(): void {
  const soundPath = getSoundPath(
    'VITE_TALK_HANG_UP_SOUND',
    DEFAULT_HANG_UP_SOUND
  );
  playSound(soundPath, DEFAULT_VOLUME);
}

