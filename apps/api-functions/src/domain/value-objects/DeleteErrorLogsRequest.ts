/**
 * @fileoverview DeleteErrorLogsRequest - Value object for error log deletion requests
 * @description Encapsulates error log deletion parameters
 */

import { ValidationError } from '../errors/DomainError';
import { ValidationErrorCode } from '../errors/ErrorCodes';

/**
 * Value object representing a request to delete error logs
 */
export class DeleteErrorLogsRequest {
  public readonly ids: string[];
  public readonly deleteAll: boolean;

  /**
   * Creates a new DeleteErrorLogsRequest instance
   * @param ids - Array of error log identifiers to delete
   * @param deleteAll - Whether to delete all error logs
   */
  private constructor(ids: string[], deleteAll: boolean = false) {
    this.ids = ids;
    this.deleteAll = deleteAll;
  }

  /**
   * Creates a DeleteErrorLogsRequest from request body
   * @param body - Request body containing ids (single string or array of strings) or deleteAll flag
   * @returns DeleteErrorLogsRequest instance
   */
  static fromBody(body: { ids?: string | string[]; deleteAll?: boolean }): DeleteErrorLogsRequest {
    if (body.deleteAll === true) {
      return new DeleteErrorLogsRequest([], true);
    }

    if (!body.ids) {
      throw new ValidationError('Error log IDs are required when deleteAll is not true', ValidationErrorCode.INVALID_EMAIL_FORMAT);
    }

    const ids = Array.isArray(body.ids) ? body.ids : [body.ids];
    
    if (ids.length === 0) {
      throw new ValidationError('At least one error log ID is required', ValidationErrorCode.INVALID_EMAIL_FORMAT);
    }

    return new DeleteErrorLogsRequest(ids, false);
  }

  /**
   * Creates a DeleteErrorLogsRequest from query parameter (single ID)
   * @param id - Single error log identifier
   * @returns DeleteErrorLogsRequest instance
   */
  static fromId(id: string): DeleteErrorLogsRequest {
    if (!id) {
      throw new ValidationError('Error log ID is required', ValidationErrorCode.INVALID_EMAIL_FORMAT);
    }

    return new DeleteErrorLogsRequest([id]);
  }
}

