/**
 * @fileoverview UserDeletionResult - Value object for user deletion results
 * @description Represents the result of a user deletion operation
 */

import { UserRole } from '@prisma/client';
import { UserDeletionType } from '../enums/UserDeletionType';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Value object representing the result of a user deletion operation
 */
export class UserDeletionResult {
  private constructor(
    public readonly success: boolean,
    public readonly userEmail: string,
    public readonly deletionType: UserDeletionType,
    public readonly previousRole: UserRole | null,
    public readonly azureAdObjectId: string | null,
    public readonly fullName: string | null,
    public readonly message: string,
    public readonly timestamp: Date
  ) {}

  /**
   * Creates a successful user deletion result
   * @param userEmail - Email of the deleted user
   * @param deletionType - Type of deletion performed
   * @param previousRole - Previous role of the user
   * @param azureAdObjectId - Azure AD object ID
   * @param fullName - Full name of the user
   * @param message - Success message
   * @returns New UserDeletionResult instance
   */
  static success(
    userEmail: string,
    deletionType: UserDeletionType,
    previousRole: UserRole | null,
    azureAdObjectId: string | null,
    fullName: string | null,
    message: string
  ): UserDeletionResult {
    return new UserDeletionResult(
      true,
      userEmail,
      deletionType,
      previousRole,
      azureAdObjectId,
      fullName,
      message,
      getCentralAmericaTime()
    );
  }

  /**
   * Creates a failed user deletion result
   * @param userEmail - Email of the user that failed to delete
   * @param deletionType - Type of deletion attempted
   * @param message - Error message
   * @returns New UserDeletionResult instance
   */
  static failure(
    userEmail: string,
    deletionType: UserDeletionType,
    message: string
  ): UserDeletionResult {
    return new UserDeletionResult(
      false,
      userEmail,
      deletionType,
      null,
      null,
      null,
      message,
      getCentralAmericaTime()
    );
  }

  /**
   * Gets the deletion type as string
   * @returns Deletion type string
   */
  getDeletionTypeString(): string {
    return this.deletionType;
  }

  /**
   * Gets the previous role as string
   * @returns Previous role string or null
   */
  getPreviousRoleString(): string | null {
    return this.previousRole;
  }

  /**
   * Checks if the deletion was successful
   * @returns True if deletion was successful
   */
  isSuccess(): boolean {
    return this.success;
  }

  /**
   * Gets the result message
   * @returns Result message
   */
  getMessage(): string {
    return this.message;
  }
}
