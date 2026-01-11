/**
 * @fileoverview Audio player utilities
 * @summary Functions for playing notification sounds
 * @description Utility functions for playing audio notifications (incoming call, hang up)
 */

/**
 * Plays the incoming call sound notification
 * 
 * Creates a new Audio instance for each call to allow overlapping sounds
 * and ensures the sound plays even if the previous one is still playing
 */
export function playIncomingCallSound(): void {
  try {
    const audio = new Audio('/sounds/incoming-call.wav');
    audio.volume = 0.7;
    audio.play().catch((error) => {
      console.warn('[audioPlayer] Failed to play incoming call sound:', error);
    });
  } catch (error) {
    console.warn('[audioPlayer] Error creating incoming call sound:', error);
  }
}

/**
 * Plays the hang up sound notification
 * 
 * Creates a new Audio instance for each call to allow overlapping sounds
 * and ensures the sound plays even if the previous one is still playing
 */
export function playHangUpSound(): void {
  try {
    const audio = new Audio('/sounds/hang-up.wav');
    audio.volume = 0.7;
    audio.play().catch((error) => {
      console.warn('[audioPlayer] Failed to play hang up sound:', error);
    });
  } catch (error) {
    console.warn('[audioPlayer] Error creating hang up sound:', error);
  }
}

