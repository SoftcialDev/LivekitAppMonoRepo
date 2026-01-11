/**
 * @fileoverview ConfigurationError - Error class for configuration issues
 * @description Thrown when configuration validation fails or required config values are missing
 */

import { AppError } from './AppError';

/**
 * Error thrown when configuration validation fails
 * 
 * Used when required environment variables are missing, invalid, or improperly formatted.
 * This error is thrown at application startup to fail fast if configuration is incorrect.
 */
export class ConfigurationError extends AppError {
  /**
   * Creates a new ConfigurationError instance
   * @param message - Error message describing the configuration issue
   * @param cause - Optional underlying error that caused this configuration error
   */
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

