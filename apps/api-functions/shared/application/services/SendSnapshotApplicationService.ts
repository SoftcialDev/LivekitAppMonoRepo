/**
 * @fileoverview SendSnapshotApplicationService - Application service for snapshot report operations
 * @summary Orchestrates snapshot report operations
 * @description Handles orchestration of domain services for snapshot report operations
 */

import { SendSnapshotRequest } from "../../domain/value-objects/SendSnapshotRequest";
import { SendSnapshotResponse } from "../../domain/value-objects/SendSnapshotResponse";
import { SendSnapshotDomainService } from "../../domain/services/SendSnapshotDomainService";
import { AuthorizationService } from "../../domain/services/AuthorizationService";
import { UserRole } from "../../domain/enums/UserRole";

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
   * Sends a snapshot report for a PSO
   * @param callerId - The ID of the user making the request
   * @param request - The snapshot report request
   * @param supervisorName - The name of the supervisor sending the report
   * @param token - Authentication token for chat notifications
   * @returns Promise that resolves to the snapshot report response
   * @throws Error when caller is not authorized or snapshot fails
   * @example
   * const response = await sendSnapshotApplicationService.sendSnapshot(callerId, request, supervisorName, token);
   */
  async sendSnapshot(
    callerId: string,
    request: SendSnapshotRequest,
    supervisorName: string,
    token: string
  ): Promise<SendSnapshotResponse> {
    // Supervisors, Admins, and SuperAdmins can send snapshot reports
    await this.authorizationService.authorizeUserWithRoles(callerId, [UserRole.Supervisor, UserRole.Admin, UserRole.SuperAdmin], "sending snapshots");

    return await this.sendSnapshotDomainService.sendSnapshot(request, supervisorName, token);
  }
}
