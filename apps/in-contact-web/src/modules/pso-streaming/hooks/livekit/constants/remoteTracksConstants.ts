/**
 * @fileoverview Remote tracks constants
 * @summary Constants for remote tracks management
 * @description Configuration constants for track subscription polling
 */

/**
 * Maximum duration for audio track subscription attempts in milliseconds
 * @constant
 * @default 5000 (5 seconds)
 */
export const MAX_AUDIO_SUBSCRIPTION_DURATION_MS = 5000;

/**
 * Interval between audio subscription checks in milliseconds (faster polling)
 * @constant
 * @default 150
 */
export const AUDIO_CHECK_INTERVAL_MS = 150;

/**
 * Maximum number of checks for room availability
 * @constant
 * @default 40
 */
export const MAX_ROOM_CHECK_COUNT = 40;

/**
 * Interval between room availability checks in milliseconds
 * @constant
 * @default 500
 */
export const ROOM_CHECK_INTERVAL_MS = 500;

