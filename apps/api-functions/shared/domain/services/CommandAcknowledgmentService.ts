/**
 * @fileoverview CommandAcknowledgmentService - Domain service for command acknowledgment
 * @description Handles business logic for acknowledging pending commands
 */

import { ICommandAcknowledgmentService } from '../interfaces/ICommandAcknowledgmentService';
import { IPendingCommandRepository } from '../interfaces/IPendingCommandRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import { AcknowledgeCommandRequest } from '../value-objects/AcknowledgeCommandRequest';
import { AcknowledgeCommandResult } from '../value-objects/AcknowledgeCommandResult';
import { UserRole } from '@prisma/client';

/**
 * Domain service for command acknowledgment operations
 */
export class CommandAcknowledgmentService implements ICommandAcknowledgmentService {
  constructor(
    private pendingCommandRepository: IPendingCommandRepository,
    private userRepository: IUserRepository
  ) {}

  /**
   * Acknowledges multiple pending commands for an employee
   * @param request - Command acknowledgment request
   * @param callerId - ID of the user making the request
   * @returns Promise that resolves to acknowledgment result
   * @throws Error if validation or business rules fail
   */
  async acknowledgeCommands(
    request: AcknowledgeCommandRequest,
    callerId: string
  ): Promise<AcknowledgeCommandResult> {
    // 1. Validate caller is an Employee
    await this.validateEmployeeRole(callerId);

    // 2. Validate that all command IDs exist
    await this.validateCommandIds(request.commandIds);

    // 3. Mark commands as acknowledged
    const updatedCount = await this.pendingCommandRepository.markAsAcknowledged(request.commandIds);

    return AcknowledgeCommandResult.fromDatabaseResult(updatedCount);
  }

  /**
   * Validates that the caller is an Employee
   * @param callerId - ID of the user making the request
   * @throws Error if user is not found, deleted, or not an Employee
   */
  private async validateEmployeeRole(callerId: string): Promise<void> {
    const user = await this.userRepository.findByAzureAdObjectId(callerId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.deletedAt) {
      throw new Error('User is deleted');
    }

    if (user.role !== UserRole.Employee) {
      throw new Error('Only employees may acknowledge commands');
    }
  }

  /**
   * Validates that all command IDs exist in the database
   * @param commandIds - Array of command IDs to validate
   * @throws Error if any command ID is not found
   */
  private async validateCommandIds(commandIds: string[]): Promise<void> {
    const existingIds = await this.pendingCommandRepository.findByIds(commandIds);
    
    if (existingIds.length !== commandIds.length) {
      const missingIds = commandIds.filter(id => !existingIds.includes(id));
      throw new Error(`Command IDs not found: ${missingIds.join(', ')}`);
    }
  }
}
