/**
 * @fileoverview Error classes for error logs module
 * @description Module-specific error classes for error logs operations
 */

import { AppError } from '@/shared/errors';

/**
 * Base error class for error logs module
 * 
 * All error logs-specific errors extend this class for consistent error handling
 * within the error logs module.
 */
export class ErrorLogsError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when fetching error logs fails
 */
export class ErrorLogsFetchError extends ErrorLogsError {
  constructor(message: string = 'Failed to fetch error logs', cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when fetching a single error log by ID fails
 */
export class ErrorLogByIdFetchError extends ErrorLogsError {
  constructor(id: string, cause?: Error) {
    super(`Failed to fetch error log with ID: ${id}`, cause);
  }
}

/**
 * Error thrown when resolving an error log fails
 */
export class ErrorLogResolveError extends ErrorLogsError {
  constructor(id: string, cause?: Error) {
    super(`Failed to resolve error log with ID: ${id}`, cause);
  }
}

/**
 * Error thrown when deleting error logs fails
 */
export class ErrorLogsDeleteError extends ErrorLogsError {
  constructor(ids: string | string[], cause?: Error) {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    const message = idsArray.length === 1
      ? `Failed to delete error log with ID: ${idsArray[0]}`
      : `Failed to delete ${idsArray.length} error logs`;
    super(message, cause);
  }
}

/**
 * Error thrown when deleting all error logs fails
 */
export class ErrorLogsDeleteAllError extends ErrorLogsError {
  constructor(cause?: Error) {
    super('Failed to delete all error logs', cause);
  }
}

/**
 * Error thrown when running database migrations fails
 */
export class MigrationsRunError extends ErrorLogsError {
  constructor(message: string = 'Failed to run database migrations', cause?: Error) {
    super(message, cause);
  }
}

