/**
 * @fileoverview BootstrapError - Error for application bootstrap failures
 * @summary Error thrown during application initialization
 * @description Error thrown when the application fails to bootstrap correctly,
 * such as missing DOM elements or initialization failures.
 */

import { AppError } from './AppError';

/**
 * Error thrown during application bootstrap
 * 
 * Used when the application fails to initialize correctly, such as:
 * - Missing root DOM element
 * - React DOM initialization failures
 * - Other bootstrap-related errors
 */
export class BootstrapError extends AppError {
  /**
   * Creates a new BootstrapError instance
   * 
   * @param message - Error message describing the bootstrap issue
   * @param cause - Optional underlying error that caused this bootstrap error
   */
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

