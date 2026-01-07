/**
 * @fileoverview ContactManagerErrors - Error classes for contact manager operations
 * @summary Defines specific error types for contact manager operations
 * @description Custom error classes for contact manager-related business logic errors
 */

import { DomainError } from './DomainError';
import { ContactManagerErrorCode } from './ErrorCodes';

/**
 * Error thrown when contact manager user is not found
 */
export class ContactManagerUserNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, ContactManagerErrorCode.USER_NOT_FOUND);
  }
}

/**
 * Error thrown when contact manager profile is not found
 */
export class ContactManagerProfileNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, ContactManagerErrorCode.PROFILE_NOT_FOUND);
  }
}

/**
 * Error thrown when contact manager form processing fails
 */
export class ContactManagerFormProcessingError extends DomainError {
  constructor(message: string, originalError?: Error) {
    super(message, ContactManagerErrorCode.FORM_PROCESSING_FAILED);
    if (originalError) {
      this.cause = originalError;
    }
  }
}

