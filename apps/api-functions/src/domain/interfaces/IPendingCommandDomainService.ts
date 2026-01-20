/**
 * @fileoverview IPendingCommandDomainService - Interface for pending command domain service
 * @summary Defines the contract for pending command domain operations
 * @description Provides the interface for pending command business logic operations
 */

import { FetchPendingCommandsResponse } from '../value-objects/FetchPendingCommandsResponse';

/**
 * Interface for pending command domain service operations
 * Defines the contract for business logic related to pending commands
 */
export interface IPendingCommandDomainService {
  /**
   * Creates a new pending command for an employee
   * @param psoId - The ID of the PSO
   * @param command - The command type
   * @param timestamp - When the command was issued
   * @param reason - Optional reason for the command
   * @param initiatedById - Optional ID of the user who initiated the command
   * @returns Promise that resolves to the created pending command
   * @throws Error if the operation fails
   */
  createPendingCommand(psoId: string, command: string, timestamp: string | Date, reason?: string, initiatedById?: string): Promise<{ id: string; employeeId: string; command: string; timestamp: Date; reason?: string }>;

  /**
   * Fetches pending commands for the authenticated user
   * @param callerId - The Azure AD Object ID of the caller
   * @returns Promise that resolves to the response with pending commands
   * @throws PendingCommandUserNotFoundError when user is not found or inactive
   * @throws PendingCommandFetchError when fetching commands fails
   */
  fetchPendingCommands(callerId: string): Promise<FetchPendingCommandsResponse>;
}
