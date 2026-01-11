/**
 * @fileoverview Error logs type definitions
 * @description Type definitions and data structures for error logs module
 */

import type React from 'react';
import { ErrorSeverity, ErrorSource } from '../enums/errorLogsEnums';

/**
 * Error log entry data structure
 * 
 * Represents a single error log entry with all its associated metadata.
 * This is the main data structure returned from the API.
 */
export interface ErrorLog {
  /** Unique identifier for the error log entry */
  id: string;
  
  /** Severity level of the error */
  severity: ErrorSeverity;
  
  /** Source component or service where the error originated */
  source: ErrorSource;
  
  /** API endpoint where the error occurred (if applicable) */
  endpoint?: string;
  
  /** Name of the function or method where the error occurred (if applicable) */
  functionName?: string;
  
  /** Name or type of the error */
  errorName: string;
  
  /** Detailed error message describing what went wrong */
  errorMessage: string;
  
  /** Stack trace of the error (if available) */
  stackTrace?: string;
  
  /** HTTP status code associated with the error (if applicable) */
  httpStatusCode?: number;
  
  /** Identifier of the user who encountered the error (if applicable) */
  userId?: string;
  
  /** Email address of the user who encountered the error (if applicable) */
  userEmail?: string;
  
  /** Request ID for tracking the specific request that caused the error */
  requestId?: string;
  
  /** Additional contextual data as key-value pairs */
  context?: Record<string, unknown>;
  
  /** Whether the error has been marked as resolved */
  resolved: boolean;
  
  /** Timestamp when the error was resolved (if resolved) */
  resolvedAt?: Date | string;
  
  /** Identifier of the user who resolved the error */
  resolvedBy?: string;
  
  /** Timestamp when the error log entry was created */
  createdAt: Date | string;
}

/**
 * Query parameters for fetching error logs
 * 
 * Used to filter and paginate error log entries when querying the API.
 */
export interface ErrorLogQueryParams {
  /** Filter by error source */
  source?: ErrorSource;
  
  /** Filter by error severity */
  severity?: ErrorSeverity;
  
  /** Filter by API endpoint */
  endpoint?: string;
  
  /** Filter by resolution status */
  resolved?: boolean;
  
  /** Start date for filtering errors by creation date */
  startDate?: Date;
  
  /** End date for filtering errors by creation date */
  endDate?: Date;
  
  /** Maximum number of results to return per page */
  limit?: number;
  
  /** Number of results to skip for pagination */
  offset?: number;
}

/**
 * Response structure from GET /api/error-logs endpoint
 * 
 * Contains the paginated list of error logs along with pagination metadata.
 */
export interface GetErrorLogsResponse {
  /** Array of error log entries */
  logs: ErrorLog[];
  
  /** Number of error logs in the current page */
  count: number;
  
  /** Total number of error logs matching the query */
  total: number;
  
  /** Maximum number of results per page used in this query */
  limit?: number;
  
  /** Number of results skipped for this page */
  offset?: number;
  
  /** Whether there are more results available after this page */
  hasMore: boolean;
}

/**
 * Request body structure for DELETE /api/error-logs endpoint
 * 
 * Used to specify which error logs should be deleted.
 */
export interface DeleteErrorLogsRequest {
  /** Single error log ID or array of IDs to delete */
  ids?: string | string[];
  
  /** Whether to delete all error logs (admin operation) */
  deleteAll?: boolean;
}

/**
 * Response structure from DELETE /api/error-logs endpoint
 * 
 * Contains confirmation and details about the deletion operation.
 */
export interface DeleteErrorLogsResponse {
  /** Confirmation message from the API */
  message: string;
  
  /** Array of IDs that were successfully deleted */
  deletedIds?: string[];
  
  /** Whether all error logs were deleted */
  deletedAll?: boolean;
}

/**
 * Re-export the standard API error response type from shared types
 * 
 * Use this type for error response structures returned by the API.
 * Import directly from shared types for better tree-shaking:
 * ```typescript
 * import type { IApiErrorResponse } from '@/shared/types/apiTypes';
 * ```
 */
export type { IApiErrorResponse } from '@/shared/types/apiTypes';

/**
 * Props for ErrorLogDetailsModal component
 */
export interface IErrorLogDetailsModalProps {
  /**
   * The error log to display details for
   */
  errorLog: ErrorLog | null;
  
  /**
   * Whether the modal is open
   */
  open: boolean;
  
  /**
   * Callback to close the modal
   */
  onClose: () => void;
}

/**
 * Response from running database migrations
 * 
 * Contains the result of executing database migrations and seeding operations.
 */
export interface RunMigrationsResponse {
  /**
   * Whether the migration operation was successful
   */
  success: boolean;

  /**
   * Human-readable message about the migration result
   */
  message: string;

  /**
   * Timestamp when migrations were executed
   */
  timestamp: string;

  /**
   * Standard output from migration execution (optional)
   */
  migrationStdout?: string;

  /**
   * Standard error output from migration execution (optional)
   */
  migrationStderr?: string;

  /**
   * Array of errors encountered during seeding (optional)
   */
  seedErrors?: string[];

  /**
   * Array of general errors encountered (optional)
   */
  errors?: string[];

  /**
   * Single error message (optional, for backward compatibility)
   */
  error?: string;
}
