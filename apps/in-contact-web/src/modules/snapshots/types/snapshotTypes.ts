/**
 * @fileoverview Snapshot type definitions
 * @summary Type definitions for snapshot reports
 * @description Defines interfaces and types for snapshot reports
 */

/**
 * Snapshot reason information
 */
export interface SnapshotReason {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Human-readable reason label
   */
  label: string;

  /**
   * Reason code (e.g., "SUSPICIOUS_BEHAVIOR")
   */
  code: string;

  /**
   * Whether this is the default reason
   */
  isDefault: boolean;

  /**
   * Whether this reason is active
   */
  isActive: boolean;

  /**
   * Display order
   */
  order: number;
}

/**
 * Snapshot report returned by the API
 */
export interface SnapshotReport {
  /**
   * Unique identifier for the snapshot
   */
  id: string;

  /**
   * Full name of the supervisor who took the snapshot
   */
  supervisorName: string;

  /**
   * Full name of the PSO
   */
  psoFullName?: string;

  /**
   * Email of the PSO
   */
  psoEmail?: string;

  /**
   * Reason for taking the snapshot
   */
  reason?: SnapshotReason;

  /**
   * Additional description
   */
  description?: string;

  /**
   * URL of the snapshot image
   */
  imageUrl: string;

  /**
   * ISO-8601 timestamp when the snapshot was taken
   */
  takenAt?: string;
}

/**
 * Response from getSnapshots API
 */
export interface GetSnapshotsResponse {
  /**
   * Array of snapshot reports
   */
  reports: SnapshotReport[];
}

