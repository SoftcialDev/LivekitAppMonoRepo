/**
 * @fileoverview SendSnapshotApplicationService - Application service for snapshot report operations
 * @summary Orchestrates snapshot report operations
 * @description Handles orchestration of domain services for snapshot report operations
 */

import { SendSnapshotRequest } from '../../domain/value-objects/SendSnapshotRequest';
import { SendSnapshotResponse } from '../../domain/value-objects/SendSnapshotResponse';
import { SendSnapshotDomainService } from '../../domain/services/SendSnapshotDomainService';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { UserRole } from '@prisma/client';

/**
 * Application service for handling snapshot report operations
 * @description Orchestrates domain services for snapshot reports
 */
export class SendSnapshotApplicationService {
  /**
   * Creates a new SendSnapshotApplicationService instance
   * @param sendSnapshotDomainService - Domain service for snapshot report business logic
   * @param authorizationService - Authorization service for permission checks
   */
  constructor(
    private readonly sendSnapshotDomainService: SendSnapshotDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Sends a snapshot report for a PSO.
   * @param callerId - Azure AD object ID of the caller
   * @param request - Snapshot domain request object
   * @returns Snapshot response with the persisted identifier
   * @throws Error when the caller lacks the required role or domain processing fails
   */
  async sendSnapshot(callerId: string, request: SendSnapshotRequest): Promise<SendSnapshotResponse> {
    // Supervisors, Admins, and SuperAdmins can send snapshot reports
    await this.authorizationService.authorizeUserWithRoles(callerId, [UserRole.Supervisor, UserRole.Admin, UserRole.SuperAdmin], "sending snapshots");

    return await this.sendSnapshotDomainService.sendSnapshot(request);
  }
}
