/**
 * @fileoverview PresenceService - Infrastructure service for presence operations
 * @description Implements presence management operations
 */

import { IPresenceService } from '../../domain/interfaces/IPresenceService';
import { setUserOffline } from '../../services/presenceService';

/**
 * Service for presence operations
 */
export class PresenceService implements IPresenceService {
  /**
   * Sets a user offline
   * @param userEmail - User email address
   * @returns Promise that resolves when user is set offline
   */
  async setUserOffline(userEmail: string): Promise<void> {
    try {
      await setUserOffline(userEmail);
    } catch (error) {
      // Log error but don't throw - presence failures shouldn't break the main operation
      console.warn(`Failed to set user ${userEmail} offline:`, error);
    }
  }
}
