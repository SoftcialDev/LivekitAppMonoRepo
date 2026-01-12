/**
 * @fileoverview DomainError - Base domain error class
 * @description Provides structured error handling with specific error codes
 */

import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Base domain error class
 */
export abstract class DomainError extends Error {
  public readonly statusCode: number;
  public readonly timestamp: Date;
  public cause?: Error;

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
export class AuthError extends DomainError {}

/**
 * Validation errors
 */
export class ValidationError extends DomainError {}

/**
 * Messaging errors
 */
export class MessagingError extends DomainError {}

/**
 * Application logic errors
 */
export class ApplicationError extends DomainError {}

/**
 * Supervisor management errors
 */
export class SupervisorError extends DomainError {}

/**
 * User role change errors
 */
export class UserRoleChangeError extends DomainError {}

/**
 * User deletion errors
 */
export class UserDeletionError extends DomainError {}
