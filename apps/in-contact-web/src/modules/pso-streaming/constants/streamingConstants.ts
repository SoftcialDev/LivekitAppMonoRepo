/**
 * @fileoverview Streaming constants
 * @summary Constants for streaming functionality
 * @description Constants including delays, timeouts, and thresholds
 */

/**
 * Delay before fetching sessions and tokens after initialization
 */
export const INIT_FETCH_DELAY_MS = 100;

/**
 * Timeout for pending state before showing failed state in milliseconds
 * Increased to 5000ms to allow more time for PSO to complete refresh/start
 * @constant
 * @default 5000
 */
export const PENDING_TIMEOUT_MS = 5000;

/**
 * Maximum time to wait for 'started' message after 'pending' status in milliseconds
 * If 'started' message is not received within this time, loading state will be set to false
 * @constant
 * @default 15000 (15 seconds)
 */
export const START_CONNECTION_TIMEOUT_MS = 15000;

/**
 * Delay before fetching status after STOP command
 */
export const STOP_STATUS_FETCH_DELAY_MS = 6000;

