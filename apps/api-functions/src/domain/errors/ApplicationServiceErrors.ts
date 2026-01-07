/**
 * @fileoverview ApplicationServiceErrors - Application service layer error classes
 * @description Specific error classes for application service operations
 */

import { DomainError } from './DomainError';
import { ApplicationServiceErrorCode } from './ErrorCodes';

/**
 * Recording session not found error
 */
export class RecordingSessionNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, ApplicationServiceErrorCode.RECORDING_SESSION_NOT_FOUND);
  }
}

/**
 * Application service operation error
 */
export class ApplicationServiceOperationError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, ApplicationServiceErrorCode.OPERATION_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

