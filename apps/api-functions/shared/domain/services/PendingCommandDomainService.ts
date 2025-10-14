/**
 * @fileoverview PendingCommandDomainService - Domain service for pending command operations
 * @summary Handles business logic for pending command management
 * @description Provides domain logic for fetching, validating, and managing pending commands
 */

import { IPendingCommandRepository } from '../interfaces/IPendingCommandRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IPendingCommandDomainService } from '../interfaces/IPendingCommandDomainService';
import { FetchPendingCommandsResponse } from '../value-objects/FetchPendingCommandsResponse';
import { PendingCommand } from '../entities/PendingCommand';
import { 
  PendingCommandUserNotFoundError, 
  PendingCommandFetchError 
} from '../errors/PendingCommandErrors';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Domain service for pending command operations
 * Handles the business logic for fetching and managing pending commands
 */
export class PendingCommandDomainService implements IPendingCommandDomainService {
  constructor(
    private readonly pendingCommandRepository: IPendingCommandRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Fetches pending commands for the authenticated user
   * @param callerId - The Azure AD Object ID of the caller
   * @returns Promise that resolves to the response with pending commands
   * @throws PendingCommandUserNotFoundError when user is not found or inactive
   * @throws PendingCommandFetchError when fetching commands fails
   */
  async fetchPendingCommands(callerId: string): Promise<FetchPendingCommandsResponse> {
    try {
      // Find the user by Azure AD Object ID
      const user = await this.userRepository.findByAzureAdObjectId(callerId);
      
      if (!user) {
        throw new PendingCommandUserNotFoundError("User not found");
      }

      if (!user.isActive()) {
        throw new PendingCommandUserNotFoundError("User is not active");
      }

      // Fetch all un-acknowledged commands for the user
      const pendingCommandsData = await this.pendingCommandRepository.getPendingCommandsForEmployee(user.id);
      
      if (pendingCommandsData.length === 0) {
        return FetchPendingCommandsResponse.withNoPending();
      }

      // Convert to PendingCommand entities
      const pendingCommands = pendingCommandsData.map(cmd => new PendingCommand({
        id: cmd.id,
        employeeId: cmd.employeeId,
        command: cmd.command as any, // CommandType
        timestamp: cmd.timestamp,
        acknowledged: cmd.acknowledged,
        createdAt: getCentralAmericaTime(), 
        updatedAt: getCentralAmericaTime()
      }));

      // Select the most recent command
      const latestCommand = this.getLatestCommand(pendingCommands);

      // Check if the command has expired using entity business logic
      if (latestCommand.isExpired()) {
        return FetchPendingCommandsResponse.withNoPending();
      }

      return FetchPendingCommandsResponse.withPending(latestCommand);
    } catch (error) {
      if (error instanceof PendingCommandUserNotFoundError) {
        throw error;
      }
      throw new PendingCommandFetchError(`Failed to fetch pending commands: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets the latest command from a list of pending commands
   * @param commands - Array of pending commands
   * @returns The most recent command
   */
  private getLatestCommand(commands: PendingCommand[]): PendingCommand {
    return commands.reduce((prev, curr) =>
      curr.timestamp > prev.timestamp ? curr : prev
    );
  }
}
