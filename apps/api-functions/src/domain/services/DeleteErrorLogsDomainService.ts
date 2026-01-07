/**
 * @fileoverview DeleteErrorLogsDomainService - Domain service for error log deletion operations
 * @summary Handles error log deletion business logic
 * @description Contains the core business logic for deleting API error logs
 */

import { IErrorLogRepository } from '../interfaces/IErrorLogRepository';
import { NoErrorLogIdsProvidedError } from '../errors/ErrorLogErrors';

/**
 * Domain service for error log deletion business logic
 * @description Handles the core business rules for deleting API error logs
 */
export class DeleteErrorLogsDomainService {
  /**
   * Creates a new DeleteErrorLogsDomainService instance
   * @param errorLogRepository - Repository for error log data access
   */
  constructor(
    private readonly errorLogRepository: IErrorLogRepository
  ) {}

  /**
   * Deletes a single error log by its identifier
   * @param id - Error log identifier
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if the deletion operation fails
   */
  async deleteErrorLog(id: string): Promise<void> {
    await this.errorLogRepository.deleteById(id);
  }

  /**
   * Deletes multiple error logs by their identifiers
   * @param ids - Array of error log identifiers
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if the deletion operation fails
   */
  async deleteErrorLogs(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      throw new NoErrorLogIdsProvidedError();
    }

    if (ids.length === 1) {
      await this.errorLogRepository.deleteById(ids[0]);
    } else {
      await this.errorLogRepository.deleteMany(ids);
    }
  }

  /**
   * Deletes all error logs from the database
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if the deletion operation fails
   */
  async deleteAll(): Promise<void> {
    await this.errorLogRepository.deleteAll();
  }
}

