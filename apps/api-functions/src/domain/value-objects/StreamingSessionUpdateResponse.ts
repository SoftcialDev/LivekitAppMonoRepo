/**
 * @fileoverview StreamingSessionUpdateResponse - Value object for streaming session update responses
 * @summary Encapsulates streaming session update response data
 * @description Represents the result of a streaming session update operation
 */

import { StreamingStatus } from "../enums/StreamingStatus";

/**
 * Value object representing a streaming session update response
 * @description Encapsulates the success message, status, and optional stop reason and stoppedAt timestamp
 */
export class StreamingSessionUpdateResponse {
  /**
   * Creates a new StreamingSessionUpdateResponse instance
   * @param message - Success message for the streaming session update
   * @param status - The streaming status that was set
   * @param stopReason - Optional stop reason for stopped sessions
   * @param stoppedAt - Optional stoppedAt timestamp (ISO string) for stopped sessions
   */
  constructor(
    public readonly message: string,
    public readonly status: StreamingStatus,
    public readonly stopReason?: string,
    public readonly stoppedAt?: string
  ) {}

  /**
   * Converts the response to a plain object for serialization
   * @returns Plain object representation of the response
   */
  toPayload(): { message: string; status: StreamingStatus; stopReason?: string; stoppedAt?: string } {
    return {
      message: this.message,
      status: this.status,
      stopReason: this.stopReason,
      stoppedAt: this.stoppedAt,
    };
  }
}
