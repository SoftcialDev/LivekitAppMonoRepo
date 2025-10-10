/**
 * @fileoverview AuthorizationUtils - Common authorization utilities
 * @description Provides reusable authorization functions for domain logic
 */

import { IUserRepository } from '../interfaces/IUserRepository';
import { IAuthorizationService } from '../interfaces/IAuthorizationService';
import { AuthError } from '../errors/DomainError';
import { AuthErrorCode } from '../errors/ErrorCodes';
import { RoleValidationUtils } from './RoleValidationUtils';
import { UserRole } from '@prisma/client';

/**
 * Common authorization utilities for domain operations
 */
export class AuthorizationUtils {
  /**
   * Validates if a caller is authorized to perform an operation
   * @param authorizationService - Authorization service for permission checks
   * @param callerId - Azure AD object ID of the caller
   * @param operation - Name of the operation for error messages
   * @throws AuthError if caller is not authorized
   */
  static async validateCallerAuthorization(
    authorizationService: IAuthorizationService,
    callerId: string,
    operation: string = 'operation'
  ): Promise<void> {
    if (!callerId) {
      throw new AuthError('Caller ID not found', AuthErrorCode.CALLER_ID_NOT_FOUND);
    }

    const isActive = await authorizationService.isUserActive(callerId);
    if (!isActive) {
      throw new AuthError('User not found or inactive', AuthErrorCode.USER_NOT_FOUND);
    }
  }

  /**
   * Validates if a caller can send commands
   * @param authorizationService - Authorization service for permission checks
   * @param callerId - Azure AD object ID of the caller
   * @throws AuthError if caller cannot send commands
   */
  static async validateCanSendCommands(
    authorizationService: IAuthorizationService,
    callerId: string
  ): Promise<void> {
    await this.validateCallerAuthorization(authorizationService, callerId, 'send commands');
    
    const canSend = await authorizationService.canSendCommands(callerId);
    if (!canSend) {
      throw new AuthError('Insufficient privileges to send commands', AuthErrorCode.INSUFFICIENT_PRIVILEGES);
    }
  }

  /**
   * Validates if a caller can manage users
   * @param authorizationService - Authorization service for permission checks
   * @param callerId - Azure AD object ID of the caller
   * @throws AuthError if caller cannot manage users
   */
  static async validateCanManageUsers(
    authorizationService: IAuthorizationService,
    callerId: string
  ): Promise<void> {
    await this.validateCallerAuthorization(authorizationService, callerId, 'manage users');
    
    const canManage = await authorizationService.canManageUsers(callerId);
    if (!canManage) {
      throw new AuthError('Insufficient privileges to manage users', AuthErrorCode.INSUFFICIENT_PRIVILEGES);
    }
  }

  /**
   * Validates if a caller can access admin functions
   * @param authorizationService - Authorization service for permission checks
   * @param callerId - Azure AD object ID of the caller
   * @throws AuthError if caller cannot access admin functions
   */
  static async validateCanAccessAdmin(
    authorizationService: IAuthorizationService,
    callerId: string
  ): Promise<void> {
    await this.validateCallerAuthorization(authorizationService, callerId, 'access admin functions');
    
    const canAccess = await authorizationService.canAccessAdmin(callerId);
    if (!canAccess) {
      throw new AuthError('Insufficient privileges to access admin functions', AuthErrorCode.INSUFFICIENT_PRIVILEGES);
    }
  }

  /**
   * Validates if a caller can change user roles
   * @param authorizationService - Authorization service for permission checks
   * @param callerId - Azure AD object ID of the caller
   * @param newRole - The new role being assigned
   * @param userRepository - User repository for data access
   * @throws AuthError if caller cannot change roles
   */
  static async validateCanChangeRoles(
    authorizationService: IAuthorizationService,
    callerId: string,
    newRole: UserRole | null,
    userRepository: IUserRepository
  ): Promise<void> {
    await this.validateCallerAuthorization(authorizationService, callerId, 'change user roles');
    
    // Get caller details for role-specific validation
    const caller = await userRepository.findByAzureAdObjectId(callerId);
    
    if (!caller) {
      throw new AuthError('Caller not found', AuthErrorCode.USER_NOT_FOUND);
    }

    // Use RoleValidationUtils for consistent validation
    if (!RoleValidationUtils.isValidRoleAssignment(caller.role, newRole)) {
      if (caller.role === UserRole.Supervisor && newRole !== UserRole.Employee && newRole !== null) {
        throw new AuthError('Supervisors may only assign Employee role', AuthErrorCode.INSUFFICIENT_PRIVILEGES);
      }
      if (newRole === null && !RoleValidationUtils.canManageUsers(caller.role)) {
        throw new AuthError('Only Admins can delete users', AuthErrorCode.INSUFFICIENT_PRIVILEGES);
      }
    }
  }
}
