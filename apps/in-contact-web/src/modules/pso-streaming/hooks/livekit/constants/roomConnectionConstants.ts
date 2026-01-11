/**
 * @fileoverview Room connection constants
 * @summary Constants for LiveKit room connection
 * @description Configuration constants for room connection retry logic and reconnection
 */

/**
 * Maximum number of reconnection attempts before giving up
 * @constant
 * @default 4
 */
export const MAX_RECONNECT_ATTEMPTS = 4;

/**
 * Maximum number of connection retry attempts during initial connection
 * @constant
 * @default 2
 */
export const MAX_RETRY_ATTEMPTS = 2;

/**
 * Base delay for retry attempts in milliseconds
 * @constant
 * @default 1500
 */
export const RETRY_BASE_DELAY_MS = 1500;

/**
 * Initial delay for reconnection in milliseconds (for DUPLICATE_IDENTITY)
 * @constant
 * @default 5000
 */
export const INITIAL_RECONNECT_DELAY_MS = 5000;

/**
 * Initial delay for normal reconnections in milliseconds
 * @constant
 * @default 1000
 */
export const NORMAL_RECONNECT_DELAY_MS = 1000;

/**
 * Maximum delay between reconnection attempts in milliseconds
 * @constant
 * @default 30000
 */
export const MAX_RECONNECT_DELAY_MS = 30000;

/**
 * Delay multiplier for exponential backoff
 * @constant
 * @default 2
 */
export const RECONNECT_DELAY_MULTIPLIER = 2;

/**
 * Time window to detect rapid DUPLICATE_IDENTITY disconnections (refresh scenario) in milliseconds
 * @constant
 * @default 10000
 */
export const DUPLICATE_IDENTITY_WINDOW_MS = 10000;

/**
 * Extended delay when refresh is detected in milliseconds
 * @constant
 * @default 8000
 */
export const REFRESH_DETECTED_DELAY_MS = 8000;

/**
 * Number of rapid DUPLICATE_IDENTITY disconnections to detect refresh scenario
 * @constant
 * @default 3
 */
export const REFRESH_DETECTION_THRESHOLD = 3;

/**
 * Delay before reconnecting after parameter change in milliseconds
 * @constant
 * @default 1000
 * @description Increased from 100ms to 1000ms to allow LiveKit server to fully clean up
 * previous connection before reconnecting, preventing DisconnectReason.DUPLICATE_IDENTITY (code 2)
 */
export const RECONNECT_DELAY_MS = 1000;

