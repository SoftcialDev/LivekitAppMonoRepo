/**
 * @fileoverview UpdateSnapshotReasonsBatchDomainService - Domain service for batch updating snapshot reasons
 * @summary Handles business logic for batch updating snapshot reasons
 * @description Encapsulates the business rules for batch updating snapshot reasons
 */

import { ISnapshotReasonRepository } from '../interfaces/ISnapshotReasonRepository';
import { SnapshotReasonNotFoundError, CannotDeactivateOtherReasonError, CannotDeactivateDefaultReasonError } from '../errors/SnapshotErrors';

/**
 * Domain service for handling batch snapshot reason update operations
 * @description Encapsulates business logic for batch updating snapshot reasons
 */
export class UpdateSnapshotReasonsBatchDomainService {
  /**
   * Creates a new UpdateSnapshotReasonsBatchDomainService instance
   * @param snapshotReasonRepository - Repository for snapshot reason data access
   */
  constructor(
    private readonly snapshotReasonRepository: ISnapshotReasonRepository
  ) {}

  /**
   * Updates multiple snapshot reasons in batch
   * @param reasons - Array of snapshot reason updates
   * @returns Promise that resolves when batch update is complete
   */
  async updateSnapshotReasonsBatch(reasons: Array<{
    id: string;
    label?: string;
    order?: number;
    isActive?: boolean;
  }>): Promise<void> {
    for (const reasonUpdate of reasons) {
      const existingReason = await this.snapshotReasonRepository.findById(reasonUpdate.id);
      if (!existingReason) {
        throw new SnapshotReasonNotFoundError(`Snapshot reason with ID '${reasonUpdate.id}' not found`);
      }

      if (existingReason.code === 'OTHER' && reasonUpdate.isActive === false) {
        throw new CannotDeactivateOtherReasonError();
      }

      if (existingReason.isDefault && reasonUpdate.isActive === false) {
        throw new CannotDeactivateDefaultReasonError();
      }
    }

    await this.snapshotReasonRepository.updateBatch(reasons);
  }
}

