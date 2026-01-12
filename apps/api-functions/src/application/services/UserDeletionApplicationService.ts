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
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';
import { UserDeletionError } from '../../domain/errors/DomainError';
import { UserDeletionErrorCode } from '../../domain/errors/ErrorCodes';
import { ValidationUtils } from '../../domain/utils/ValidationUtils';
import { RoleValidationUtils } from '../../domain/utils';
import { AuditUtils } from '../../domain/utils/AuditUtils';

/**
 * Application service for user deletion operations
 */
export class UserDeletionApplicationService {
  private readonly userRepository: IUserRepository;
  private readonly authorizationService: IAuthorizationService;
  private readonly auditService: IAuditService;
  private readonly presenceService: IPresenceService;
  private readonly webPubSubService: IWebPubSubService;

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
    presenceService: IPresenceService,
    webPubSubService: IWebPubSubService
  ) {
    this.userRepository = userRepository;
    this.authorizationService = authorizationService;
    this.auditService = auditService;
    this.presenceService = presenceService;
    this.webPubSubService = webPubSubService;
  }

  /**
   * Validates a user deletion request and checks hierarchy
   * @param request - The user deletion request
   * @param callerId - Azure AD object ID of the caller
   * @throws UserDeletionError if validation fails
   */
  async validateDeletionRequest(request: UserDeletionRequest, callerId: string): Promise<void> {
    // Validate email format
    ValidationUtils.validateEmailRequired(request.userEmail, 'User email');

    // Validate deletion type
    if (!Object.values(UserDeletionType).includes(request.deletionType)) {
      throw new UserDeletionError('Invalid deletion type', UserDeletionErrorCode.INVALID_DELETION_TYPE);
    }

    // Get caller and target user to validate hierarchy
    const caller = await this.userRepository.findByAzureAdObjectId(callerId);
    if (!caller) {
      throw new UserDeletionError('Caller not found', UserDeletionErrorCode.USER_NOT_FOUND);
    }

    const targetUser = await this.userRepository.findByEmail(request.userEmail);
    if (!targetUser) {
      throw new UserDeletionError('User not found', UserDeletionErrorCode.USER_NOT_FOUND);
    }

    // Validate hierarchy: caller can only delete users with roles below their level
    if (!RoleValidationUtils.canDeleteUser(caller.role, targetUser.role)) {
      throw new UserDeletionError(
        `Insufficient privileges to delete user with role ${targetUser.role}`,
        UserDeletionErrorCode.INSUFFICIENT_PERMISSIONS
      );
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

    // Broadcast supervisor removal if applicable
    if (existingUser.role === UserRole.Supervisor) {
      await this.webPubSubService.broadcastSupervisorListChanged({
        email: existingUser.email,
        fullName: existingUser.fullName,
        azureAdObjectId: existingUser.azureAdObjectId,
        action: 'removed',
      });
    }

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
