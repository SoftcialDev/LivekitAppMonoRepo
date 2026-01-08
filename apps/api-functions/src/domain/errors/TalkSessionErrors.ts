/**
 * @fileoverview TalkSessionErrors - Error classes for talk session operations
 * @summary Defines domain-specific errors for talk session operations
 * @description Provides error classes for talk session business logic violations
 */

import { DomainError } from './DomainError';
import { TalkSessionErrorCode } from './ErrorCodes';

/**
 * Error thrown when attempting to start a talk session with a PSO that already has an active session
 */
export class TalkSessionAlreadyActiveError extends DomainError {
  /**
   * ID of the active session that prevents starting a new one
   */
  public readonly activeSessionId?: string;

  /**
   * Creates a new TalkSessionAlreadyActiveError instance
   * @param message - Error message
   * @param activeSessionId - Optional ID of the active session
   * @param cause - Optional underlying error that caused this error
   */
  constructor(message: string, activeSessionId?: string, cause?: Error) {
    super(message, TalkSessionErrorCode.TALK_SESSION_ALREADY_ACTIVE);
    this.activeSessionId = activeSessionId;
    if (cause) {
      this.cause = cause;
    }
  }
}

