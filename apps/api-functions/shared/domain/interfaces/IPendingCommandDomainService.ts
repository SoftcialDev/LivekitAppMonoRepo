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
   * Fetches pending commands for the authenticated user
   * @param callerId - The Azure AD Object ID of the caller
   * @returns Promise that resolves to the response with pending commands
   * @throws PendingCommandUserNotFoundError when user is not found or inactive
   * @throws PendingCommandFetchError when fetching commands fails
   */
  fetchPendingCommands(callerId: string): Promise<FetchPendingCommandsResponse>;
}
