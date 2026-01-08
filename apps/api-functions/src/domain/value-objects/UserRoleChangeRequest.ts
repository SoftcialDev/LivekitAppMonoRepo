/**
 * @fileoverview UserRoleChangeRequest - Domain value object for user role change requests
 * @description Represents a request to change a user's role
 */

import { UserRole } from '@prisma/client';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Interface for the raw user role change request payload.
 */
export interface UserRoleChangeRequestPayload {
  userEmail: string;
  newRole: UserRole;
}

/**
 * Value object representing a user role change request.
 */
export class UserRoleChangeRequest {
  /**
   * The email of the user whose role is being changed.
   * @type {string}
   */
  public readonly userEmail: string;

  /**
   * The new role to assign.
   * @type {UserRole}
   */
  public readonly newRole: UserRole;

  /**
   * The timestamp when the request was created.
   * @type {Date}
   */
  public readonly timestamp: Date;

  /**
   * Creates an instance of UserRoleChangeRequest.
   * @param userEmail - The email of the user whose role is being changed.
   * @param newRole - The new role to assign.
   * @param timestamp - The timestamp of the request.
   */
  constructor(userEmail: string, newRole: UserRole, timestamp: Date) {
    this.userEmail = userEmail.toLowerCase();
    this.newRole = newRole;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  /**
   * Creates a UserRoleChangeRequest instance from a raw request payload.
   * @param payload - The raw user role change request payload.
   * @returns A new UserRoleChangeRequest instance.
   */
  static fromRequest(payload: UserRoleChangeRequestPayload): UserRoleChangeRequest {
    return new UserRoleChangeRequest(
      payload.userEmail,
      payload.newRole,
      getCentralAmericaTime()
    );
  }

  /**
   * Gets the role name as string.
   * @returns Role name.
   */
  getRoleName(): string {
    return this.newRole;
  }

  /**
   * Converts the UserRoleChangeRequest instance to a payload suitable for logging.
   * @returns An object representing the request payload.
   */
  toPayload(): { userEmail: string; newRole: UserRole; timestamp: string } {
    return {
      userEmail: this.userEmail,
      newRole: this.newRole,
      timestamp: this.timestamp.toISOString(),
    };
  }
}
