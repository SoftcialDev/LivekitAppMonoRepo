/**
 * @fileoverview Audio player utilities
 * @summary Functions for playing notification sounds
 * @description Utility functions for playing audio notifications (incoming call, hang up)
 */

// Keep track of the current incoming call audio to stop it if needed
let currentIncomingCallAudio: HTMLAudioElement | null = null;
let incomingCallTimeout: NodeJS.Timeout | null = null;

// Keep track of the current hang up audio to stop it if needed
let currentHangUpAudio: HTMLAudioElement | null = null;
let hangUpTimeout: NodeJS.Timeout | null = null;

/**
 * Plays the incoming call sound notification
 * 
 * Creates a new Audio instance for each call to allow overlapping sounds
 * and ensures the sound plays even if the previous one is still playing.
 * Stops the sound after 2.5 seconds as per requirements.
 */
export function playIncomingCallSound(): void {
  try {
    // Stop any currently playing incoming call sound
    if (currentIncomingCallAudio) {
      currentIncomingCallAudio.pause();
      currentIncomingCallAudio.currentTime = 0;
      currentIncomingCallAudio = null;
    }
    
    // Clear any existing timeout
    if (incomingCallTimeout) {
      clearTimeout(incomingCallTimeout);
      incomingCallTimeout = null;
    }
    
    const audio = new Audio('/sounds/incoming-call.wav');
    audio.volume = 0.7;
    currentIncomingCallAudio = audio;
    
    audio.play().catch((error) => {
      console.warn('[audioPlayer] Failed to play incoming call sound:', error);
      currentIncomingCallAudio = null;
    });
    
    // Stop the audio after 2.5 seconds
    incomingCallTimeout = setTimeout(() => {
      if (currentIncomingCallAudio) {
        currentIncomingCallAudio.pause();
        currentIncomingCallAudio.currentTime = 0;
        currentIncomingCallAudio = null;
      }
      incomingCallTimeout = null;
    }, 2500);
  } catch (error) {
    console.warn('[audioPlayer] Error creating incoming call sound:', error);
  }
}

/**
 * Plays the hang up sound notification
 * 
 * Creates a new Audio instance for each call to allow overlapping sounds
 * and ensures the sound plays even if the previous one is still playing.
 * Stops the sound after 2.5 seconds as per requirements.
 * 
 * @returns Promise that resolves when the sound finishes playing or is stopped after 2.5 seconds
 */
export function playHangUpSound(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Stop any currently playing hang up sound
      if (currentHangUpAudio) {
        currentHangUpAudio.pause();
        currentHangUpAudio.currentTime = 0;
        currentHangUpAudio = null;
      }
      
      // Clear any existing timeout
      if (hangUpTimeout) {
        clearTimeout(hangUpTimeout);
        hangUpTimeout = null;
      }
      
      const audio = new Audio('/sounds/hang-up.wav');
      audio.volume = 0.7;
      currentHangUpAudio = audio;
      
      // Resolve promise when audio ends naturally (before 2.5 seconds)
      audio.addEventListener('ended', () => {
        currentHangUpAudio = null;
        if (hangUpTimeout) {
          clearTimeout(hangUpTimeout);
          hangUpTimeout = null;
        }
        resolve();
      });
      
      audio.addEventListener('error', (error) => {
        currentHangUpAudio = null;
        if (hangUpTimeout) {
          clearTimeout(hangUpTimeout);
          hangUpTimeout = null;
        }
        if (error instanceof Error) {
          reject(error);
        } else if (typeof error === 'object' && error !== null) {
          reject(new Error(JSON.stringify(error)));
        } else {
          reject(new Error(String(error)));
        }
      });
      
      audio.play().catch((error) => {
        console.warn('[audioPlayer] Failed to play hang up sound:', error);
        currentHangUpAudio = null;
        if (hangUpTimeout) {
          clearTimeout(hangUpTimeout);
          hangUpTimeout = null;
        }
        reject(error);
      });
      
      // Stop the audio after 2.5 seconds and resolve the promise
      hangUpTimeout = setTimeout(() => {
        if (currentHangUpAudio) {
          currentHangUpAudio.pause();
          currentHangUpAudio.currentTime = 0;
          currentHangUpAudio = null;
        }
        hangUpTimeout = null;
        resolve();
      }, 2500);
    } catch (error) {
      console.warn('[audioPlayer] Error creating hang up sound:', error);
      reject(error);
    }
  });
}

