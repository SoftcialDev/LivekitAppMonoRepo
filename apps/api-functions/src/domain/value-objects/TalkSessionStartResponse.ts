/**
 * @fileoverview TalkSessionStartResponse - Value object for talk session start responses
 * @summary Encapsulates talk session start response data
 * @description Represents the result of a talk session start operation
 */

/**
 * Value object representing a talk session start response
 * @description Encapsulates the talk session ID and success message
 */
export class TalkSessionStartResponse {
  /**
   * Creates a new TalkSessionStartResponse instance
   * @param talkSessionId - The ID of the created talk session
   * @param message - Success message for the talk session start
   */
  constructor(
    public readonly talkSessionId: string,
    public readonly message: string
  ) {}

  /**
   * Converts the response to a plain object for serialization
   * @returns Plain object representation of the response
   */
  toPayload(): { talkSessionId: string; message: string } {
    return {
      talkSessionId: this.talkSessionId,
      message: this.message
    };
  }
}

