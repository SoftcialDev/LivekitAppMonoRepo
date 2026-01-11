/**
 * @fileoverview Error classes for recordings module
 * @summary Domain-specific errors for recording operations
 * @description Error classes for recording-related operations
 */

import { AppError } from '@/shared/errors';

/**
 * Base error class for recordings module
 * 
 * All recordings-specific errors extend this class for consistent error handling
 * within the recordings module.
 */
export class RecordingError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when a recording download fails due to missing URL
 */
export class RecordingDownloadUrlError extends RecordingError {
  constructor(recordingId?: string, cause?: Error) {
    const message = recordingId
      ? `No downloadable URL available for recording: ${recordingId}`
      : 'No downloadable URL available for this recording';
    super(message, cause);
  }
}

/**
 * Error thrown when fetching recordings fails
 */
export class RecordingsFetchError extends RecordingError {
  constructor(message: string = 'Failed to fetch recordings', cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when deleting a recording fails
 */
export class RecordingDeleteError extends RecordingError {
  constructor(recordingId: string, cause?: Error) {
    super(`Failed to delete recording: ${recordingId}`, cause);
  }
}

