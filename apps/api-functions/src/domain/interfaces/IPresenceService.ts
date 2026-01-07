/**
 * @fileoverview IPresenceService - Domain interface for presence operations
 * @description Defines the contract for presence management operations
 */

/**
 * Interface for presence service operations
 */
export interface IPresenceService {
  /**
   * Sets a user offline
   * @param userEmail - User email address
   * @returns Promise that resolves when user is set offline
   */
  setUserOffline(userEmail: string): Promise<void>;
}
