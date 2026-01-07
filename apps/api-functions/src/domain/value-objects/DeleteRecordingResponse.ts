/**
 * @fileoverview DeleteRecordingResponse - Value object for delete recording responses
 * @summary Encapsulates delete recording response data
 * @description Represents the result of a recording deletion operation
 */

/**
 * Value object representing a delete recording response
 * @description Encapsulates the result of deleting a recording session
 */
export class DeleteRecordingResponse {
  /**
   * Creates a new DeleteRecordingResponse instance
   * @param message - Success message for the deletion operation
   * @param sessionId - The ID of the deleted recording session
   * @param blobPath - The path of the deleted blob (if any)
   * @param blobDeleted - Whether the blob was successfully deleted
   * @param blobMissing - Whether the blob was missing (not an error)
   * @param dbDeleted - Whether the database record was successfully deleted
   */
  constructor(
    public readonly message: string,
    public readonly sessionId: string,
    public readonly blobPath?: string | null,
    public readonly blobDeleted: boolean = false,
    public readonly blobMissing: boolean = false,
    public readonly dbDeleted: boolean = false
  ) {}

  /**
   * Converts the response to a plain object for serialization
   * @returns Plain object representation of the response
   */
  toPayload(): {
    message: string;
    sessionId: string;
    blobPath?: string | null;
    blobDeleted: boolean;
    blobMissing: boolean;
    dbDeleted: boolean;
  } {
    return {
      message: this.message,
      sessionId: this.sessionId,
      blobPath: this.blobPath,
      blobDeleted: this.blobDeleted,
      blobMissing: this.blobMissing,
      dbDeleted: this.dbDeleted,
    };
  }
}
