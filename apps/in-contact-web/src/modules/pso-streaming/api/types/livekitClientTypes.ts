/**
 * @fileoverview LiveKit client types
 * @summary Type definitions for LiveKit API client
 * @description Type definitions for LiveKit token operations
 */

/**
 * Each entry contains the room's name/ID and the JWT scoped to that single room.
 */
export interface RoomWithToken {
  /** The LiveKit room name or identifier */
  room: string;
  /** JWT allowing the client to join the specified room */
  token: string;
}

/**
 * New shape of the LiveKit token API response.
 */
export interface LiveKitTokenResponse {
  /** One `{ room, token }` per room the caller may join. */
  rooms: RoomWithToken[];
  /** Base URL of the LiveKit WS endpoint. */
  livekitUrl: string;
}

