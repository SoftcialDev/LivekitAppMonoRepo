/**
 * @fileoverview PresenceUpdateRequest - Value object for presence update requests
 * @summary Encapsulates presence update request data
 * @description Represents a request to update user presence status
 */

import { PresenceUpdateParams } from "../schemas/PresenceUpdateSchema";
import { Status } from "../enums/Status";

/**
 * Value object representing a presence update request
 * @description Encapsulates the caller ID and status for presence updates
 */
export class PresenceUpdateRequest {
  /**
   * Creates a new PresenceUpdateRequest instance
   * @param callerId - The ID of the user making the request
   * @param status - The presence status to set
   */
  constructor(
    public readonly callerId: string,
    public readonly status: Status
  ) {}

  /**
   * Creates a PresenceUpdateRequest from validated body parameters
   * @param callerId - The ID of the user making the request
   * @param params - Validated body parameters
   * @returns A new PresenceUpdateRequest instance
   */
  static fromBody(callerId: string, params: PresenceUpdateParams): PresenceUpdateRequest {
    return new PresenceUpdateRequest(callerId, params.status as Status);
  }

  /**
   * Converts the request to a plain object for serialization
   * @returns Plain object representation of the request
   */
  toPayload(): { callerId: string; status: Status } {
    return {
      callerId: this.callerId,
      status: this.status,
    };
  }
}
