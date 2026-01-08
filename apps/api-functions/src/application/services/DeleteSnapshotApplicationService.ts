/**
 * @fileoverview DeleteSnapshotApplicationService - Application service for snapshot deletion operations
 * @summary Orchestrates snapshot deletion operations
 * @description Handles orchestration of domain services for snapshot deletion operations
 */

import { DeleteSnapshotRequest } from '../../domain/value-objects/DeleteSnapshotRequest';
import { DeleteSnapshotResponse } from '../../domain/value-objects/DeleteSnapshotResponse';
import { DeleteSnapshotDomainService } from '../../domain/services/DeleteSnapshotDomainService';

/**
 * Application service for handling snapshot deletion operations
 * @description Orchestrates domain services for snapshot deletions
 */
export class DeleteSnapshotApplicationService {
  /**
   * Creates a new DeleteSnapshotApplicationService instance
   * @param deleteSnapshotDomainService - Domain service for snapshot deletion business logic
   */
  constructor(
    private readonly deleteSnapshotDomainService: DeleteSnapshotDomainService
  ) {}

  /**
   * Deletes a snapshot report
   * @param callerId - The ID of the user making the request
   * @param request - The snapshot deletion request
   * @returns Promise that resolves to the snapshot deletion response
   * @throws Error when deletion fails
   * @example
   * const response = await deleteSnapshotApplicationService.deleteSnapshot(callerId, request);
   */
  async deleteSnapshot(callerId: string, request: DeleteSnapshotRequest): Promise<DeleteSnapshotResponse> {
    // Permission check is done at middleware level
    return await this.deleteSnapshotDomainService.deleteSnapshot(request);
  }
}
