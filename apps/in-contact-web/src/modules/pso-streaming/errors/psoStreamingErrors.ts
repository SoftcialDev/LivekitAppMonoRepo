/**
 * @fileoverview PSO Streaming errors
 * @summary Domain-specific error classes for PSO streaming operations
 * @description Error classes for PSO streaming module following domain error patterns
 */

import { AppError } from '@/shared/errors';

/**
 * Base error class for PSO streaming operations
 */
export class PSOStreamingError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'PSOStreamingError';
  }
}

/**
 * Error thrown when LiveKit token fetch fails
 */
export class LiveKitTokenError extends PSOStreamingError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'LiveKitTokenError';
  }
}

/**
 * Error thrown when streaming sessions fetch fails
 */
export class StreamingSessionsFetchError extends PSOStreamingError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'StreamingSessionsFetchError';
  }
}

/**
 * Error thrown when streaming status batch fetch fails
 */
export class StreamingStatusBatchError extends PSOStreamingError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'StreamingStatusBatchError';
  }
}

/**
 * Error thrown when camera command fails
 */
export class CameraCommandError extends PSOStreamingError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'CameraCommandError';
  }
}

/**
 * Error thrown when snapshot submission fails
 */
export class SnapshotSubmitError extends PSOStreamingError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'SnapshotSubmitError';
  }
}

/**
 * Error thrown when recording command fails
 */
export class RecordingCommandError extends PSOStreamingError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'RecordingCommandError';
  }
}

/**
 * Error thrown when talk session operation fails
 */
export class TalkSessionError extends PSOStreamingError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'TalkSessionError';
  }
}

