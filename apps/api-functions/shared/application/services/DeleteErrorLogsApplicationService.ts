/**
 * @fileoverview DeleteErrorLogsApplicationService - Application service for error log deletion operations
 * @summary Handles error log deletion application logic
 * @description Orchestrates error log deletion operations with authorization
 */

import { DeleteErrorLogsDomainService } from '../../domain/services/DeleteErrorLogsDomainService';
import { AuthError } from '../../domain/errors/DomainError';
import { AuthErrorCode } from '../../domain/errors/ErrorCodes';

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
   * Authorizes access to delete error logs - only user with email "shanty" is allowed
   * @param callerEmail - Email of the caller
   * @throws AuthError if caller is not authorized
   */
  private async authorizeAccess(callerEmail: string): Promise<void> {
    if (!callerEmail || callerEmail.toLowerCase() !== 'shanty') {
      throw new AuthError('Access denied: Only authorized user can delete error logs', AuthErrorCode.INSUFFICIENT_PRIVILEGES);
    }
  }

  /**
   * Deletes error logs by their identifiers (supports single or batch deletion)
   * @param callerEmail - Email of the caller for authorization
   * @param ids - Array of error log identifiers to delete
   * @returns Promise that resolves when the deletion is complete
   * @throws AuthError if caller is not authorized
   * @throws Error if the deletion operation fails
   */
  async deleteErrorLogs(callerEmail: string, ids: string[]): Promise<void> {
    await this.authorizeAccess(callerEmail);
    await this.deleteErrorLogsDomainService.deleteErrorLogs(ids);
  }
}

