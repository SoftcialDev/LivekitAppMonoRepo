/**
 * @fileoverview DeleteErrorLogsApplicationService - Application service for error log deletion operations
 * @summary Handles error log deletion application logic
 * @description Orchestrates error log deletion operations with authorization
 */

import { DeleteErrorLogsDomainService } from '../../domain/services/DeleteErrorLogsDomainService';

/**
 * Application service for error log deletion operations
 * @description Orchestrates error log deletions with authorization checks
 */
export class DeleteErrorLogsApplicationService {
  /**
   * Creates a new DeleteErrorLogsApplicationService instance
   * @param deleteErrorLogsDomainService - Domain service for error log deletions
   */
  constructor(
    private readonly deleteErrorLogsDomainService: DeleteErrorLogsDomainService
  ) {}

  /**
   * Deletes error logs by their identifiers (supports single or batch deletion)
   * @param ids - Array of error log identifiers to delete
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if the deletion operation fails
   */
  async deleteErrorLogs(ids: string[]): Promise<void> {
    // Permission check is done at middleware level
    await this.deleteErrorLogsDomainService.deleteErrorLogs(ids);
  }

  /**
   * Deletes all error logs from the database
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if the deletion operation fails
   */
  async deleteAll(): Promise<void> {
    // Permission check is done at middleware level
    await this.deleteErrorLogsDomainService.deleteAll();
  }
}

