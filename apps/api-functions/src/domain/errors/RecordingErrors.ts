/**
 * @fileoverview RecordingErrors - Custom error classes for recording operations
 * @summary Domain-specific error types for recording session management
 * @description Provides structured error handling for recording-related business logic
 */

/**
 * Error thrown when a recording session is not found
 */
export class RecordingNotFoundError extends Error {
  constructor(message: string = "Recording session not found") {
    super(message);
    this.name = "RecordingNotFoundError";
  }
}

/**
 * Error thrown when access to recording operations is denied
 */
export class RecordingAccessDeniedError extends Error {
  constructor(message: string = "Access denied to recording operations") {
    super(message);
    this.name = "RecordingAccessDeniedError";
  }
}

/**
 * Error thrown when a user is not found for recording operations
 */
export class RecordingUserNotFoundError extends Error {
  constructor(message: string = "User not found for recording operations") {
    super(message);
    this.name = "RecordingUserNotFoundError";
  }
}

/**
 * Error thrown when recording fetch operations fail
 */
export class RecordingFetchError extends Error {
  constructor(message: string = "Failed to fetch recordings") {
    super(message);
    this.name = "RecordingFetchError";
  }
}

/**
 * Error thrown when recording creation fails
 */
export class RecordingCreationError extends Error {
  constructor(message: string = "Failed to create recording session") {
    super(message);
    this.name = "RecordingCreationError";
  }
}

/**
 * Error thrown when recording update operations fail
 */
export class RecordingUpdateError extends Error {
  constructor(message: string = "Failed to update recording session") {
    super(message);
    this.name = "RecordingUpdateError";
  }
}

/**
 * Error thrown when recording deletion fails
 */
export class RecordingDeletionError extends Error {
  constructor(message: string = "Failed to delete recording session") {
    super(message);
    this.name = "RecordingDeletionError";
  }
}

/**
 * Error thrown when recording command processing fails
 */
export class RecordingCommandError extends Error {
  constructor(message: string = "Failed to process recording command") {
    super(message);
    this.name = "RecordingCommandError";
  }
}

/**
 * Error thrown when no active recordings are found for stop command
 */
export class NoActiveRecordingsError extends Error {
  constructor(message: string = "No active recordings found") {
    super(message);
    this.name = "NoActiveRecordingsError";
  }
}

/**
 * Error thrown when recording start fails
 */
export class RecordingStartError extends Error {
  constructor(message: string = "Failed to start recording") {
    super(message);
    this.name = "RecordingStartError";
  }
}

/**
 * Error thrown when recording stop fails
 */
export class RecordingStopError extends Error {
  constructor(message: string = "Failed to stop recording") {
    super(message);
    this.name = "RecordingStopError";
  }
}
