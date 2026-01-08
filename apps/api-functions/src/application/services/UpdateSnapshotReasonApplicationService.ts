/**
 * @fileoverview UpdateSnapshotReasonApplicationService - Application service for updating snapshot reasons
 * @summary Handles application-level logic for updating snapshot reasons
 * @description Orchestrates snapshot reason updates with authorization
 */

import { UpdateSnapshotReasonDomainService } from '../../domain/services/UpdateSnapshotReasonDomainService';
import { SnapshotReasonResponse } from '../../domain/value-objects/SnapshotReasonResponse';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { UserRole } from '@prisma/client';

/**
 * Application service for snapshot reason update operations
 * @description Handles application-level orchestration for updating snapshot reasons
 */
export class UpdateSnapshotReasonApplicationService {
  /**
   * Creates a new UpdateSnapshotReasonApplicationService instance
   * @param updateSnapshotReasonDomainService - Domain service for snapshot reason updates
   * @param authorizationService - Authorization service for permission checks
   */
  constructor(
    private readonly updateSnapshotReasonDomainService: UpdateSnapshotReasonDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Updates a snapshot reason
   * @param callerId - Azure AD Object ID of the caller
   * @param id - The ID of the snapshot reason to update
   * @param data - Updated snapshot reason data
   * @returns Promise that resolves to the updated snapshot reason response
   */
  async updateSnapshotReason(
    callerId: string,
    id: string,
    data: {
      label?: string;
      code?: string;
      order?: number;
      isActive?: boolean;
    }
  ): Promise<SnapshotReasonResponse> {
    await this.authorizationService.authorizeUserWithRoles(callerId, [UserRole.Admin, UserRole.SuperAdmin], 'updating snapshot reasons');
    return await this.updateSnapshotReasonDomainService.updateSnapshotReason(id, data);
  }
}

