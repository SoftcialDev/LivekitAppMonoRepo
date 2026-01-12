/**
 * @fileoverview SuperAdminErrors - Error classes for SuperAdmin operations
 * @summary Defines specific error types for SuperAdmin operations
 * @description Custom error classes for SuperAdmin-related business logic errors
 */

import { DomainError } from './DomainError';
import { SuperAdminErrorCode } from './ErrorCodes';

/**
 * Error thrown when SuperAdmin user is not found
 */
export class SuperAdminUserNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, SuperAdminErrorCode.USER_NOT_FOUND);
  }
}

/**
 * Error thrown when user is not a SuperAdmin
 */
export class SuperAdminInvalidRoleError extends DomainError {
  constructor(message: string) {
    super(message, SuperAdminErrorCode.INVALID_ROLE);
  }
}

