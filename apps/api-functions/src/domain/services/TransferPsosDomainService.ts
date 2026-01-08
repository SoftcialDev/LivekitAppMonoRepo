/**
 * @fileoverview TransferPsosDomainService - Domain service for PSO transfer operations
 * @summary Handles PSO transfer business logic
 * @description Contains the core business logic for transferring PSOs between supervisors
 */

import { TransferPsosRequest } from "../value-objects/TransferPsosRequest";
import { TransferPsosResponse } from "../value-objects/TransferPsosResponse";
import { IUserRepository } from "../interfaces/IUserRepository";
import { ICommandMessagingService } from "../interfaces/ICommandMessagingService";
import { IWebPubSubService } from "../interfaces/IWebPubSubService";
import { UserNotFoundError } from "../errors/UserErrors";
import { UserRole } from "../enums/UserRole";
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { ValidationError } from "../errors/DomainError";
import { ValidationErrorCode } from "../errors/ErrorCodes";

/**
 * Domain service for PSO transfer business logic
 * @description Handles the core business rules for transferring PSOs between supervisors
 */
export class TransferPsosDomainService {
  /**
   * Creates a new TransferPsosDomainService instance
   * @param userRepository - Repository for user data access
   * @param commandMessagingService - Service for sending notifications
   * @param webPubSubService - WebPubSub service for broadcasting notifications
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly commandMessagingService: ICommandMessagingService,
    private readonly webPubSubService: IWebPubSubService
  ) {}

  /**
   * Transfers PSOs from the caller to a new supervisor
   * @param request - The PSO transfer request
   * @returns Promise that resolves to the transfer response
   * @throws UserNotFoundError when caller or target supervisor not found
   * @example
   * const response = await transferPsosDomainService.transferPsos(request);
   */
  async transferPsos(request: TransferPsosRequest): Promise<TransferPsosResponse> {
    // 1. Find caller user
    const caller = await this.userRepository.findByAzureAdObjectId(request.callerId);
    if (!caller || caller.deletedAt) {
      throw new UserNotFoundError(`Caller with ID ${request.callerId} not found or deleted`);
    }

    // 2. Validate caller is a Supervisor
    if (caller.role !== UserRole.Supervisor) {
      throw new ValidationError("Only Supervisors may transfer PSOs", ValidationErrorCode.TARGET_NOT_EMPLOYEE);
    }

    // 3. Find target supervisor
    const targetSupervisor = await this.userRepository.findByEmail(request.newSupervisorEmail);
    if (!targetSupervisor || targetSupervisor.deletedAt || targetSupervisor.role !== UserRole.Supervisor) {
      throw new UserNotFoundError("Target supervisor not found or not a Supervisor");
    }

    // 4. Get current PSOs assigned to caller
    const currentPsos = await this.userRepository.findBySupervisor(caller.id);
    const employeePsos = currentPsos.filter(pso => pso.role === UserRole.PSO);

    if (employeePsos.length === 0) {
      return new TransferPsosResponse(0, "No PSOs to transfer");
    }

    // 5. Transfer PSOs to new supervisor
    const updates = employeePsos.map(pso => ({
      email: pso.email,
      supervisorId: targetSupervisor.id
    }));

    await this.userRepository.updateMultipleSupervisors(updates);

    // 6. Notify transferred PSOs
    await this.notifyTransferredPsos(employeePsos, caller, targetSupervisor);

    return new TransferPsosResponse(
      employeePsos.length,
      `Successfully transferred ${employeePsos.length} PSO(s) to ${targetSupervisor.fullName}`
    );
  }

  /**
   * Notifies transferred PSOs about the supervisor change
   * @param transferredPsos - Array of PSOs that were transferred
   * @param oldSupervisor - The old supervisor (caller)
   * @param newSupervisor - The new supervisor
   * @private
   */
  private async notifyTransferredPsos(
    transferredPsos: Array<{ email: string; fullName: string }>,
    oldSupervisor: { email: string; fullName: string },
    newSupervisor: { email: string; fullName: string }
  ): Promise<void> {
    const timestamp = getCentralAmericaTime().toISOString();

    // Notify individual PSOs via command messaging (existing functionality)
    for (const pso of transferredPsos) {
      try {
        await this.commandMessagingService.sendToGroup(`commands:${pso.email}`, {
          type: 'SUPERVISOR_CHANGED',
          newSupervisorName: newSupervisor.fullName,
          timestamp: timestamp
        });
      } catch {
        // Failed to notify PSO - continue with next
      }
    }

    // Broadcast to all users in presence group for UI refresh
    await this.broadcastSupervisorChangeNotification(transferredPsos, oldSupervisor, newSupervisor);
  }

  /**
   * Broadcasts supervisor change notification to all users in presence group
   * @param transferredPsos - Array of PSOs that were transferred
   * @param oldSupervisor - The old supervisor (caller)
   * @param newSupervisor - The new supervisor
   * @returns Promise that resolves when broadcast is complete
   * @private
   */
  private async broadcastSupervisorChangeNotification(
    transferredPsos: Array<{ email: string; fullName: string }>,
    oldSupervisor: { email: string; fullName: string },
    newSupervisor: { email: string; fullName: string }
  ): Promise<void> {
    try {
      // Get the new supervisor's Azure AD Object ID
      const newSupervisorUser = await this.userRepository.findByEmail(newSupervisor.email);
      const newSupervisorId = newSupervisorUser?.azureAdObjectId;

      await this.webPubSubService.broadcastSupervisorChangeNotification({
        psoEmails: transferredPsos.map(pso => pso.email),
        oldSupervisorEmail: oldSupervisor.email,
        newSupervisorEmail: newSupervisor.email,
        newSupervisorId: newSupervisorId,
        psoNames: transferredPsos.map(pso => pso.fullName),
        newSupervisorName: newSupervisor.fullName
      });
    } catch {
      // Failed to broadcast - don't fail the transfer
    }
  }
}
