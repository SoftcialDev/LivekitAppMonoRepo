/**
 * @fileoverview AuthorizationService - Domain service for authorization logic
 * @description Handles authorization logic that can be reused across handlers
 */

import { UserRole } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IAuthorizationService } from '../interfaces/IAuthorizationService';
import { AuthError } from '../errors/DomainError';
import { AuthErrorCode } from '../errors/ErrorCodes';

/**
 * Domain service for authorization operations
 */
export class AuthorizationService implements IAuthorizationService {
  private userRepository: IUserRepository;

  /**
   * Creates a new AuthorizationService instance
   * @param userRepository - User repository for data access
   */
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Authorizes if a user can send commands
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to true if authorized
   */
  async canSendCommands(callerId: string): Promise<boolean> {
    const authorizedRoles = [UserRole.Admin, UserRole.Supervisor, UserRole.SuperAdmin];
    return await this.userRepository.hasAnyRole(callerId, authorizedRoles);
  }

  /**
   * Authorizes if a user can manage users
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to true if authorized
   */
  async canManageUsers(callerId: string): Promise<boolean> {
    const authorizedRoles = [UserRole.Admin, UserRole.SuperAdmin, UserRole.Supervisor];
    return await this.userRepository.hasAnyRole(callerId, authorizedRoles);
  }

  /**
   * Authorizes if a user can access admin functions
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to true if authorized
   */
  async canAccessAdmin(callerId: string): Promise<boolean> {
    return await this.userRepository.hasRole(callerId, UserRole.SuperAdmin);
  }

  /**
   * Authorizes if a user can access Super Admin functions
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves when authorized
   * @throws AuthError if not authorized
   */
  async canAccessSuperAdmin(callerId: string): Promise<void> {
    const allowedRoles: UserRole[] = [UserRole.SuperAdmin];
    await this.validateUserWithRoles(callerId, allowedRoles, 'creating Super Admin');
  }

  /**
   * Authorizes if a user can access Employee functions
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to true if authorized
   */
  async canAccessEmployee(callerId: string): Promise<boolean> {
    const allowedRoles: UserRole[] = [UserRole.Employee];
    return await this.userRepository.hasAnyRole(callerId, allowedRoles);
  }

  /**
   * Authorizes if a user can access Contact Manager functions
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves when authorized
   * @throws AuthError if not authorized
   */
  async canAccessContactManager(callerId: string): Promise<void> {
    const allowedRoles: UserRole[] = [UserRole.Employee, UserRole.ContactManager];
    await this.validateUserWithRoles(callerId, allowedRoles, 'accessing Contact Manager functions');
  }

  /**
   * Authorizes if a user can access streaming status functions
   * Allows SuperAdmin, Supervisor, and ContactManager roles
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves when authorized
   * @throws AuthError if not authorized
   */
  async canAccessStreamingStatus(callerId: string): Promise<void> {
    const allowedRoles: UserRole[] = [UserRole.SuperAdmin, UserRole.Supervisor, UserRole.ContactManager];
    await this.validateUserWithRoles(callerId, allowedRoles, 'accessing streaming status functions');
  }

  /**
   * Validates if a user exists and is active
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to true if user exists and is active
   */
  async isUserActive(callerId: string): Promise<boolean> {
    return await this.userRepository.existsAndActive(callerId);
  }

  /**
   * Validates that a user exists and is active (not deleted)
   * @param callerId - Azure AD object ID of the caller
   * @throws AuthError if user is not found or deleted
   */
  private async validateUserActive(callerId: string): Promise<void> {
    const user = await this.userRepository.findByAzureAdObjectId(callerId);
    
    if (!user) {
      throw new AuthError('User not found', AuthErrorCode.USER_NOT_FOUND);
    }

    if (user.deletedAt) {
      throw new AuthError('User is deleted', AuthErrorCode.USER_NOT_FOUND);
    }
  }

  /**
   * Validates that a user exists, is active, and has one of the allowed roles
   * @param callerId - Azure AD object ID of the caller
   * @param allowedRoles - Array of allowed roles
   * @param operationName - Name of the operation for error messages
   * @throws AuthError if validation fails
   */
  private async validateUserWithRoles(
    callerId: string, 
    allowedRoles: UserRole[], 
    operationName: string
  ): Promise<void> {
    // First validate user is active
    await this.validateUserActive(callerId);
    
    // Then validate role
    const user = await this.userRepository.findByAzureAdObjectId(callerId);
    if (!user || !allowedRoles.includes(user.role)) {
      throw new AuthError(`Insufficient permissions for ${operationName}`, AuthErrorCode.INSUFFICIENT_PRIVILEGES);
    }
  }

  /**
   * Public method to authorize user with specific roles
   * @param callerId - Azure AD object ID of the caller
   * @param allowedRoles - Array of allowed roles
   * @param operationName - Name of the operation for error messages
   * @throws AuthError if validation fails
   */
  async authorizeUserWithRoles(
    callerId: string, 
    allowedRoles: UserRole[], 
    operationName: string
  ): Promise<void> {
    await this.validateUserWithRoles(callerId, allowedRoles, operationName);
  }

  /**
   * Authorizes if a user can query users
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves when authorized
   * @throws AuthError if not authorized
   */
  async authorizeUserQuery(callerId: string): Promise<void> {
    const allowedRoles: UserRole[] = [UserRole.Admin, UserRole.Supervisor, UserRole.SuperAdmin];
    await this.validateUserWithRoles(callerId, allowedRoles, 'querying users');
  }

  /**
   * Authorizes if a user can acknowledge commands
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves if authorized, throws if not
   * @throws Error if user is not authorized
   */
  async authorizeCommandAcknowledgment(callerId: string): Promise<void> {
    const allowedRoles: UserRole[] = [UserRole.Employee];
    await this.validateUserWithRoles(callerId, allowedRoles, 'acknowledging commands');
  }
}
