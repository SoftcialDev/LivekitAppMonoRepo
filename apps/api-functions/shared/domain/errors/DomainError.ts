/**
 * @fileoverview DomainError - Base domain error class
 * @description Provides structured error handling with specific error codes
 */

import { AuthErrorCode, ValidationErrorCode, MessagingErrorCode, ApplicationErrorCode, SupervisorErrorCode, UserRoleChangeErrorCode, UserDeletionErrorCode } from './ErrorCodes';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Base domain error class
 */
export abstract class DomainError extends Error {
  public readonly statusCode: number;
  public readonly timestamp: Date;

  /**
   * Creates a new DomainError instance
   * @param message - Error message
   * @param statusCode - HTTP status code
   */
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.timestamp = getCentralAmericaTime();
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthError extends DomainError {
  constructor(message: string, statusCode: AuthErrorCode) {
    super(message, statusCode);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends DomainError {
  constructor(message: string, statusCode: ValidationErrorCode) {
    super(message, statusCode);
  }
}

/**
 * Messaging errors
 */
export class MessagingError extends DomainError {
  constructor(message: string, statusCode: MessagingErrorCode) {
    super(message, statusCode);
  }
}

/**
 * Application logic errors
 */
export class ApplicationError extends DomainError {
  constructor(message: string, statusCode: ApplicationErrorCode) {
    super(message, statusCode);
  }
}

/**
 * Supervisor management errors
 */
export class SupervisorError extends DomainError {
  constructor(message: string, statusCode: SupervisorErrorCode) {
    super(message, statusCode);
  }
}

/**
 * User role change errors
 */
export class UserRoleChangeError extends DomainError {
  constructor(message: string, statusCode: UserRoleChangeErrorCode) {
    super(message, statusCode);
  }
}

/**
 * User deletion errors
 */
export class UserDeletionError extends DomainError {
  constructor(message: string, statusCode: UserDeletionErrorCode) {
    super(message, statusCode);
  }
}
