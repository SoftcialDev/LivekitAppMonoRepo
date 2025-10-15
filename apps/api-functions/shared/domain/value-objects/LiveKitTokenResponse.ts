/**
 * @fileoverview LiveKitTokenResponse - Value object for LiveKit token responses
 * @summary Encapsulates LiveKit token response data
 * @description Represents the result of a LiveKit token generation operation
 */

/**
 * Value object representing a LiveKit token response
 * @description Encapsulates the generated tokens and LiveKit URL for room access
 */
export class LiveKitTokenResponse {
  /**
   * Creates a new LiveKitTokenResponse instance
   * @param rooms - Array of room and token pairs
   * @param livekitUrl - The LiveKit server URL
   */
  constructor(
    public readonly rooms: Array<{ room: string; token: string }>,
    public readonly livekitUrl: string
  ) {}

  /**
   * Converts the response to a plain object for serialization
   * @returns Plain object representation of the response
   */
  toPayload(): {
    rooms: Array<{ room: string; token: string }>;
    livekitUrl: string;
  } {
    return {
      rooms: this.rooms,
      livekitUrl: this.livekitUrl,
    };
  }
}
