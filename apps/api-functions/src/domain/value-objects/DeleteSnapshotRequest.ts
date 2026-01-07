/**
 * @fileoverview DeleteSnapshotRequest - Value object for snapshot deletion requests
 * @summary Encapsulates snapshot deletion request data
 * @description Value object representing a request to delete a snapshot
 */

import { DeleteSnapshotParams } from "../schemas/DeleteSnapshotSchema";

/**
 * Value object representing a snapshot deletion request
 * @description Encapsulates the caller ID and snapshot ID for deletion
 */
export class DeleteSnapshotRequest {
  /**
   * Creates a new DeleteSnapshotRequest instance
   * @param callerId - The Azure AD Object ID of the user making the request
   * @param snapshotId - The ID of the snapshot to delete
   */
  constructor(
    public readonly callerId: string,
    public readonly snapshotId: string
  ) {}

  /**
   * Creates a DeleteSnapshotRequest from validated parameters
   * @param callerId - The Azure AD Object ID of the user making the request
   * @param params - Validated request parameters
   * @returns DeleteSnapshotRequest instance
   */
  static fromParams(callerId: string, params: DeleteSnapshotParams): DeleteSnapshotRequest {
    return new DeleteSnapshotRequest(callerId, params.id);
  }
}
