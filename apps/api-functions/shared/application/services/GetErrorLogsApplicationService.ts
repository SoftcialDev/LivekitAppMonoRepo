/**
 * @fileoverview GetErrorLogsApplicationService - Application service for error log query operations
 * @summary Handles error log query application logic
 * @description Orchestrates error log query operations with authorization
 */

import { GetErrorLogsDomainService } from '../../domain/services/GetErrorLogsDomainService';
import { ErrorLogQueryParams } from '../../domain/interfaces/IErrorLogRepository';
import { ApiErrorLog } from '../../domain/entities/ApiErrorLog';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { AuthError } from '../../domain/errors/DomainError';
import { AuthErrorCode } from '../../domain/errors/ErrorCodes';

/**
 * Application service for error log query operations
 * @description Orchestrates error log queries with authorization checks
 */
export class GetErrorLogsApplicationService {
  /**
   * Creates a new GetErrorLogsApplicationService instance
   * @param getErrorLogsDomainService - Domain service for error log queries
   * @param userRepository - Repository for user data access
   */
  constructor(
    private readonly getErrorLogsDomainService: GetErrorLogsDomainService,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Authorizes access to error logs - only user with email containing "shanty.cerdas" is allowed
   * @param callerEmail - Email of the caller
   * @throws AuthError if caller is not authorized
   */
  private async authorizeAccess(callerEmail: string): Promise<void> {
    if (!callerEmail || !callerEmail.toLowerCase().includes('shanty.cerdas')) {
      throw new AuthError('Access denied: Only authorized user can access error logs', AuthErrorCode.INSUFFICIENT_PRIVILEGES);
    }
  }

  /**
   * Retrieves error logs matching the specified query parameters
   * @param callerEmail - Email of the caller for authorization
   * @param params - Query parameters for filtering and pagination
   * @returns Promise that resolves to an object with error logs and total count
   * @throws AuthError if caller is not authorized
   * @throws Error if the query operation fails
   */
  async getErrorLogs(callerEmail: string, params?: ErrorLogQueryParams): Promise<{ logs: ApiErrorLog[]; total: number }> {
    await this.authorizeAccess(callerEmail);
    const logs = await this.getErrorLogsDomainService.getErrorLogs(params);
    const total = await this.getErrorLogsDomainService.countErrorLogs(params);
    return { logs, total };
  }

  /**
   * Retrieves a single error log by its identifier
   * @param callerEmail - Email of the caller for authorization
   * @param id - Error log identifier
   * @returns Promise that resolves to the error log entity or null if not found
   * @throws AuthError if caller is not authorized
   * @throws Error if the query operation fails
   */
  async getErrorLogById(callerEmail: string, id: string): Promise<ApiErrorLog | null> {
    await this.authorizeAccess(callerEmail);
    return await this.getErrorLogsDomainService.getErrorLogById(id);
  }

  /**
   * Marks an error log as resolved
   * @param callerEmail - Email of the caller for authorization
   * @param id - Error log identifier
   * @param callerId - User identifier who resolved the error
   * @returns Promise that resolves when the update is complete
   * @throws AuthError if caller is not authorized
   * @throws Error if the update operation fails
   */
  async markAsResolved(callerEmail: string, id: string, callerId: string): Promise<void> {
    await this.authorizeAccess(callerEmail);
    await this.getErrorLogsDomainService.markAsResolved(id, callerId);
  }
}

