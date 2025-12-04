/**
 * @fileoverview DeleteSnapshotReasonDomainService - Domain service for deleting snapshot reasons
 * @summary Handles business logic for soft deleting snapshot reasons
 * @description Encapsulates the business rules for soft deleting snapshot reasons
 */

import { ISnapshotReasonRepository } from '../interfaces/ISnapshotReasonRepository';

/**
 * Domain service for handling snapshot reason deletion operations
 * @description Encapsulates business logic for soft deleting snapshot reasons
 */
export class DeleteSnapshotReasonDomainService {
  /**
   * Creates a new DeleteSnapshotReasonDomainService instance
   * @param snapshotReasonRepository - Repository for snapshot reason data access
   */
  constructor(
    private readonly snapshotReasonRepository: ISnapshotReasonRepository
  ) {}

  /**
   * Soft deletes a snapshot reason
   * @param id - The ID of the snapshot reason to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteSnapshotReason(id: string): Promise<void> {
    const reason = await this.snapshotReasonRepository.findById(id);
    if (!reason) {
      throw new Error(`Snapshot reason with ID '${id}' not found`);
    }

    if (reason.code === 'OTHER') {
      throw new Error('Cannot delete the "OTHER" reason');
    }

    if (reason.isDefault) {
      throw new Error('Cannot delete default reasons');
    }

    await this.snapshotReasonRepository.softDelete(id);
  }
}

