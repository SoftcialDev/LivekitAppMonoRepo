/**
 * @fileoverview SnapshotErrors - Error classes for snapshot-related operations
 * @summary Defines specific error types for snapshot operations
 * @description Custom error classes for snapshot-related business logic errors
 */

import { DomainError } from './DomainError';
import { SnapshotErrorCode, ValidationErrorCode } from './ErrorCodes';

/**
 * Error thrown when a snapshot is not found
 */
export class SnapshotNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, SnapshotErrorCode.SNAPSHOT_NOT_FOUND);
  }
}

/**
 * Error thrown when snapshot reason is not found or inactive
 */
export class SnapshotReasonNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, ValidationErrorCode.SNAPSHOT_REASON_NOT_FOUND);
  }
}

/**
 * Error thrown when snapshot reason is inactive
 */
export class SnapshotReasonInactiveError extends DomainError {
  constructor(message: string) {
    super(message, ValidationErrorCode.SNAPSHOT_REASON_INACTIVE);
  }
}

/**
 * Error thrown when description is required but missing
 */
export class DescriptionRequiredError extends DomainError {
  constructor(message: string = 'Description is required when reason is "Other"') {
    super(message, ValidationErrorCode.DESCRIPTION_REQUIRED);
  }
}

/**
 * Error thrown when snapshot reason already exists
 */
export class SnapshotReasonAlreadyExistsError extends DomainError {
  constructor(message: string) {
    super(message, ValidationErrorCode.SNAPSHOT_REASON_ALREADY_EXISTS);
  }
}

/**
 * Error thrown when snapshot processing fails
 */
export class SnapshotProcessingError extends DomainError {
  public readonly originalError?: Error;
  
  constructor(message: string, originalError?: Error) {
    super(message, SnapshotErrorCode.SNAPSHOT_PROCESSING_FAILED);
    this.originalError = originalError;
  }
}

/**
 * Error thrown when trying to deactivate the "OTHER" reason
 */
export class CannotDeactivateOtherReasonError extends DomainError {
  constructor(message: string = 'Cannot deactivate the "OTHER" reason') {
    super(message, ValidationErrorCode.CANNOT_DEACTIVATE_OTHER_REASON);
  }
}

/**
 * Error thrown when trying to deactivate default reasons
 */
export class CannotDeactivateDefaultReasonError extends DomainError {
  constructor(message: string = 'Cannot deactivate default reasons') {
    super(message, ValidationErrorCode.CANNOT_DEACTIVATE_DEFAULT_REASON);
  }
}

/**
 * Error thrown when trying to delete the "OTHER" reason
 */
export class CannotDeleteOtherReasonError extends DomainError {
  constructor(message: string = 'Cannot delete the "OTHER" reason') {
    super(message, ValidationErrorCode.CANNOT_DELETE_OTHER_REASON);
  }
}

/**
 * Error thrown when trying to delete default reasons
 */
export class CannotDeleteDefaultReasonError extends DomainError {
  constructor(message: string = 'Cannot delete default reasons') {
    super(message, ValidationErrorCode.CANNOT_DELETE_DEFAULT_REASON);
  }
}

