/**
 * @fileoverview CreateSnapshotReasonApplicationService - Application service for creating snapshot reasons
 * @summary Handles application-level logic for creating snapshot reasons
 * @description Orchestrates snapshot reason creation with authorization
 */

import { CreateSnapshotReasonDomainService } from '../../domain/services/CreateSnapshotReasonDomainService';
import { CreateSnapshotReasonRequest } from '../../domain/value-objects/CreateSnapshotReasonRequest';
import { SnapshotReasonResponse } from '../../domain/value-objects/SnapshotReasonResponse';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { UserRole } from '../../domain/enums/UserRole';

/**
 * Application service for snapshot reason creation operations
 * @description Handles application-level orchestration for creating snapshot reasons
 */
export class CreateSnapshotReasonApplicationService {
  /**
   * Creates a new CreateSnapshotReasonApplicationService instance
   * @param createSnapshotReasonDomainService - Domain service for snapshot reason creation
   * @param authorizationService - Authorization service for permission checks
   */
  constructor(
    private readonly createSnapshotReasonDomainService: CreateSnapshotReasonDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Creates a new snapshot reason
   * @param callerId - Azure AD Object ID of the caller
   * @param request - The snapshot reason creation request
   * @returns Promise that resolves to the created snapshot reason response
   */
  async createSnapshotReason(callerId: string, request: CreateSnapshotReasonRequest): Promise<SnapshotReasonResponse> {
    await this.authorizationService.authorizeUserWithRoles(callerId, [UserRole.Admin, UserRole.SuperAdmin], 'creating snapshot reasons');
    return await this.createSnapshotReasonDomainService.createSnapshotReason(request);
  }
}

