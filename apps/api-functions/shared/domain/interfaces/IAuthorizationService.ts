/**
 * @fileoverview IAuthorizationService - Domain interface for authorization service
 * @description Defines the contract for authorization operations
 */

import { UserRole } from '@prisma/client';

/**
 * Interface for authorization service operations
 */
export interface IAuthorizationService {
  /**
   * Authorizes if a user can send commands
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to true if authorized
   */
  canSendCommands(callerId: string): Promise<boolean>;

  /**
   * Authorizes if a user can query users
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to true if authorized
   */
  authorizeUserQuery(callerId: string): Promise<void>;

  /**
   * Authorizes if a user can manage users
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to true if authorized
   */
  canManageUsers(callerId: string): Promise<boolean>;

  /**
   * Authorizes if a user can access admin functions
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to true if authorized
   */
  canAccessAdmin(callerId: string): Promise<boolean>;

  /**
   * Validates if a user exists and is active
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to true if user exists and is active
   */
  isUserActive(callerId: string): Promise<boolean>;

  /**
   * Authorizes if a user can acknowledge commands
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves if authorized, throws if not
   * @throws Error if user is not authorized
   */
  authorizeCommandAcknowledgment(callerId: string): Promise<void>;

  /**
   * Authorizes if a user can access streaming status functions
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves when authorized
   * @throws Error if not authorized
   */
  canAccessStreamingStatus(callerId: string): Promise<void>;
}
