/**
 * @fileoverview CameraFailureErrors - Error classes for camera failure operations
 * @summary Defines specific error types for camera failure operations
 * @description Custom error classes for camera failure-related business logic errors
 */

import { DomainError } from './DomainError';
import { CameraFailureErrorCode } from './ErrorCodes';

/**
 * Error thrown when camera failure retrieval fails
 */
export class CameraFailureRetrieveError extends DomainError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message, CameraFailureErrorCode.RETRIEVE_FAILED);
    this.originalError = originalError;
  }
}

/**
 * Error thrown when camera failure count fails
 */
export class CameraFailureCountError extends DomainError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message, CameraFailureErrorCode.COUNT_FAILED);
    this.originalError = originalError;
  }
}

