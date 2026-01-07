/**
 * @fileoverview GetSnapshotsRequest - Value object for snapshot retrieval requests
 * @summary Encapsulates snapshot retrieval request data
 * @description Value object representing a request to retrieve all snapshots
 */

/**
 * Value object representing a snapshot retrieval request
 * @description Encapsulates the caller ID for retrieving snapshots
 */
export class GetSnapshotsRequest {
  /**
   * Creates a new GetSnapshotsRequest instance
   * @param callerId - The Azure AD Object ID of the user making the request
   */
  constructor(
    public readonly callerId: string
  ) {}

  /**
   * Creates a GetSnapshotsRequest from caller ID
   * @param callerId - The Azure AD Object ID of the user making the request
   * @returns GetSnapshotsRequest instance
   */
  static fromCallerId(callerId: string): GetSnapshotsRequest {
    return new GetSnapshotsRequest(callerId);
  }
}
