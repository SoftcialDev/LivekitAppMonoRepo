/**
 * @fileoverview DeleteErrorLogsRequest - Value object for error log deletion requests
 * @description Encapsulates error log deletion parameters
 */

/**
 * Value object representing a request to delete error logs
 */
export class DeleteErrorLogsRequest {
  public readonly ids: string[];

  /**
   * Creates a new DeleteErrorLogsRequest instance
   * @param ids - Array of error log identifiers to delete
   */
  private constructor(ids: string[]) {
    this.ids = ids;
  }

  /**
   * Creates a DeleteErrorLogsRequest from request body
   * @param body - Request body containing ids (single string or array of strings)
   * @returns DeleteErrorLogsRequest instance
   */
  static fromBody(body: { ids: string | string[] }): DeleteErrorLogsRequest {
    if (!body.ids) {
      throw new Error('Error log IDs are required');
    }

    const ids = Array.isArray(body.ids) ? body.ids : [body.ids];
    
    if (ids.length === 0) {
      throw new Error('At least one error log ID is required');
    }

    return new DeleteErrorLogsRequest(ids);
  }

  /**
   * Creates a DeleteErrorLogsRequest from query parameter (single ID)
   * @param id - Single error log identifier
   * @returns DeleteErrorLogsRequest instance
   */
  static fromId(id: string): DeleteErrorLogsRequest {
    if (!id) {
      throw new Error('Error log ID is required');
    }

    return new DeleteErrorLogsRequest([id]);
  }
}

