/**
 * @fileoverview GetSnapshotsApplicationService - Application service for snapshot retrieval operations
 * @summary Orchestrates snapshot retrieval operations
 * @description Handles orchestration of domain services for snapshot retrieval operations
 */

import { GetSnapshotsRequest } from "../../domain/value-objects/GetSnapshotsRequest";
import { GetSnapshotsResponse } from "../../domain/value-objects/GetSnapshotsResponse";
import { GetSnapshotsDomainService } from "../../domain/services/GetSnapshotsDomainService";
import { AuthorizationService } from "../../domain/services/AuthorizationService";
import { UserRole } from "../../domain/enums/UserRole";

/**
 * Application service for handling snapshot retrieval operations
 * @description Orchestrates domain services for snapshot retrievals
 */
export class GetSnapshotsApplicationService {
  /**
   * Creates a new GetSnapshotsApplicationService instance
   * @param getSnapshotsDomainService - Domain service for snapshot retrieval business logic
   * @param authorizationService - Authorization service for permission checks
   */
  constructor(
    private readonly getSnapshotsDomainService: GetSnapshotsDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Retrieves all snapshot reports
   * @param callerId - The ID of the user making the request
   * @param request - The snapshot retrieval request
   * @returns Promise that resolves to the snapshot reports response
   * @throws Error when caller is not authorized or retrieval fails
   * @example
   * const response = await getSnapshotsApplicationService.getSnapshots(callerId, request);
   */
  async getSnapshots(callerId: string, request: GetSnapshotsRequest): Promise<GetSnapshotsResponse> {
    // Only Admins and SuperAdmins can view snapshots
    await this.authorizationService.authorizeUserWithRoles(
      callerId, 
      [UserRole.Admin, UserRole.SuperAdmin], 
      'viewing snapshots'
    );

    return await this.getSnapshotsDomainService.getSnapshots(request);
  }
}
