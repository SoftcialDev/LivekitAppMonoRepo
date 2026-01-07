/**
 * @fileoverview PresenceUpdateResponse - Value object for presence update responses
 * @summary Encapsulates presence update response data
 * @description Represents the result of a presence update operation
 */

/**
 * Value object representing a presence update response
 * @description Encapsulates the success message for presence updates
 */
export class PresenceUpdateResponse {
  /**
   * Creates a new PresenceUpdateResponse instance
   * @param message - Success message for the presence update
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
      message: this.message,
    };
  }
}
