/**
 * @fileoverview UserDeletionRequest - Value object for user deletion requests
 * @description Represents a request to delete a user from the system
 */

import { UserDeletionType } from '../enums/UserDeletionType';

/**
 * Value object representing a user deletion request
 */
export class UserDeletionRequest {
  private constructor(
    public readonly userEmail: string,
    public readonly deletionType: UserDeletionType,
    public readonly reason?: string
  ) {}

  /**
   * Creates a new user deletion request
   * @param userEmail - Email of the user to delete
   * @param deletionType - Type of deletion to perform
   * @param reason - Optional reason for deletion
   * @returns New UserDeletionRequest instance
   */
  static create(
    userEmail: string,
    deletionType: UserDeletionType,
    reason?: string
  ): UserDeletionRequest {
    return new UserDeletionRequest(userEmail, deletionType, reason);
  }

  /**
   * Checks if this is a soft delete request (always true)
   * @returns True (always soft delete)
   */
  isSoftDelete(): boolean {
    return true;
  }

  /**
   * Gets the deletion type as string
   * @returns Deletion type string
   */
  getDeletionTypeString(): string {
    return this.deletionType;
  }

  /**
   * Gets the reason for deletion
   * @returns Reason string or undefined
   */
  getReason(): string | undefined {
    return this.reason;
  }
}
