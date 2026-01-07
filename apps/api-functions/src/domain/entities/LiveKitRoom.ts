/**
 * @fileoverview LiveKitRoom - Domain entity for LiveKit rooms
 * @summary Represents a LiveKit room with token
 * @description Encapsulates a LiveKit room with its access token
 */

/**
 * Domain entity representing a LiveKit room
 * @description Encapsulates a LiveKit room with its name and access token
 */
export class LiveKitRoom {
  /**
   * Creates a new LiveKitRoom instance
   * @param name - The unique name of the room
   * @param token - The JWT access token for the room
   */
  constructor(
    public readonly name: string,
    public readonly token: string
  ) {}

  /**
   * Converts the room to a plain object for serialization
   * @returns Plain object representation of the room
   */
  toPayload(): { room: string; token: string } {
    return {
      room: this.name,
      token: this.token,
    };
  }
}
