/**
 * @fileoverview UserErrors - Error classes for user-related operations
 * @summary Defines specific error types for user operations
 * @description Custom error classes for user-related business logic errors
 */

/**
 * Error thrown when a user is not found
 * @description Represents the case when a requested user does not exist in the system
 */
export class UserNotFoundError extends Error {
  /**
   * Creates a new UserNotFoundError
   * @param message - Error message describing the user not found scenario
   */
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

/**
 * Error thrown when user access is denied
 * @description Represents the case when a user lacks permission for an operation
 */
export class UserAccessDeniedError extends Error {
  /**
   * Creates a new UserAccessDeniedError
   * @param message - Error message describing the access denial
   */
  constructor(message: string) {
    super(message);
    this.name = 'UserAccessDeniedError';
  }
}
