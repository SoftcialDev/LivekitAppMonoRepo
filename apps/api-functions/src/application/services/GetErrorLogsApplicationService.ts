/**
 * @fileoverview GetErrorLogsApplicationService - Application service for error log query operations
 * @summary Handles error log query application logic
 * @description Orchestrates error log query operations with authorization
 */

import { GetErrorLogsDomainService } from '../../domain/services/GetErrorLogsDomainService';
import { ErrorLogQueryParams } from '../../domain/types/ErrorLogTypes';
import { ApiErrorLog } from '../../domain/entities/ApiErrorLog';

/**
 * Application service for error log query operations
 * @description Orchestrates error log queries with authorization checks
 */
export class GetErrorLogsApplicationService {
  /**
   * Creates a new GetErrorLogsApplicationService instance
   * @param getErrorLogsDomainService - Domain service for error log queries
   */
  constructor(
    private readonly getErrorLogsDomainService: GetErrorLogsDomainService
  ) {}

  /**
   * Retrieves error logs matching the specified query parameters
   * @param params - Query parameters for filtering and pagination
   * @returns Promise that resolves to an object with error logs and total count
   * @throws Error if the query operation fails
   */
  async getErrorLogs(params?: ErrorLogQueryParams): Promise<{ logs: ApiErrorLog[]; total: number }> {
    const logs = await this.getErrorLogsDomainService.getErrorLogs(params);
    const total = await this.getErrorLogsDomainService.countErrorLogs(params);
    return { logs, total };
  }

  /**
   * Retrieves a single error log by its identifier
   * @param id - Error log identifier
   * @returns Promise that resolves to the error log entity or null if not found
   * @throws Error if the query operation fails
   */
  async getErrorLogById(id: string): Promise<ApiErrorLog | null> {
    return await this.getErrorLogsDomainService.getErrorLogById(id);
  }

  /**
   * Marks an error log as resolved
   * @param id - Error log identifier
   * @param callerId - User identifier who resolved the error
   * @returns Promise that resolves when the update is complete
   * @throws Error if the update operation fails
   */
  async markAsResolved(id: string, callerId: string): Promise<void> {
    await this.getErrorLogsDomainService.markAsResolved(id, callerId);
  }
}

