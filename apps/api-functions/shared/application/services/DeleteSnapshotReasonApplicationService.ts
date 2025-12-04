/**
 * @fileoverview DeleteSnapshotReasonApplicationService - Application service for deleting snapshot reasons
 * @summary Handles application-level logic for deleting snapshot reasons
 * @description Orchestrates snapshot reason deletion with authorization
 */

import { DeleteSnapshotReasonDomainService } from '../../domain/services/DeleteSnapshotReasonDomainService';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { UserRole } from '../../domain/enums/UserRole';

/**
 * Application service for snapshot reason deletion operations
 * @description Handles application-level orchestration for deleting snapshot reasons
 */
export class DeleteSnapshotReasonApplicationService {
  /**
   * Creates a new DeleteSnapshotReasonApplicationService instance
   * @param deleteSnapshotReasonDomainService - Domain service for snapshot reason deletion
   * @param authorizationService - Authorization service for permission checks
   */
  constructor(
    private readonly deleteSnapshotReasonDomainService: DeleteSnapshotReasonDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Soft deletes a snapshot reason
   * @param callerId - Azure AD Object ID of the caller
   * @param id - The ID of the snapshot reason to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteSnapshotReason(callerId: string, id: string): Promise<void> {
    await this.authorizationService.authorizeUserWithRoles(callerId, [UserRole.Admin, UserRole.SuperAdmin], 'deleting snapshot reasons');
    await this.deleteSnapshotReasonDomainService.deleteSnapshotReason(id);
  }
}

