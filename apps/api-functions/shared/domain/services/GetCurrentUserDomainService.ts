/**
 * @fileoverview GetCurrentUserDomainService - Domain service for current user operations
 * @description Handles business logic for getting current user with auto-provisioning
 */

import { UserRole } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { GetCurrentUserRequest } from '../value-objects/GetCurrentUserRequest';
import { GetCurrentUserResponse } from '../value-objects/GetCurrentUserResponse';
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
    if (!user) {
      user = await this.provisionNewUser(request.callerId, jwtPayload);
      isNewUser = true;
    } else if (user.role === UserRole.Unassigned) {
      // Ensure users with Unassigned role are promoted to Employee
      await this.userRepository.changeUserRole(user.id, UserRole.Employee);
      user = { ...user, role: UserRole.Employee } as any;
    }

    // Defensive: satisfy type-narrowing for linting/TS
    if (!user) {
      throw new Error('Invariant violation: user must be defined after provisioning or promotion');
    }

    // Split full name into first and last
    const { firstName, lastName } = this.splitName(user.fullName);

    return new GetCurrentUserResponse(
      user.azureAdObjectId,
      user.email,
      firstName,
      lastName,
      user.role,
      undefined, // supervisorAdId - would need to query supervisor
      undefined, // supervisorName - would need to query supervisor
      isNewUser
    );
  }

  /**
   * Provisions a new user with Employee role
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
      throw new Error('User email not found in authentication token');
    }

    // Extract or generate full name
    const fullName = (jwtPayload.name || email.split('@')[0]) as string;

    // Create user with Employee role
    return await this.userRepository.upsertUser({
      email,
      azureAdObjectId,
      fullName,
      role: UserRole.Employee
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

