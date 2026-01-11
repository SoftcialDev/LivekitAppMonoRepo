/**
 * @fileoverview AppError - Base error class for application errors
 * @description Provides structured error handling with cause tracking for frontend errors
 */

/**
 * Base error class for application errors
 * 
 * All application-specific errors should extend this class to maintain
 * consistent error handling across the frontend.
 */
export class AppError extends Error {
  public readonly cause?: Error;

  /**
   * Creates a new AppError instance
   * @param message - Error message
   * @param cause - Optional underlying error that caused this error
   */
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    if (cause) {
      this.cause = cause;
    }
    Error.captureStackTrace?.(this, this.constructor);
  }
}

