/**
 * @fileoverview CommandErrors - Error classes for command operations
 * @summary Defines specific error types for command operations
 * @description Custom error classes for command-related business logic errors
 */

import { DomainError } from './DomainError';
import { CommandErrorCode } from './ErrorCodes';

/**
 * Error thrown when command user is not found
 */
export class CommandUserNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, CommandErrorCode.USER_NOT_FOUND);
  }
}

/**
 * Error thrown when user is deleted
 */
export class CommandUserDeletedError extends DomainError {
  constructor(message: string) {
    super(message, CommandErrorCode.USER_DELETED);
  }
}

/**
 * Error thrown when user role is invalid for command operation
 */
export class CommandInvalidUserRoleError extends DomainError {
  constructor(message: string) {
    super(message, CommandErrorCode.INVALID_USER_ROLE);
  }
}

/**
 * Error thrown when command is not found
 */
export class CommandNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, CommandErrorCode.COMMAND_NOT_FOUND);
  }
}

