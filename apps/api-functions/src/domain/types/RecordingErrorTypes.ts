/**
 * @fileoverview RecordingErrorTypes - Type definitions for recording error logging
 * @summary Defines types and interfaces for recording error data structures
 * @description Encapsulates recording error information and context
 */

/**
 * Error information for logging
 * @description Represents error details to be logged
 */
export interface RecordingErrorInfo {
  /**
   * Error message
   */
  message: string;

  /**
   * Error name/type
   */
  name?: string;

  /**
   * Error stack trace
   */
  stack?: string;
}

/**
 * Context information for error logging
 * @description Additional context data associated with an error
 */
export interface RecordingErrorContext {
  /**
   * Recording session identifier
   */
  sessionId?: string;

  /**
   * Egress identifier
   */
  egressId?: string;

  /**
   * LiveKit room name
   */
  roomName?: string;

  /**
   * Subject user identifier
   */
  subjectUserId?: string | null;

  /**
   * Initiator user identifier
   */
  initiatorUserId?: string;

  /**
   * Additional context properties
   */
  [key: string]: unknown;
}

