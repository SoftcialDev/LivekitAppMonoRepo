/**
 * @fileoverview GetCurrentUserDomainService - Domain service for current user operations
 * @description Handles business logic for getting current user with auto-provisioning
 */

import { UserRole } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { GetCurrentUserRequest } from '../value-objects/GetCurrentUserRequest';
import { GetCurrentUserResponse } from '../value-objects/GetCurrentUserResponse';
import { ApplicationError, ValidationError } from '../errors/DomainError';
import { ApplicationErrorCode, ValidationErrorCode } from '../errors/ErrorCodes';
import { UserConstants } from '../constants/UserConstants';
import { JwtPayload } from 'jsonwebtoken';

/**
 * Domain service for current user operations
 */
export class GetCurrentUserDomainService {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Gets current user information, creating the user if they don't exist
   * @param request - Get current user request
   * @param jwtPayload - JWT token payload with user information
   * @returns Promise that resolves to GetCurrentUserResponse
   * @throws Error if email is not found in JWT token
   */
  async getCurrentUser(
    request: GetCurrentUserRequest,
    jwtPayload: JwtPayload
  ): Promise<GetCurrentUserResponse> {
    // Try to find existing user
    let user = await this.userRepository.findByAzureAdObjectId(request.callerId);
    let isNewUser = false;

    // Auto-provision user if they don't exist
    if (user === null || user === undefined) {
      user = await this.provisionNewUser(request.callerId, jwtPayload);
      isNewUser = true;
    } else {
      // Extract email to check for special role assignment
      const email = (jwtPayload.upn || jwtPayload.email || jwtPayload.preferred_username || user.email) as string;
      const emailLower = email?.toLowerCase() || '';
      
      // If user has email starting with special prefix and is not SuperAdmin, promote to SuperAdmin
      if (emailLower.startsWith(UserConstants.SUPER_ADMIN_EMAIL_PREFIX) && user.role !== UserRole.SuperAdmin) {
        await this.userRepository.changeUserRole(user.id, UserRole.SuperAdmin);
        const updatedUser = await this.userRepository.findByAzureAdObjectId(request.callerId);
        if (!updatedUser) {
          throw new ApplicationError('User not found after role change', ApplicationErrorCode.OPERATION_FAILED);
        }
        user = updatedUser;
      } else if (user.role === UserRole.Unassigned) {
        // Ensure users with Unassigned role are promoted to PSO
        await this.userRepository.changeUserRole(user.id, UserRole.PSO);
        const updatedUser = await this.userRepository.findByAzureAdObjectId(request.callerId);
        if (!updatedUser) {
          throw new ApplicationError('User not found after role change', ApplicationErrorCode.OPERATION_FAILED);
        }
        user = updatedUser;
      }
    }

    // Defensive: satisfy type-narrowing for linting/TS
    if (!user) {
      throw new ApplicationError('Invariant violation: user must be defined after provisioning or promotion', ApplicationErrorCode.OPERATION_FAILED);
    }

    // Split full name into first and last
    const { firstName, lastName } = this.splitName(user.fullName);

    // Resolve effective permissions for the caller
    const permissions = await this.userRepository.getEffectivePermissionCodesByAzureId(user.azureAdObjectId);

    return new GetCurrentUserResponse(
      user.azureAdObjectId,
      user.email,
      firstName,
      lastName,
      user.role,
      undefined, // supervisorAdId - would need to query supervisor
      undefined, // supervisorName - would need to query supervisor
      permissions,
      isNewUser
    );
  }

  /**
   * Provisions a new user with appropriate role based on email
   * - SuperAdmin for emails starting with special prefix (see UserConstants)
   * - PSO for all other users
   * @param azureAdObjectId - Azure AD Object ID
   * @param jwtPayload - JWT token payload
   * @returns Promise that resolves to the created user
   * @throws Error if email is not found in JWT token
   * @private
   */
  private async provisionNewUser(azureAdObjectId: string, jwtPayload: JwtPayload) {
    // Extract email from JWT token (try multiple fields)
    const email = (jwtPayload.upn || jwtPayload.email || jwtPayload.preferred_username) as string;
    
    if (!email) {
      throw new ValidationError('User email not found in authentication token', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED);
    }

    // Extract or generate full name
    const fullName = (jwtPayload.name || email.split('@')[0]) as string;

    // Determine role based on email
    // If email starts with special prefix, assign SuperAdmin role
    const role = email.toLowerCase().startsWith(UserConstants.SUPER_ADMIN_EMAIL_PREFIX) 
      ? UserRole.SuperAdmin 
      : UserRole.PSO;

    // Create user with appropriate role
    return await this.userRepository.upsertUser({
      email,
      azureAdObjectId,
      fullName,
      role
    });
  }

  /**
   * Splits a full name into first and last name
   * @param fullName - Full name string
   * @returns Object with firstName and lastName
   * @private
   */
  private splitName(fullName: string): { firstName: string; lastName: string } {
    const [firstName = "", ...lastNameParts] = (fullName || "").trim().split(/\s+/);
    const lastName = lastNameParts.join(" ");
    return { firstName, lastName };
  }
}

