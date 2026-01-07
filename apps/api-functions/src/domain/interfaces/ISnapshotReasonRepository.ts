/**
 * @fileoverview ISnapshotReasonRepository - Interface for snapshot reason data access operations
 * @summary Repository interface for snapshot reason operations
 * @description Defines the contract for snapshot reason data access operations
 */

import { SnapshotReasonEntity } from '../types/SnapshotReasonTypes';

/**
 * Interface for snapshot reason repository operations
 * @description Defines methods for snapshot reason data access
 */
export interface ISnapshotReasonRepository {
  /**
   * Finds all active snapshot reasons ordered by order field
   * @returns Promise that resolves to array of active snapshot reasons
   */
  findAllActive(): Promise<SnapshotReasonEntity[]>;

  /**
   * Finds a snapshot reason by ID
   * @param id - The ID of the snapshot reason
   * @returns Promise that resolves to the snapshot reason or null
   */
  findById(id: string): Promise<SnapshotReasonEntity | null>;

  /**
   * Finds a snapshot reason by code
   * @param code - The code of the snapshot reason
   * @returns Promise that resolves to the snapshot reason or null
   */
  findByCode(code: string): Promise<SnapshotReasonEntity | null>;

  /**
   * Creates a new snapshot reason
   * @param data - Snapshot reason data
   * @returns Promise that resolves to the created snapshot reason
   */
  create(data: {
    label: string;
    code: string;
    isDefault?: boolean;
    order: number;
  }): Promise<SnapshotReasonEntity>;

  /**
   * Updates a snapshot reason
   * @param id - The ID of the snapshot reason to update
   * @param data - Updated snapshot reason data
   * @returns Promise that resolves to the updated snapshot reason
   */
  update(id: string, data: {
    label?: string;
    code?: string;
    order?: number;
    isActive?: boolean;
  }): Promise<SnapshotReasonEntity>;

  /**
   * Soft deletes a snapshot reason (sets isActive to false)
   * @param id - The ID of the snapshot reason to delete
   * @returns Promise that resolves when deletion is complete
   */
  softDelete(id: string): Promise<void>;

  /**
   * Updates multiple snapshot reasons in batch
   * @param reasons - Array of snapshot reason updates
   * @returns Promise that resolves when batch update is complete
   */
  updateBatch(reasons: Array<{
    id: string;
    label?: string;
    order?: number;
    isActive?: boolean;
  }>): Promise<void>;
}

