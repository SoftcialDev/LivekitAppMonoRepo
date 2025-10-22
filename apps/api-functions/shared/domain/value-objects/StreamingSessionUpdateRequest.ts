/**
 * @fileoverview StreamingSessionUpdateRequest - Value object for streaming session update requests
 * @summary Encapsulates streaming session update request data
 * @description Represents a request to update streaming session status
 */

import { StreamingSessionUpdateParams } from "../schemas/StreamingSessionUpdateSchema";
import { StreamingStatus } from "../enums/StreamingStatus";

/**
 * Value object representing a streaming session update request
 * @description Encapsulates the caller ID, status, and optional command flag
 */
export class StreamingSessionUpdateRequest {
  /**
   * Creates a new StreamingSessionUpdateRequest instance
   * @param callerId - The ID of the user making the request
   * @param status - The streaming status to set
   * @param isCommand - Optional flag indicating if this was triggered by a command
   * @param reason - Optional reason for the command (mainly for STOP commands)
   */
  constructor(
    public readonly callerId: string,
    public readonly status: StreamingStatus,
    public readonly isCommand?: boolean,
    public readonly reason?: string
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a StreamingSessionUpdateRequest from validated body parameters
   * @param callerId - The ID of the user making the request
   * @param params - Validated body parameters
   * @returns A new StreamingSessionUpdateRequest instance
   */
  static fromBody(callerId: string, params: StreamingSessionUpdateParams): StreamingSessionUpdateRequest {
    return new StreamingSessionUpdateRequest(
      callerId,
      params.status as StreamingStatus,
      params.isCommand,
      params.reason
    );
  }

  /**
   * Converts the request to a plain object for serialization
   * @returns Plain object representation of the request
   */
  toPayload(): { callerId: string; status: StreamingStatus; isCommand?: boolean; reason?: string } {
    return {
      callerId: this.callerId,
      status: this.status,
      isCommand: this.isCommand,
      reason: this.reason,
    };
  }
}
