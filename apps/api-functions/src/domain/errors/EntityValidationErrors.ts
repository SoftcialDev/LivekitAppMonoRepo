/**
 * @fileoverview EntityValidationErrors - Error classes for entity validation
 * @summary Defines specific error types for entity validation
 * @description Custom error classes for entity validation errors
 */

import { DomainError } from './DomainError';
import { EntityValidationErrorCode } from './ErrorCodes';

/**
 * Error thrown when required fields are missing
 */
export class MissingRequiredFieldsError extends DomainError {
  constructor(message: string) {
    super(message, EntityValidationErrorCode.MISSING_REQUIRED_FIELDS);
  }
}

/**
 * Error thrown when format is invalid
 */
export class InvalidFormatError extends DomainError {
  constructor(message: string) {
    super(message, EntityValidationErrorCode.INVALID_FORMAT);
  }
}

/**
 * Error thrown when permission code is invalid
 */
export class InvalidPermissionCodeError extends DomainError {
  constructor(message: string) {
    super(message, EntityValidationErrorCode.INVALID_PERMISSION_CODE);
  }
}

