/**
 * @fileoverview GetSnapshotsResponse - Value object for snapshot retrieval responses
 * @summary Encapsulates snapshot retrieval response data
 * @description Value object representing the response after retrieving snapshots
 */

import { SnapshotReport } from "./SnapshotReport";

/**
 * Value object representing a snapshot retrieval response
 * @description Encapsulates the list of snapshot reports
 */
export class GetSnapshotsResponse {
  /**
   * Creates a new GetSnapshotsResponse instance
   * @param reports - Array of snapshot reports
   */
  constructor(
    public readonly reports: SnapshotReport[]
  ) {}

  /**
   * Converts the response to a plain object for API response
   * @returns Plain object representation of the response
   */
  toPayload() {
    return {
      reports: this.reports
    };
  }
}
