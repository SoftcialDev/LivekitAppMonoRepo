/**
 * @fileoverview ApiError - Error classes for API-related errors
 * @description Specific error classes for HTTP and API communication errors
 */

import { AppError } from './AppError';

/**
 * Error thrown when an API request fails
 */
export class ApiError extends AppError {
  public readonly statusCode?: number;
  public readonly response?: unknown;

  /**
   * Creates a new ApiError instance
   * @param message - Error message
   * @param statusCode - HTTP status code (if available)
   * @param response - Response data (if available)
   * @param cause - Optional underlying error that caused this error
   */
  constructor(
    message: string,
    statusCode?: number,
    response?: unknown,
    cause?: Error
  ) {
    super(message, cause);
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Error thrown when authentication fails (401)
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required', response?: unknown, cause?: Error) {
    super(message, 401, response, cause);
  }
}

/**
 * Error thrown when access is forbidden (403)
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access forbidden', response?: unknown, cause?: Error) {
    super(message, 403, response, cause);
  }
}

/**
 * Error thrown when a resource is not found (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', response?: unknown, cause?: Error) {
    super(message, 404, response, cause);
  }
}

/**
 * Error thrown when the server returns an error (500+)
 */
export class ServerError extends ApiError {
  constructor(
    message: string = 'Internal server error',
    statusCode: number = 500,
    response?: unknown,
    cause?: Error
  ) {
    super(message, statusCode, response, cause);
  }
}

/**
 * Error thrown when a request times out
 */
export class RequestTimeoutError extends ApiError {
  constructor(message: string = 'Request timeout', response?: unknown, cause?: Error) {
    super(message, 408, response, cause);
  }
}

/**
 * Error thrown when network request fails
 */
export class NetworkError extends ApiError {
  constructor(message: string = 'Network error', cause?: Error) {
    super(message, undefined, undefined, cause);
  }
}

