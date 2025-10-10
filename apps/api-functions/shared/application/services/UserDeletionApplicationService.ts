/**
 * @fileoverview UserDeletionApplicationService - Application service for user deletion operations
 * @description Handles user deletion authorization, validation, and execution
 */

import { UserRole } from '@prisma/client';
import { UserDeletionRequest } from '../../domain/value-objects/UserDeletionRequest';
import { UserDeletionResult } from '../../domain/value-objects/UserDeletionResult';
import { UserDeletionType } from '../../domain/enums/UserDeletionType';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { IAuditService } from '../../domain/interfaces/IAuditService';
import { IPresenceService } from '../../domain/interfaces/IPresenceService';
import { UserDeletionError } from '../../domain/errors/DomainError';
import { UserDeletionErrorCode } from '../../domain/errors/ErrorCodes';
import { ValidationUtils } from '../../domain/utils/ValidationUtils';
import { AuthorizationUtils } from '../../domain/utils/AuthorizationUtils';
import { AuditUtils } from '../../domain/utils/AuditUtils';
import { config } from '../../config';

/**
 * Application service for user deletion operations
 */
export class UserDeletionApplicationService {
  private userRepository: IUserRepository;
  private authorizationService: IAuthorizationService;
  private auditService: IAuditService;
  private presenceService: IPresenceService;

  /**
   * Creates a new UserDeletionApplicationService instance
   * @param userRepository - User repository for data access
   * @param authorizationService - Authorization service for permission checks
   * @param auditService - Audit service for logging
   * @param presenceService - Presence service for user status management
   */
  constructor(
    userRepository: IUserRepository,
    authorizationService: IAuthorizationService,
    auditService: IAuditService,
    presenceService: IPresenceService
  ) {
    this.userRepository = userRepository;
    this.authorizationService = authorizationService;
    this.auditService = auditService;
    this.presenceService = presenceService;
  }

  /**
   * Authorizes if a user can delete users
   * @param callerId - Azure AD object ID of the caller
   * @throws UserDeletionError if user is not authorized
   */
  async authorizeUserDeletion(callerId: string): Promise<void> {
    await AuthorizationUtils.validateCallerAuthorization(this.authorizationService, callerId, 'delete users');
  }

  /**
   * Validates a user deletion request
   * @param request - The user deletion request
   * @throws UserDeletionError if validation fails
   */
  async validateDeletionRequest(request: UserDeletionRequest): Promise<void> {
    // Validate email format
    ValidationUtils.validateEmailRequired(request.userEmail, 'User email');

    // Validate deletion type
    if (!Object.values(UserDeletionType).includes(request.deletionType)) {
      throw new UserDeletionError('Invalid deletion type', UserDeletionErrorCode.INVALID_DELETION_TYPE);
    }
  }

  /**
   * Changes user role to Unassigned (instead of deletion)
   * @param request - The user deletion request
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to user deletion result
   * @throws UserDeletionError if deletion fails
   */
  async deleteUser(request: UserDeletionRequest, callerId: string): Promise<UserDeletionResult> {
    try {
      // Get existing user from database
      const existingUser = await this.userRepository.findByEmail(request.userEmail);

      if (!existingUser) {
        throw new UserDeletionError('User not found', UserDeletionErrorCode.USER_NOT_FOUND);
      }

      // Check if user is already unassigned (already "deleted")
      if (existingUser.role === UserRole.Unassigned) {
        throw new UserDeletionError('User already unassigned', UserDeletionErrorCode.USER_ALREADY_DELETED);
      }

      // Handle soft delete (database only)
      return await this.handleSoftDelete(request, existingUser, callerId);

    } catch (error) {
      if (error instanceof UserDeletionError) {
        throw error;
      }
      throw new UserDeletionError(
        `Failed to delete user: ${(error as Error).message}`,
        UserDeletionErrorCode.DATABASE_DELETION_FAILED
      );
    }
  }

  /**
   * Handles role change to Unassigned (instead of soft delete)
   * @param request - The user deletion request
   * @param existingUser - Existing user from database
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to user deletion result
   */
  private async handleSoftDelete(
    request: UserDeletionRequest,
    existingUser: any,
    callerId: string
  ): Promise<UserDeletionResult> {
    // Change user role to Unassigned instead of soft delete
    await this.userRepository.changeUserRole(existingUser.id, UserRole.Unassigned);

    // Set user offline
    await this.presenceService.setUserOffline(request.userEmail);

    // Log audit using centralized utility
    await AuditUtils.logUserDeletion(
      this.auditService,
      this.userRepository,
      callerId,
      existingUser
    );

    return UserDeletionResult.success(
      request.userEmail,
      request.deletionType,
      existingUser.role,
      existingUser.azureAdObjectId,
      existingUser.fullName,
      `User ${request.userEmail} role changed to Unassigned successfully`
    );
  }


}
