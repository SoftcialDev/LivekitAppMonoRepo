/**
 * @fileoverview GetSnapshotReasonsApplicationService - Application service for retrieving snapshot reasons
 * @summary Handles application-level logic for retrieving snapshot reasons
 * @description Orchestrates snapshot reason retrieval with authorization
 */

import { GetSnapshotReasonsDomainService } from '../../domain/services/GetSnapshotReasonsDomainService';
import { SnapshotReasonResponse } from '../../domain/value-objects/SnapshotReasonResponse';

/**
 * Application service for snapshot reason retrieval operations
 * @description Handles application-level orchestration for retrieving snapshot reasons
 */
export class GetSnapshotReasonsApplicationService {
  /**
   * Creates a new GetSnapshotReasonsApplicationService instance
   * @param getSnapshotReasonsDomainService - Domain service for snapshot reason retrieval
   */
  constructor(
    private readonly getSnapshotReasonsDomainService: GetSnapshotReasonsDomainService
  ) {}

  /**
   * Gets all active snapshot reasons
   * @returns Promise that resolves to array of snapshot reason responses
   */
  async getSnapshotReasons(): Promise<SnapshotReasonResponse[]> {
    return await this.getSnapshotReasonsDomainService.getSnapshotReasons();
  }
}

