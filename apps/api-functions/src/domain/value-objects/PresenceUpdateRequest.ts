/**
 * @fileoverview PresenceUpdateRequest - Value object for presence update requests
 * @summary Encapsulates presence update request data
 * @description Represents a request to update user presence status
 */

import { PresenceUpdateParams } from "../schemas/PresenceUpdateSchema";
import { Status } from "../enums/Status";
import { Platform } from "../enums/Platform";

/**
 * Value object representing a presence update request
 * @description Encapsulates the caller ID, status, and optional platform for presence updates
 */
export class PresenceUpdateRequest {
  /**
   * Creates a new PresenceUpdateRequest instance
   * @param callerId - The ID of the user making the request
   * @param status - The presence status to set
   * @param platform - Optional platform identifier (electron or browser)
   */
  constructor(
    public readonly callerId: string,
    public readonly status: Status,
    public readonly platform?: Platform
  ) {}

  /**
   * Creates a PresenceUpdateRequest from validated body parameters
   * @param callerId - The ID of the user making the request
   * @param params - Validated body parameters
   * @returns A new PresenceUpdateRequest instance
   */
  static fromBody(callerId: string, params: PresenceUpdateParams): PresenceUpdateRequest {
    const platform = params.platform ? (params.platform as Platform) : undefined;
    return new PresenceUpdateRequest(callerId, params.status as Status, platform);
  }

  /**
   * Converts the request to a plain object for serialization
   * @returns Plain object representation of the request
   */
  toPayload(): { callerId: string; status: Status; platform?: Platform } {
    return {
      callerId: this.callerId,
      status: this.status,
      platform: this.platform,
    };
  }
}
