/**
 * @fileoverview UserRoleChangeApplicationService - Application service for user role change operations
 * @description Handles user role change authorization, validation, and execution
 */

import { UserRole } from '@prisma/client';
import { UserRoleChangeRequest } from '../../domain/value-objects/UserRoleChangeRequest';
import { UserRoleChangeResult } from '../../domain/value-objects/UserRoleChangeResult';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { IAuditService } from '../../domain/interfaces/IAuditService';
import { IPresenceService } from '../../domain/interfaces/IPresenceService';
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';
import { UserRoleChangeError } from '../../domain/errors';
import { UserRoleChangeErrorCode } from '../../domain/errors';
import { ValidationUtils } from '../../domain/utils';
import { RoleValidationUtils } from '../../domain/utils';
import { AuditUtils } from '../../domain/utils';


/**
 * Application service for user role change operations
 */
export class UserRoleChangeApplicationService {
  private userRepository: IUserRepository;
  private authorizationService: IAuthorizationService;
  private auditService: IAuditService;
  private presenceService: IPresenceService;
  private webPubSubService: IWebPubSubService;

  /**
   * Creates a new UserRoleChangeApplicationService instance
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
   * Validates the user role change request
   * @param request - The user role change request
   * @param callerId - Azure AD object ID of the caller
   * @throws UserRoleChangeError if request is invalid
   */
  async validateRoleChangeRequest(request: UserRoleChangeRequest, callerId: string): Promise<void> {
    // Validate email format
    ValidationUtils.validateEmailFormat(request.userEmail, 'User email');

    // If not a deletion request, validate role
    if (request.newRole !== null) {
      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(request.newRole)) {
        throw new UserRoleChangeError('Invalid role assignment', UserRoleChangeErrorCode.INVALID_ROLE_ASSIGNMENT);
      }

      // Validate role hierarchy: get caller's role and check if they can assign the target role
      const caller = await this.userRepository.findByAzureAdObjectId(callerId);
      if (!caller) {
        throw new UserRoleChangeError('Caller not found', UserRoleChangeErrorCode.INVALID_ROLE_ASSIGNMENT);
      }

      // Supervisors can only assign PSO role
      if (caller.role === UserRole.Supervisor && request.newRole !== UserRole.PSO) {
        throw new UserRoleChangeError('Supervisors may only assign PSO role', UserRoleChangeErrorCode.INVALID_ROLE_ASSIGNMENT);
      }

      // Admins can assign roles at or below their level (Supervisor, PSO, ContactManager, Unassigned)
      // But not SuperAdmin
      if (caller.role === UserRole.Admin) {
        if (!RoleValidationUtils.canAssignRole(caller.role, request.newRole)) {
          throw new UserRoleChangeError('Insufficient privileges to assign this role', UserRoleChangeErrorCode.INVALID_ROLE_ASSIGNMENT);
        }
      }
    }
  }

  /**
   * Changes a user's role
   * @param request - The user role change request
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to user role change result
   * @throws UserRoleChangeError if role change fails
   */
  async changeUserRole(request: UserRoleChangeRequest, callerId: string): Promise<UserRoleChangeResult> {
    try {
      // Get existing user from database
      const existingUser = await this.userRepository.findByEmail(request.userEmail);

      // Validate that newRole is not null
      if (!request.newRole) {
        throw new UserRoleChangeError(
          'User deletion is now handled by the DeleteUser endpoint. Use /api/DeleteUser instead.',
          UserRoleChangeErrorCode.INVALID_ROLE_ASSIGNMENT
        );
      }

      // Handle role assignment (database only)
      return await this.handleRoleAssignment(request, existingUser, callerId);

    } catch (error) {
      if (error instanceof UserRoleChangeError) {
        throw error;
      }
      throw new UserRoleChangeError(
        `Failed to change user role: ${(error as Error).message}`,
        UserRoleChangeErrorCode.ROLE_ASSIGNMENT_FAILED
      );
    }
  }


  /**
   * Handles role assignment (database only)
   * @param request - The user role change request
   * @param existingUser - Existing user from database
   * @param callerId - Azure AD object ID of the caller
   * @returns Promise that resolves to user role change result
   */
  private async handleRoleAssignment(
    request: UserRoleChangeRequest,
    existingUser: any,
    callerId: string
  ): Promise<UserRoleChangeResult> {
    // Update user role in database only
    const userCreated = !existingUser;
    const previousRole = existingUser?.role || null;
    
    const updatedUser = await this.userRepository.upsertUser({
      email: request.userEmail,
      azureAdObjectId: existingUser?.azureAdObjectId || '', // Use existing or empty
      fullName: existingUser?.fullName || request.userEmail, // Use existing or email
      role: request.newRole,
    });

    // Log audit using centralized utility
    await AuditUtils.logRoleChange(
      this.auditService,
      this.userRepository,
      callerId,
      existingUser,
      updatedUser
    );

    // Set user offline if assigned PSO role
    if (request.newRole === UserRole.PSO) {
      await this.presenceService.setUserOffline(request.userEmail);
    }

    // Broadcast supervisor list changes when a user is promoted/demoted from Supervisor
    if (previousRole !== UserRole.Supervisor && request.newRole === UserRole.Supervisor) {
      await this.webPubSubService.broadcastSupervisorListChanged({
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        azureAdObjectId: updatedUser.azureAdObjectId,
        action: 'added',
      });
    } else if (previousRole === UserRole.Supervisor && request.newRole !== UserRole.Supervisor) {
      await this.webPubSubService.broadcastSupervisorListChanged({
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        azureAdObjectId: updatedUser.azureAdObjectId,
        action: 'removed',
      });
    }

    return UserRoleChangeResult.roleChanged(
      request.userEmail,
      previousRole,
      request.newRole,
      updatedUser.azureAdObjectId,
      updatedUser.fullName,
      userCreated
    );
  }

}
