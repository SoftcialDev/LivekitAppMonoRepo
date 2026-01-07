/**
 * @fileoverview GetCurrentUserResponse - Value object for get current user responses
 * @description Encapsulates the response with current user information and permissions
 */

import { UserRole } from '@prisma/client';

/**
 * Response containing current user information
 */
export class GetCurrentUserResponse {
  /**
   * Creates a new GetCurrentUserResponse instance
   * @param azureAdObjectId - Azure AD Object ID
   * @param email - User email
   * @param firstName - User first name
   * @param lastName - User last name
   * @param role - User role
   * @param supervisorAdId - Supervisor Azure AD Object ID (optional)
   * @param supervisorName - Supervisor full name (optional)
   * @param permissions - Effective permission codes for the user
   * @param isNewUser - Whether the user was just created
   */
  constructor(
    public readonly azureAdObjectId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: UserRole | null,
    public readonly supervisorAdId?: string,
    public readonly supervisorName?: string,
    public readonly permissions: string[] = [],
    public readonly isNewUser: boolean = false
  ) {}

  /**
   * Converts response to plain object for API response
   * @returns Plain object representation
   */
  toPayload() {
    return {
      azureAdObjectId: this.azureAdObjectId,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      supervisorAdId: this.supervisorAdId,
      supervisorName: this.supervisorName,
      permissions: this.permissions,
      isNewUser: this.isNewUser
    };
  }
}

