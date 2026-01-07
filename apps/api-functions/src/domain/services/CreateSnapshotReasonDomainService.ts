/**
 * @fileoverview CreateSnapshotReasonDomainService - Domain service for creating snapshot reasons
 * @summary Handles business logic for creating snapshot reasons
 * @description Encapsulates the business rules for creating new snapshot reasons
 */

import { SnapshotReasonAlreadyExistsError } from '../errors';
import { ISnapshotReasonRepository } from '../interfaces/ISnapshotReasonRepository';
import { CreateSnapshotReasonRequest } from '../value-objects/CreateSnapshotReasonRequest';
import { SnapshotReasonResponse } from '../value-objects/SnapshotReasonResponse';

/**
 * Domain service for handling snapshot reason creation operations
 * @description Encapsulates business logic for creating snapshot reasons
 */
export class CreateSnapshotReasonDomainService {
  /**
   * Creates a new CreateSnapshotReasonDomainService instance
   * @param snapshotReasonRepository - Repository for snapshot reason data access
   */
  constructor(
    private readonly snapshotReasonRepository: ISnapshotReasonRepository
  ) {}

  /**
   * Creates a new snapshot reason
   * @param request - The snapshot reason creation request
   * @returns Promise that resolves to the created snapshot reason response
   */
  async createSnapshotReason(request: CreateSnapshotReasonRequest): Promise<SnapshotReasonResponse> {
    const existingReason = await this.snapshotReasonRepository.findByCode(request.code);
    if (existingReason) {
      throw new SnapshotReasonAlreadyExistsError(`Snapshot reason with code '${request.code}' already exists`);
    }

    const reason = await this.snapshotReasonRepository.create({
      label: request.label,
      code: request.code,
      order: request.order,
      isDefault: false
    });

    return SnapshotReasonResponse.fromDomain(reason);
  }
}

