/**
 * @fileoverview MiddlewareErrors - Middleware layer error classes
 * @description Specific error classes for middleware operations
 */

import { DomainError } from './DomainError';
import { MiddlewareErrorCode } from './ErrorCodes';

/**
 * Caller ID not found error
 */
export class CallerIdNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, MiddlewareErrorCode.CALLER_ID_NOT_FOUND);
  }
}

/**
 * Target user not found error
 */
export class TargetUserNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, MiddlewareErrorCode.TARGET_USER_NOT_FOUND);
  }
}

/**
 * Target user inactive error
 */
export class TargetUserInactiveError extends DomainError {
  constructor(message: string) {
    super(message, MiddlewareErrorCode.TARGET_USER_INACTIVE);
  }
}

/**
 * Target not PSO error
 */
export class TargetNotPsoError extends DomainError {
  constructor(message: string) {
    super(message, MiddlewareErrorCode.TARGET_NOT_PSO);
  }
}

/**
 * Insufficient privileges error
 */
export class InsufficientPrivilegesError extends DomainError {
  constructor(message: string) {
    super(message, MiddlewareErrorCode.INSUFFICIENT_PRIVILEGES);
  }
}

/**
 * Admin access required error
 */
export class AdminAccessRequiredError extends DomainError {
  constructor(message: string) {
    super(message, MiddlewareErrorCode.ADMIN_ACCESS_REQUIRED);
  }
}

/**
 * Super admin access required error
 */
export class SuperAdminAccessRequiredError extends DomainError {
  constructor(message: string) {
    super(message, MiddlewareErrorCode.SUPER_ADMIN_ACCESS_REQUIRED);
  }
}

