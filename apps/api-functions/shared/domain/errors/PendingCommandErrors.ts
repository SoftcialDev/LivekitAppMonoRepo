/**
 * @fileoverview PendingCommandErrors - Specific error classes for pending command operations
 * @summary Defines domain-specific errors for pending command business logic
 * @description Provides granular error handling for pending command operations
 */

/**
 * Error thrown when no pending commands are found for a user
 */
export class PendingCommandNotFoundError extends Error {
  constructor(message: string = "No pending commands found") {
    super(message);
    this.name = "PendingCommandNotFoundError";
  }
}

/**
 * Error thrown when a pending command has expired
 */
export class PendingCommandExpiredError extends Error {
  constructor(message: string = "Pending command has expired") {
    super(message);
    this.name = "PendingCommandExpiredError";
  }
}

/**
 * Error thrown when user lacks access to pending commands
 */
export class PendingCommandAccessDeniedError extends Error {
  constructor(message: string = "Access denied to pending commands") {
    super(message);
    this.name = "PendingCommandAccessDeniedError";
  }
}

/**
 * Error thrown when user is not found or inactive
 */
export class PendingCommandUserNotFoundError extends Error {
  constructor(message: string = "User not found or inactive") {
    super(message);
    this.name = "PendingCommandUserNotFoundError";
  }
}

/**
 * Error thrown when fetching pending commands fails
 */
export class PendingCommandFetchError extends Error {
  constructor(message: string = "Failed to fetch pending commands") {
    super(message);
    this.name = "PendingCommandFetchError";
  }
}
