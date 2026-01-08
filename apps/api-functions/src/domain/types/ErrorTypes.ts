/**
 * @fileoverview ErrorTypes - Type definitions for error handling
 * @summary Type definitions for error-related data structures
 * @description Pure data structures for error handling and error details
 */

import { ErrorType } from '../enums/ErrorType';
import { ErrorSeverity } from '../enums/ErrorSeverity';

/**
 * Error details extracted from unknown error type
 * @description Represents error information extracted safely from unknown error types
 */
export interface ErrorDetails {
  /**
   * Error message string
   */
  message: string;
  /**
   * Error cause (always an Error instance)
   */
  cause: Error;
}

/**
 * Error classification result
 * @description Represents the classification of an error including its type, status code, and logging requirements
 */
export interface ErrorClassification {
  /**
   * Error type classification
   */
  type: ErrorType;
  /**
   * HTTP status code for the error
   */
  statusCode: number;
  /**
   * Whether the error should be logged
   */
  shouldLog: boolean;
  /**
   * Error severity level
   */
  severity: ErrorSeverity;
}

/**
 * Axios error response structure
 * @description Type definition for axios error response details
 */
export interface AxiosErrorResponse {
  /**
   * HTTP status code from axios error response
   */
  status?: number;
  /**
   * Response data from axios error
   */
  data?: unknown;
}

