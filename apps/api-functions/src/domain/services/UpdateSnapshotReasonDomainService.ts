/**
 * @fileoverview UpdateSnapshotReasonDomainService - Domain service for updating snapshot reasons
 * @summary Handles business logic for updating snapshot reasons
 * @description Encapsulates the business rules for updating snapshot reasons
 */

import { ISnapshotReasonRepository } from '../interfaces/ISnapshotReasonRepository';
import { SnapshotReasonResponse } from '../value-objects/SnapshotReasonResponse';
import { SnapshotReasonNotFoundError, SnapshotReasonAlreadyExistsError, CannotDeactivateOtherReasonError, CannotDeactivateDefaultReasonError } from '../errors/SnapshotErrors';

/**
 * Domain service for handling snapshot reason update operations
 * @description Encapsulates business logic for updating snapshot reasons
 */
export class UpdateSnapshotReasonDomainService {
  /**
   * Creates a new UpdateSnapshotReasonDomainService instance
   * @param snapshotReasonRepository - Repository for snapshot reason data access
   */
  constructor(
    private readonly snapshotReasonRepository: ISnapshotReasonRepository
  ) {}

  /**
   * Updates a snapshot reason
   * @param id - The ID of the snapshot reason to update
   * @param data - Updated snapshot reason data
   * @returns Promise that resolves to the updated snapshot reason response
   */
  async updateSnapshotReason(id: string, data: {
    label?: string;
    code?: string;
    order?: number;
    isActive?: boolean;
  }): Promise<SnapshotReasonResponse> {
    const existingReason = await this.snapshotReasonRepository.findById(id);
    if (!existingReason) {
      throw new SnapshotReasonNotFoundError(`Snapshot reason with ID '${id}' not found`);
    }

    if (existingReason.code === 'OTHER' && data.isActive === false) {
      throw new CannotDeactivateOtherReasonError();
    }

    if (existingReason.isDefault && data.isActive === false) {
      throw new CannotDeactivateDefaultReasonError();
    }

    if (data.code && data.code !== existingReason.code) {
      const codeExists = await this.snapshotReasonRepository.findByCode(data.code);
      if (codeExists) {
        throw new SnapshotReasonAlreadyExistsError(`Snapshot reason with code '${data.code}' already exists`);
      }
    }

    const updated = await this.snapshotReasonRepository.update(id, data);
    return SnapshotReasonResponse.fromDomain(updated);
  }
}

