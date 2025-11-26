/**
 * @fileoverview IErrorLogRepository - Interface for error log data access
 * @description Defines the contract for error log repository operations
 */

import { ErrorSeverity } from '../enums/ErrorSeverity';
import { ErrorSource } from '../enums/ErrorSource';
import { ApiErrorLog } from '../entities/ApiErrorLog';

/**
 * Data structure for creating a new error log entry
 */
export interface CreateErrorLogData {
  severity: ErrorSeverity;
  source: ErrorSource;
  endpoint?: string;
  functionName?: string;
  errorName?: string;
  errorMessage: string;
  stackTrace?: string;
  httpStatusCode?: number;
  userId?: string;
  requestId?: string;
  context?: Record<string, unknown>;
}

/**
 * Query parameters for filtering error logs
 */
export interface ErrorLogQueryParams {
  source?: ErrorSource;
  severity?: ErrorSeverity;
  endpoint?: string;
  resolved?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Interface for error log repository operations
 */
export interface IErrorLogRepository {
  /**
   * Creates a new error log entry in the database
   * @param data - Error log data to persist
   * @returns Promise that resolves to the created error log entity
   * @throws Error if the database operation fails
   */
  create(data: CreateErrorLogData): Promise<ApiErrorLog>;

  /**
   * Finds error logs matching the specified query parameters
   * @param params - Query parameters for filtering and pagination
   * @returns Promise that resolves to an array of error log entities
   * @throws Error if the database query fails
   */
  findMany(params?: ErrorLogQueryParams): Promise<ApiErrorLog[]>;

  /**
   * Finds an error log by its unique identifier
   * @param id - Error log identifier
   * @returns Promise that resolves to the error log entity or null if not found
   * @throws Error if the database query fails
   */
  findById(id: string): Promise<ApiErrorLog | null>;

  /**
   * Marks an error log as resolved
   * @param id - Error log identifier
   * @param resolvedBy - User identifier who resolved the error
   * @returns Promise that resolves when the update is complete
   * @throws Error if the database operation fails
   */
  markAsResolved(id: string, resolvedBy: string): Promise<void>;

  /**
   * Deletes an error log by its unique identifier
   * @param id - Error log identifier
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if the database operation fails
   */
  deleteById(id: string): Promise<void>;

  /**
   * Deletes multiple error logs by their identifiers
   * @param ids - Array of error log identifiers
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if the database operation fails
   */
  deleteMany(ids: string[]): Promise<void>;

  /**
   * Counts error logs matching the specified query parameters (without pagination)
   * @param params - Query parameters for filtering (limit and offset are ignored)
   * @returns Promise that resolves to the total count of matching error logs
   * @throws Error if the database query fails
   */
  count(params?: Omit<ErrorLogQueryParams, 'limit' | 'offset'>): Promise<number>;
}

