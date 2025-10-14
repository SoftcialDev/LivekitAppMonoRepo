/**
 * @fileoverview ILiveKitService - Interface for LiveKit operations
 * @summary Defines the contract for LiveKit service operations
 * @description Interface for LiveKit room management and token generation
 */

/**
 * Interface for LiveKit service operations
 * @description Defines the contract for LiveKit room and token operations
 */
export interface ILiveKitService {
  /**
   * Ensures that a LiveKit room exists
   * @param roomName - The unique name for the room to create or verify
   * @returns Promise that resolves once the room is ensured to exist
   * @throws Error if room creation fails
   */
  ensureRoom(roomName: string): Promise<void>;

  /**
   * Retrieves a list of all existing LiveKit rooms
   * @returns Promise that resolves to an array of room names
   * @throws Error if the operation fails
   */
  listRooms(): Promise<string[]>;

  /**
   * Generates a JWT access token for a participant to join a LiveKit room
   * @param identity - A unique identifier for the user
   * @param isAdmin - Whether to grant admin-level permissions
   * @param room - The name or ID of the room the token applies to
   * @returns Promise that resolves to the signed JWT access token
   * @throws Error if token generation fails
   */
  generateToken(identity: string, isAdmin: boolean, room: string): Promise<string>;
}
