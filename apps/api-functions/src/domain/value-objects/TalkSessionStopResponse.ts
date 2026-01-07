/**
 * @fileoverview TalkSessionStopResponse - Value object for talk session stop responses
 * @summary Encapsulates talk session stop response data
 * @description Represents the result of a talk session stop operation
 */

/**
 * Value object representing a talk session stop response
 * @description Encapsulates the success message
 */
export class TalkSessionStopResponse {
  /**
   * Creates a new TalkSessionStopResponse instance
   * @param message - Success message for the talk session stop
   */
  constructor(
    public readonly message: string
  ) {}

  /**
   * Converts the response to a plain object for serialization
   * @returns Plain object representation of the response
   */
  toPayload(): { message: string } {
    return {
      message: this.message
    };
  }
}

