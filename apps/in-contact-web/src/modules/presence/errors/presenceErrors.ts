/**
 * @fileoverview Error classes for presence module
 * @summary Domain-specific errors for presence operations
 * @description Error classes for presence-related operations
 */

import { AppError } from '@/shared/errors';

/**
 * Base error class for presence module
 * 
 * All presence-specific errors extend this class for consistent error handling
 * within the presence module.
 */
export class PresenceError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when fetching presence snapshot fails
 */
export class PresenceSnapshotError extends PresenceError {
  constructor(message: string = 'Failed to fetch presence snapshot', cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when updating presence status fails
 */
export class PresenceUpdateError extends PresenceError {
  constructor(message: string = 'Failed to update presence status', cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when WebSocket connection for presence fails
 */
export class PresenceConnectionError extends PresenceError {
  constructor(message: string = 'Failed to connect to presence WebSocket', cause?: Error) {
    super(message, cause);
  }
}

