/**
 * @fileoverview DeleteSnapshotResponse - Value object for snapshot deletion responses
 * @summary Encapsulates snapshot deletion response data
 * @description Value object representing the response after deleting a snapshot
 */

/**
 * Value object representing a snapshot deletion response
 * @description Encapsulates the deleted snapshot ID and success message
 */
export class DeleteSnapshotResponse {
  /**
   * Creates a new DeleteSnapshotResponse instance
   * @param deletedId - The ID of the deleted snapshot
   * @param message - Success message describing the deletion
   */
  constructor(
    public readonly deletedId: string,
    public readonly message: string
  ) {}

  /**
   * Converts the response to a plain object for API response
   * @returns Plain object representation of the response
   */
  toPayload() {
    return {
      deletedId: this.deletedId,
      message: this.message
    };
  }
}
