/**
 * @fileoverview PresenceService - Infrastructure service for presence operations
 * @description Implements presence management operations
 */

import { IPresenceService } from '../../domain/interfaces/IPresenceService';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { PresenceDomainService } from '../../domain/services/PresenceDomainService';
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';

/**
 * Service for presence operations
 * @description Implements presence management operations using domain services
 */
export class PresenceService implements IPresenceService {
  /**
   * Creates a new PresenceService instance
   * @param userRepository - Repository for user data access
   * @param presenceDomainService - Domain service for presence operations
   * @param webPubSubService - Service for WebPubSub operations
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly presenceDomainService: PresenceDomainService,
    private readonly webPubSubService: IWebPubSubService
  ) {}

  /**
   * Sets a user offline
   * @param userEmail - User email address
   * @returns Promise that resolves when user is set offline
   */
  async setUserOffline(userEmail: string): Promise<void> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(userEmail);
      if (!user) {
        console.warn(`User not found for email: ${userEmail}`);
        return;
      }

      // Use domain service to set user offline
      await this.presenceDomainService.setUserOffline(user.id);
      
      console.log(`User ${userEmail} set offline successfully`);
    } catch (error) {
      // Log error but don't throw - presence failures shouldn't break the main operation
      console.warn(`Failed to set user ${userEmail} offline:`, error);
    }
  }
}
