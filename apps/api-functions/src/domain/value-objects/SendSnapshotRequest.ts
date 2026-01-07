/**
 * @fileoverview SendSnapshotRequest.ts - Value object for snapshot report requests
 * @summary Encapsulates snapshot report request data
 * @description Value object representing a request to send a snapshot report
 * with a predefined reason and optional description.
 */

import { SendSnapshotParams } from "../schemas/SendSnapshotSchema";

/**
 * Value object representing a snapshot report request.
 * @description Encapsulates the caller ID, PSO email, predefined reason,
 * optional description, and image data for snapshot reports.
 */
export class SendSnapshotRequest {
  /**
   * Creates a new SendSnapshotRequest instance.
   * @param callerId - The Azure AD Object ID of the user making the request
   * @param psoEmail - The email of the PSO being reported
   * @param reason - The predefined reason for the snapshot report
   * @param description - Optional description, required when reason is "OTHER"
   * @param imageBase64 - The base64-encoded image data
   */
  constructor(
    public readonly callerId: string,
    public readonly psoEmail: string,
    public readonly reasonId: string,
    public readonly description: string | undefined,
    public readonly imageBase64: string
  ) {}

  /**
   * Creates a SendSnapshotRequest from validated parameters.
   * @param callerId - The Azure AD Object ID of the user making the request
   * @param params - Validated request parameters
   * @returns SendSnapshotRequest instance
   */
  static fromBody(callerId: string, params: SendSnapshotParams): SendSnapshotRequest {
    return new SendSnapshotRequest(
      callerId,
      params.psoEmail,
      params.reasonId,
      params.description,
      params.imageBase64
    );
  }
}
