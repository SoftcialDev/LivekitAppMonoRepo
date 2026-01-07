/**
 * @fileoverview StreamingSessionErrors - Custom error classes for streaming session operations
 * @summary Defines specific error types for streaming session domain
 * @description Provides domain-specific error handling for streaming session operations
 */

/**
 * Error thrown when a streaming session is not found
 */
export class StreamingSessionNotFoundError extends Error {
  constructor(message: string = "Streaming session not found") {
    super(message);
    this.name = "StreamingSessionNotFoundError";
  }
}

/**
 * Error thrown when access to streaming session is denied
 */
export class StreamingSessionAccessDeniedError extends Error {
  constructor(message: string = "Access denied to streaming session") {
    super(message);
    this.name = "StreamingSessionAccessDeniedError";
  }
}

/**
 * Error thrown when user is not found for streaming session operations
 */
export class StreamingSessionUserNotFoundError extends Error {
  constructor(message: string = "User not found for streaming session") {
    super(message);
    this.name = "StreamingSessionUserNotFoundError";
  }
}

/**
 * Error thrown when streaming session fetch operation fails
 */
export class StreamingSessionFetchError extends Error {
  constructor(message: string = "Failed to fetch streaming session") {
    super(message);
    this.name = "StreamingSessionFetchError";
  }
}

/**
 * Error thrown when streaming session creation fails
 */
export class StreamingSessionCreationError extends Error {
  constructor(message: string = "Failed to create streaming session") {
    super(message);
    this.name = "StreamingSessionCreationError";
  }
}

/**
 * Error thrown when streaming session update fails
 */
export class StreamingSessionUpdateError extends Error {
  constructor(message: string = "Failed to update streaming session") {
    super(message);
    this.name = "StreamingSessionUpdateError";
  }
}
