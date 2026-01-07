/**
 * @fileoverview SendSnapshotResponse - Value object for snapshot report responses
 * @summary Encapsulates snapshot report response data
 * @description Value object representing the response after sending a snapshot report
 */

/**
 * Value object representing a snapshot report response
 * @description Encapsulates the snapshot ID and success message
 */
export class SendSnapshotResponse {
  /**
   * Creates a new SendSnapshotResponse instance
   * @param snapshotId - The ID of the created snapshot record
   * @param message - Success message describing the snapshot report
   */
  constructor(
    public readonly snapshotId: string,
    public readonly message: string
  ) {}

  /**
   * Converts the response to a plain object for API response
   * @returns Plain object representation of the response
   */
  toPayload() {
    return {
      snapshotId: this.snapshotId,
      message: this.message
    };
  }
}
