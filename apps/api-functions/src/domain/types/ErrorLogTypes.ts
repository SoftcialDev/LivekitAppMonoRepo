/**
 * @fileoverview ErrorLogTypes - Type definitions for error log operations
 * @summary Defines types and interfaces for error log data structures
 * @description Encapsulates error log creation and query data structures
 */

import { ErrorSeverity } from '../enums/ErrorSeverity';
import { ErrorSource } from '../enums/ErrorSource';

/**
 * Data structure for creating a new error log entry
 * @description Represents the data needed to create an error log
 */
export interface CreateErrorLogData {
  /**
   * Error severity level
   */
  severity: ErrorSeverity;

  /**
   * Source of the error
   */
  source: ErrorSource;

  /**
   * API endpoint where error occurred
   */
  endpoint?: string;

  /**
   * Function name where error occurred
   */
  functionName?: string;

  /**
   * Error name/type
   */
  errorName?: string;

  /**
   * Error message
   */
  errorMessage: string;

  /**
   * Stack trace
   */
  stackTrace?: string;

  /**
   * HTTP status code
   */
  httpStatusCode?: number;

  /**
   * User identifier
   */
  userId?: string;

  /**
   * User email
   */
  userEmail?: string;

  /**
   * Request identifier
   */
  requestId?: string;

  /**
   * Additional context data
   */
  context?: Record<string, unknown>;
}

/**
 * Query parameters for filtering error logs
 * @description Represents filter criteria for querying error logs
 */
export interface ErrorLogQueryParams {
  /**
   * Filter by error source
   */
  source?: ErrorSource;

  /**
   * Filter by severity level
   */
  severity?: ErrorSeverity;

  /**
   * Filter by endpoint
   */
  endpoint?: string;

  /**
   * Filter by resolution status
   */
  resolved?: boolean;

  /**
   * Start date for date range filter
   */
  startDate?: Date;

  /**
   * End date for date range filter
   */
  endDate?: Date;

  /**
   * Maximum number of results
   */
  limit?: number;

  /**
   * Number of results to skip
   */
  offset?: number;
}

