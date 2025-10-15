/**
 * @fileoverview TransferPsosDomainService - Domain service for PSO transfer operations
 * @summary Handles PSO transfer business logic
 * @description Contains the core business logic for transferring PSOs between supervisors
 */

import { TransferPsosRequest } from "../value-objects/TransferPsosRequest";
import { TransferPsosResponse } from "../value-objects/TransferPsosResponse";
import { IUserRepository } from "../interfaces/IUserRepository";
import { ICommandMessagingService } from "../interfaces/ICommandMessagingService";
import { UserNotFoundError } from "../errors/UserErrors";
import { UserRole } from "../enums/UserRole";
import { getCentralAmericaTime } from "../../utils/dateUtils";

/**
 * Domain service for PSO transfer business logic
 * @description Handles the core business rules for transferring PSOs between supervisors
 */
export class TransferPsosDomainService {
  /**
   * Creates a new TransferPsosDomainService instance
   * @param userRepository - Repository for user data access
   * @param commandMessagingService - Service for sending notifications
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly commandMessagingService: ICommandMessagingService
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
      throw new Error("Only Supervisors may transfer PSOs");
    }

    // 3. Find target supervisor
    const targetSupervisor = await this.userRepository.findByEmail(request.newSupervisorEmail);
    if (!targetSupervisor || targetSupervisor.deletedAt || targetSupervisor.role !== UserRole.Supervisor) {
      throw new UserNotFoundError("Target supervisor not found or not a Supervisor");
    }

    // 4. Get current PSOs assigned to caller
    const currentPsos = await this.userRepository.findBySupervisor(caller.id);
    const employeePsos = currentPsos.filter(pso => pso.role === UserRole.Employee);

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
    await this.notifyTransferredPsos(employeePsos, targetSupervisor);

    return new TransferPsosResponse(
      employeePsos.length,
      `Successfully transferred ${employeePsos.length} PSO(s) to ${targetSupervisor.fullName}`
    );
  }

  /**
   * Notifies transferred PSOs about the supervisor change
   * @param transferredPsos - Array of PSOs that were transferred
   * @param newSupervisor - The new supervisor
   * @private
   */
  private async notifyTransferredPsos(
    transferredPsos: Array<{ email: string; fullName: string }>,
    newSupervisor: { fullName: string }
  ): Promise<void> {
    const timestamp = getCentralAmericaTime().toISOString();

    for (const pso of transferredPsos) {
      try {
        await this.commandMessagingService.sendToGroup(`commands:${pso.email}`, {
          type: 'SUPERVISOR_CHANGED',
          newSupervisorName: newSupervisor.fullName,
          timestamp: timestamp
        });
      } catch (error) {
        // Log error but don't fail the transfer
        console.warn(`Failed to notify PSO ${pso.email}:`, error);
      }
    }
  }
}
