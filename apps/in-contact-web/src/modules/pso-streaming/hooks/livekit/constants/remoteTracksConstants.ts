/**
 * @fileoverview Remote tracks constants
 * @summary Constants for remote tracks management
 * @description Configuration constants for track subscription polling
 */

/**
 * Maximum number of checks for audio track subscription
 * @constant
 * @default 20
 */
export const MAX_AUDIO_CHECK_COUNT = 20;

/**
 * Interval between audio subscription checks in milliseconds
 * @constant
 * @default 500
 */
export const AUDIO_CHECK_INTERVAL_MS = 500;

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

