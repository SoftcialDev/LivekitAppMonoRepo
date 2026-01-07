/**
 * @fileoverview GetErrorLogsDomainService - Domain service for error log query operations
 * @summary Handles error log query business logic
 * @description Contains the core business logic for querying API error logs
 */

import { IErrorLogRepository } from '../interfaces/IErrorLogRepository';
import { ErrorLogQueryParams } from '../types/ErrorLogTypes';
import { ApiErrorLog } from '../entities/ApiErrorLog';

/**
 * Domain service for error log query business logic
 * @description Handles the core business rules for querying API error logs
 */
export class GetErrorLogsDomainService {
  /**
   * Creates a new GetErrorLogsDomainService instance
   * @param errorLogRepository - Repository for error log data access
   */
  constructor(
    private readonly errorLogRepository: IErrorLogRepository
  ) {}

  /**
   * Retrieves error logs matching the specified query parameters
   * @param params - Query parameters for filtering and pagination
   * @returns Promise that resolves to an array of error log entities
   * @throws Error if the query operation fails
   */
  async getErrorLogs(params?: ErrorLogQueryParams): Promise<ApiErrorLog[]> {
    return await this.errorLogRepository.findMany(params);
  }

  /**
   * Counts error logs matching the specified query parameters (without pagination)
   * @param params - Query parameters for filtering (limit and offset are ignored)
   * @returns Promise that resolves to the total count
   * @throws Error if the query operation fails
   */
  async countErrorLogs(params?: Omit<ErrorLogQueryParams, 'limit' | 'offset'>): Promise<number> {
    return await this.errorLogRepository.count(params);
  }

  /**
   * Retrieves a single error log by its identifier
   * @param id - Error log identifier
   * @returns Promise that resolves to the error log entity or null if not found
   * @throws Error if the query operation fails
   */
  async getErrorLogById(id: string): Promise<ApiErrorLog | null> {
    return await this.errorLogRepository.findById(id);
  }

  /**
   * Marks an error log as resolved
   * @param id - Error log identifier
   * @param resolvedBy - User identifier who resolved the error
   * @returns Promise that resolves when the update is complete
   * @throws Error if the update operation fails
   */
  async markAsResolved(id: string, resolvedBy: string): Promise<void> {
    await this.errorLogRepository.markAsResolved(id, resolvedBy);
  }
}

