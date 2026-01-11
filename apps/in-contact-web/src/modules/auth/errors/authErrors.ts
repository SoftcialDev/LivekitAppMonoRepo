/**
 * @fileoverview Authentication domain errors
 * @summary Error classes for authentication operations
 * @description Domain-specific error classes for authentication-related failures
 */

import { AppError } from '@/shared/errors';

/**
 * Base error class for authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when an authentication operation requires a signed-in account
 * but no account is currently signed in
 */
export class NotSignedInError extends AuthenticationError {
  constructor(cause?: Error) {
    super(
      'No signed-in account. Please log in to perform this operation.',
      cause
    );
  }
}

