/**
 * @fileoverview LoadingPage constants
 * @summary Constants for user info loading retry logic
 * @description Configuration constants for retrying user information loading
 * after authentication. Defines retry interval, maximum retry time, and
 * maximum number of attempts.
 */

/**
 * Maximum total time to spend retrying in milliseconds
 * 
 * @constant
 * @default 60000 (1 minute)
 */
export const MAX_RETRY_TIME_MS = 60000;

/**
 * Maximum number of retry attempts
 * 
 * @constant
 * @default 4
 */
export const MAX_RETRY_ATTEMPTS = 4;

/**
 * Time interval between retry attempts in milliseconds
 * 
 * Calculated as: MAX_RETRY_TIME_MS / MAX_RETRY_ATTEMPTS
 * This ensures we distribute the attempts evenly over the maximum time window
 * 
 * @constant
 * @default 15000 (15 seconds)
 */
export const RETRY_INTERVAL_MS = Math.floor(MAX_RETRY_TIME_MS / MAX_RETRY_ATTEMPTS);

