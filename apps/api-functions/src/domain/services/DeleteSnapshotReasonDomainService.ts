/**
 * @fileoverview DeleteSnapshotReasonDomainService - Domain service for deleting snapshot reasons
 * @summary Handles business logic for soft deleting snapshot reasons
 * @description Encapsulates the business rules for soft deleting snapshot reasons
 */

import { ISnapshotReasonRepository } from '../interfaces/ISnapshotReasonRepository';
import { SnapshotReasonNotFoundError, CannotDeleteOtherReasonError, CannotDeleteDefaultReasonError } from '../errors/SnapshotErrors';

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
      throw new SnapshotReasonNotFoundError(`Snapshot reason with ID '${id}' not found`);
    }

    if (reason.code === 'OTHER') {
      throw new CannotDeleteOtherReasonError();
    }

    if (reason.isDefault) {
      throw new CannotDeleteDefaultReasonError();
    }

    await this.snapshotReasonRepository.softDelete(id);
  }
}

