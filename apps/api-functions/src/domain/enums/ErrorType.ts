/**
 * @fileoverview ErrorType - Enum for error type classification
 * @summary Enumeration for categorizing error types
 * @description Defines the possible types of errors that can be classified
 */

/**
 * Error type classification
 * @description Represents the classification category of an error
 */
export enum ErrorType {
  /**
   * Expected error - client errors (4xx) that are anticipated and handled
   */
  Expected = 'expected',
  /**
   * Unexpected error - server errors (5xx) that are not anticipated
   */
  Unexpected = 'unexpected',
  /**
   * Unknown error - errors that cannot be properly classified
   */
  Unknown = 'unknown'
}

