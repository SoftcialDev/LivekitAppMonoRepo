/**
 * @fileoverview PSO Dashboard constants
 * @summary Constants for PSO Dashboard module
 * @description Video encoding and streaming configuration constants
 */

/**
 * Video resolution for PSO dashboard streaming (240p)
 */
export const VIDEO_RESOLUTION = {
  width: 320,
  height: 240,
} as const;

/**
 * Video frame rate for PSO dashboard streaming
 */
export const VIDEO_FRAME_RATE = 15;

/**
 * Video encoding configuration for LiveKit publishing
 */
export const VIDEO_ENCODING = {
  maxBitrate: 150_000, // 150 kbps max for 240p (maximum efficiency)
  maxFramerate: 15,
} as const;

/**
 * Auto-reload interval when not streaming (60 seconds)
 * Matches admin-web behavior for consistent refresh behavior
 */
export const AUTO_RELOAD_INTERVAL_MS = 60_000; // 60 seconds

/**
 * Camera models that should be permanently blocked/filtered out
 * These cameras are known to cause issues and should not be used
 */
export const BLOCKED_CAMERA_MODELS = [
  /Logi(?:tech)? C930e/i,
] as const;

/**
 * Preferred camera model pattern (highest priority)
 * Cameras matching this pattern will be tried first
 */
export const PREFERRED_CAMERA_MODEL = /Logi C270 HD/i;

