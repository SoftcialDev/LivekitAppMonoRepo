/**
 * @fileoverview Snapshot client types
 * @summary Type definitions for snapshot API client
 * @description Types for snapshot reporting requests and responses
 */

/**
 * Request payload for submitting a snapshot report
 */
export interface SnapshotRequest {
  psoEmail: string;
  reasonId: string;
  description?: string;
  imageBase64: string;
}

/**
 * Response from snapshot submission
 */
export interface SnapshotResponse {
  snapshotId: string;
}

