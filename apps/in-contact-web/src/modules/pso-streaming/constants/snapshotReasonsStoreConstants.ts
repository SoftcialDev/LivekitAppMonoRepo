/**
 * @fileoverview Snapshot reasons store constants
 * @summary Constants for snapshot reasons store
 * @description Constants including TTL for snapshot reasons list caching
 */

/**
 * Time-to-live for snapshot reasons list cache in milliseconds
 * Snapshot reasons list will be refetched if older than this value
 */
export const SNAPSHOT_REASONS_TTL_MS = 5 * 60 * 1000;

