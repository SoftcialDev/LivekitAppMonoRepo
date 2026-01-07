/**
 * @fileoverview SnapshotReasonTypes - Type definitions for snapshot reason entities
 * @summary Defines types and interfaces for snapshot reason data structures
 * @description Encapsulates snapshot reason entity structure
 */

/**
 * Snapshot reason entity structure
 * @description Represents a snapshot reason in the system
 */
export interface SnapshotReasonEntity {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Human-readable label
   */
  label: string;

  /**
   * Unique code identifier
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

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Last update timestamp
   */
  updatedAt: Date;
}

