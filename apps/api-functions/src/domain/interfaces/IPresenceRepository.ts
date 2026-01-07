/**
 * @fileoverview IPresenceRepository - Interface for presence data operations
 * @summary Defines the contract for presence repository operations
 * @description Interface for presence data access operations
 */

import { Presence } from "../entities/Presence";
import { Status } from "../enums/Status";

/**
 * Interface for presence repository operations
 * @description Defines the contract for presence data access operations
 */
export interface IPresenceRepository {
  /**
   * Upserts a presence record for a user
   * @param userId - The unique identifier of the user
   * @param status - The presence status to set
   * @param lastSeenAt - When the user was last seen
   * @returns Promise that resolves when the operation completes
   * @throws Error if the operation fails
   */
  upsertPresence(userId: string, status: Status, lastSeenAt: Date): Promise<void>;

  /**
   * Finds presence by user ID
   * @param userId - The unique identifier of the user
   * @returns Promise that resolves to the presence or null if not found
   * @throws Error if the operation fails
   */
  findPresenceByUserId(userId: string): Promise<Presence | null>;

  /**
   * Creates a new presence history entry
   * @param userId - The unique identifier of the user
   * @param connectedAt - When the user connected
   * @returns Promise that resolves when the operation completes
   * @throws Error if the operation fails
   */
  createPresenceHistory(userId: string, connectedAt: Date): Promise<void>;

  /**
   * Closes any open presence history entry for a user
   * @param userId - The unique identifier of the user
   * @param disconnectedAt - When the user disconnected
   * @returns Promise that resolves when the operation completes
   * @throws Error if the operation fails
   */
  closeOpenPresenceHistory(userId: string, disconnectedAt: Date): Promise<void>;
}
