/**
 * @fileoverview Contact Manager Dashboard error classes
 * @summary Error classes for Contact Manager Dashboard operations
 * @description Defines domain-specific error classes for Contact Manager Dashboard
 */

import { AppError } from '@/shared/errors';

/**
 * Base error for Contact Manager Dashboard operations
 */
export class ContactManagerDashboardError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when fetching Contact Manager status fails
 */
export class StatusFetchError extends ContactManagerDashboardError {
  constructor(message: string = 'Failed to fetch Contact Manager status', cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when updating Contact Manager status fails
 */
export class StatusUpdateError extends ContactManagerDashboardError {
  constructor(message: string = 'Failed to update Contact Manager status', cause?: Error) {
    super(message, cause);
  }
}

