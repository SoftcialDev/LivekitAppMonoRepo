/**
 * @fileoverview Talkback errors
 * @summary Domain-specific error classes for talkback functionality
 * @description Error classes for talkback operations
 */

import { PSOStreamingError } from './psoStreamingErrors';

/**
 * Error thrown when room is not connected for talkback operation
 */
export class TalkbackRoomNotConnectedError extends PSOStreamingError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'TalkbackRoomNotConnectedError';
  }
}

/**
 * Error thrown when PSO already has an active talk session
 */
export class TalkbackActiveSessionError extends PSOStreamingError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'TalkbackActiveSessionError';
  }
}

/**
 * Error thrown when admin already has an active talk session and tries to start another one
 */
export class TalkbackAdminAlreadyActiveError extends PSOStreamingError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'TalkbackAdminAlreadyActiveError';
  }
}

/**
 * Error thrown when microphone track fails to publish
 */
export class TalkbackMicrophonePublishError extends PSOStreamingError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'TalkbackMicrophonePublishError';
  }
}

