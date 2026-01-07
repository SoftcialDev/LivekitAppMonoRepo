/**
 * @fileoverview ErrorLogErrors - Error classes for error log operations
 * @summary Defines specific error types for error log operations
 * @description Custom error classes for error log-related business logic errors
 */

import { DomainError } from './DomainError';
import { ErrorLogErrorCode } from './ErrorCodes';

/**
 * Error thrown when no error log IDs are provided
 */
export class NoErrorLogIdsProvidedError extends DomainError {
  constructor(message: string = 'No error log IDs provided for deletion') {
    super(message, ErrorLogErrorCode.NO_IDS_PROVIDED);
  }
}

