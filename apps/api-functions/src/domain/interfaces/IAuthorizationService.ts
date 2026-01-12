/**
 * @fileoverview IAuthorizationService - Domain interface for authorization service
 * @description Defines the contract for authorization operations
 */

import { Permission } from '../enums/Permission';

/**
 * Interface for authorization service operations
 */
export interface IAuthorizationService {
  /**
   * Checks whether the caller has the given permission.
   * @param callerId Azure AD object ID of the caller.
   * @param permission Permission to check.
   */
  hasPermission(callerId: string, permission: Permission): Promise<boolean>;

  /**
   * Checks whether the caller has any of the given permissions.
   * @param callerId Azure AD object ID of the caller.
   * @param permissions Permissions to check.
   */
  hasAnyPermission(callerId: string, permissions: Permission[]): Promise<boolean>;

  /**
   * Checks whether the caller has all of the given permissions.
   * @param callerId Azure AD object ID of the caller.
   * @param permissions Permissions to check.
   */
  hasAllPermissions(callerId: string, permissions: Permission[]): Promise<boolean>;

  /**
   * Ensures the caller has the given permission or throws.
   * @param callerId Azure AD object ID of the caller.
   * @param permission Permission to enforce.
   */
  authorizePermission(callerId: string, permission: Permission, operationName?: string): Promise<void>;

  /**
   * Ensures the caller has at least one of the given permissions or throws.
   * @param callerId Azure AD object ID of the caller.
   * @param permissions Permissions to enforce.
   */
  authorizeAnyPermission(callerId: string, permissions: Permission[], operationName?: string): Promise<void>;

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

  /**
   * Authorizes if a user can access Admin or SuperAdmin functions
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves when authorized
   * @throws Error if not authorized
   */
  authorizeAdminOrSuperAdmin(callerId: string): Promise<void>;
}
