/**
 * @fileoverview CameraFailureErrors - Error classes for camera failure operations
 * @summary Domain-specific error classes for camera failures module
 * @description Defines error classes for camera failure operations
 */

import { AppError } from '@/shared/errors';

/**
 * Base error class for camera failure operations
 */
export class CameraFailureError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'CameraFailureError';
  }
}

/**
 * Error thrown when fetching camera failures fails
 */
export class CameraFailuresFetchError extends CameraFailureError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'CameraFailuresFetchError';
  }
}

/**
 * Error thrown when fetching a single camera failure by ID fails
 */
export class CameraFailureByIdFetchError extends CameraFailureError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'CameraFailureByIdFetchError';
  }
}

