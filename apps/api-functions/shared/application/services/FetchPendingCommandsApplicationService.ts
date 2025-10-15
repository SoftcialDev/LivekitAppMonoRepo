/**
 * @fileoverview FetchPendingCommandsApplicationService - Application service for fetching pending commands
 * @summary Orchestrates the flow for fetching pending commands
 * @description Handles the application logic for the FetchPendingCommands endpoint
 */

import { IPendingCommandDomainService } from '../../domain/interfaces/IPendingCommandDomainService';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { FetchPendingCommandsResponse } from '../../domain/value-objects/FetchPendingCommandsResponse';
import { PendingCommandAccessDeniedError } from '../../domain/errors/PendingCommandErrors';

/**
 * Application service for fetching pending commands
 * Orchestrates the flow and handles authorization
 */
export class FetchPendingCommandsApplicationService {
  constructor(
    private readonly pendingCommandDomainService: IPendingCommandDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Fetches pending commands for the authenticated user
   * @param callerId - The Azure AD Object ID of the caller
   * @returns Promise that resolves to the response with pending commands
   * @throws PendingCommandAccessDeniedError when user lacks permissions
   * @throws PendingCommandUserNotFoundError when user is not found or inactive
   * @throws PendingCommandFetchError when fetching commands fails
   */
  async fetchPendingCommands(callerId: string): Promise<FetchPendingCommandsResponse> {
    // Check if user can access employee functions
    const canAccess = await this.authorizationService.canAccessEmployee(callerId);
    
    if (!canAccess) {
      throw new PendingCommandAccessDeniedError("Insufficient privileges to fetch pending commands");
    }

    // Delegate to domain service
    return await this.pendingCommandDomainService.fetchPendingCommands(callerId);
  }
}
