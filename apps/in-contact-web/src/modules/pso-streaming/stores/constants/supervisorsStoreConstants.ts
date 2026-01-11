/**
 * @fileoverview Supervisors store constants
 * @summary Constants for supervisors store
 * @description Constants including TTL for supervisors list caching
 */

/**
 * Time-to-live for supervisors list cache in milliseconds
 * Supervisors list will be refetched if older than this value
 */
export const SUPERVISORS_TTL_MS = 5 * 60 * 1000;

