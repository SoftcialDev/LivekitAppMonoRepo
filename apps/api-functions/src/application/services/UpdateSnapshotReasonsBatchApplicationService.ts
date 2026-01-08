/**
 * @fileoverview UpdateSnapshotReasonsBatchApplicationService - Application service for batch updating snapshot reasons
 * @summary Handles application-level logic for batch updating snapshot reasons
 * @description Orchestrates batch snapshot reason updates with authorization
 */

import { UpdateSnapshotReasonsBatchDomainService } from '../../domain/services/UpdateSnapshotReasonsBatchDomainService';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { UserRole } from '@prisma/client';

/**
 * Application service for batch snapshot reason update operations
 * @description Handles application-level orchestration for batch updating snapshot reasons
 */
export class UpdateSnapshotReasonsBatchApplicationService {
  /**
   * Creates a new UpdateSnapshotReasonsBatchApplicationService instance
   * @param updateSnapshotReasonsBatchDomainService - Domain service for batch snapshot reason updates
   * @param authorizationService - Authorization service for permission checks
   */
  constructor(
    private readonly updateSnapshotReasonsBatchDomainService: UpdateSnapshotReasonsBatchDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Updates multiple snapshot reasons in batch
   * @param callerId - Azure AD Object ID of the caller
   * @param reasons - Array of snapshot reason updates
   * @returns Promise that resolves when batch update is complete
   */
  async updateSnapshotReasonsBatch(
    callerId: string,
    reasons: Array<{
      id: string;
      label?: string;
      order?: number;
      isActive?: boolean;
    }>
  ): Promise<void> {
    await this.authorizationService.authorizeUserWithRoles(callerId, [UserRole.Admin, UserRole.SuperAdmin], 'batch updating snapshot reasons');
    await this.updateSnapshotReasonsBatchDomainService.updateSnapshotReasonsBatch(reasons);
  }
}

