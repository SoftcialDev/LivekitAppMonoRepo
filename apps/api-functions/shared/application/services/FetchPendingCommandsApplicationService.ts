/**
 * @fileoverview FetchPendingCommandsApplicationService - Application service for fetching pending commands
 * @summary Orchestrates the flow for fetching pending commands
 * @description Handles the application logic for the FetchPendingCommands endpoint
 */

import { IPendingCommandDomainService } from '../../domain/interfaces/IPendingCommandDomainService';
import { FetchPendingCommandsResponse } from '../../domain/value-objects/FetchPendingCommandsResponse';

/**
 * Application service for fetching pending commands
 * Orchestrates the flow and handles authorization
 */
export class FetchPendingCommandsApplicationService {
  constructor(
    private readonly pendingCommandDomainService: IPendingCommandDomainService
  ) {}

  /**
   * Fetches pending commands for the authenticated user
   * @param callerId - The Azure AD Object ID of the caller
   * @returns Promise that resolves to the response with pending commands
   * @throws PendingCommandUserNotFoundError when user is not found or inactive
   * @throws PendingCommandFetchError when fetching commands fails
   */
  async fetchPendingCommands(callerId: string): Promise<FetchPendingCommandsResponse> {
    // Permission check is done at middleware level
    return await this.pendingCommandDomainService.fetchPendingCommands(callerId);
  }
}
