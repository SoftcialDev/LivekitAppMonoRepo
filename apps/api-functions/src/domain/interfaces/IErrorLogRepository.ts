/**
 * @fileoverview IErrorLogRepository - Interface for error log data access
 * @description Defines the contract for error log repository operations
 */

import { ApiErrorLog } from '../entities/ApiErrorLog';
import { CreateErrorLogData, ErrorLogQueryParams } from '../types/ErrorLogTypes';

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
   * Deletes all error logs from the database
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if the database operation fails
   */
  deleteAll(): Promise<void>;

  /**
   * Counts error logs matching the specified query parameters (without pagination)
   * @param params - Query parameters for filtering (limit and offset are ignored)
   * @returns Promise that resolves to the total count of matching error logs
   * @throws Error if the database query fails
   */
  count(params?: Omit<ErrorLogQueryParams, 'limit' | 'offset'>): Promise<number>;
}

