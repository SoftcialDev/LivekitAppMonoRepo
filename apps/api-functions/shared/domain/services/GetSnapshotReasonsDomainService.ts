/**
 * @fileoverview GetSnapshotReasonsDomainService - Domain service for retrieving snapshot reasons
 * @summary Handles business logic for retrieving snapshot reasons
 * @description Encapsulates the business rules for retrieving active snapshot reasons
 */

import { ISnapshotReasonRepository } from '../interfaces/ISnapshotReasonRepository';
import { SnapshotReasonResponse } from '../value-objects/SnapshotReasonResponse';

/**
 * Domain service for handling snapshot reason retrieval operations
 * @description Encapsulates business logic for retrieving snapshot reasons
 */
export class GetSnapshotReasonsDomainService {
  /**
   * Creates a new GetSnapshotReasonsDomainService instance
   * @param snapshotReasonRepository - Repository for snapshot reason data access
   */
  constructor(
    private readonly snapshotReasonRepository: ISnapshotReasonRepository
  ) {}

  /**
   * Gets all active snapshot reasons
   * @returns Promise that resolves to array of snapshot reason responses
   */
  async getSnapshotReasons(): Promise<SnapshotReasonResponse[]> {
    const reasons = await this.snapshotReasonRepository.findAllActive();
    return reasons.map(r => SnapshotReasonResponse.fromDomain(r));
  }
}

