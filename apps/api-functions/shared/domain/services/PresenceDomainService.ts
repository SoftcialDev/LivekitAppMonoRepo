/**
 * @fileoverview PresenceDomainService - Domain service for presence operations
 * @summary Handles business logic for presence management
 * @description Encapsulates the business rules and operations for user presence management
 */

import { IPresenceRepository } from "../interfaces/IPresenceRepository";
import { IUserRepository } from "../interfaces/IUserRepository";
import { IWebPubSubService } from "../interfaces/IWebPubSubService";
import { Status } from "../enums/Status";
import { UserNotFoundError } from "../errors/UserErrors";
import { getCentralAmericaTime } from "../../utils/dateUtils";

/**
 * Domain service for handling presence operations
 * @description Encapsulates business logic for user presence management
 */
export class PresenceDomainService {
  /**
   * Creates a new PresenceDomainService instance
   * @param presenceRepository - Repository for presence data access
   * @param userRepository - Repository for user data access
   * @param webPubSubService - Service for WebPubSub broadcasting
   */
  constructor(
    private readonly presenceRepository: IPresenceRepository,
    private readonly userRepository: IUserRepository,
    private readonly webPubSubService: IWebPubSubService
  ) {}

  /**
   * Sets a user's presence to online
   * @param userId - The ID of the user to set online
   * @returns Promise that resolves when the operation completes
   * @throws UserNotFoundError when the user is not found
   * @example
   * await presenceDomainService.setUserOnline(userId);
   */
  async setUserOnline(userId: string): Promise<void> {
    // 1. Find user
    const user = await this.findActiveUser(userId);
    const now = getCentralAmericaTime();

    // 2. Update presence to online
    await this.presenceRepository.upsertPresence(user.id, Status.Online, now);

    // 3. Create presence history entry
    await this.presenceRepository.createPresenceHistory(user.id, now);

    // 4. Broadcast change
    await this.broadcastPresenceChange(user, Status.Online, now);
  }

  /**
   * Sets a user's presence to offline
   * @param userId - The ID of the user to set offline
   * @returns Promise that resolves when the operation completes
   * @throws UserNotFoundError when the user is not found
   * @example
   * await presenceDomainService.setUserOffline(userId);
   */
  async setUserOffline(userId: string): Promise<void> {
    console.log(`📊 [PresenceDomainService] setUserOffline: Starting for user ${userId}`);
    
    // 1. Find user
    const user = await this.findActiveUser(userId);
    const now = getCentralAmericaTime();
    console.log(`📊 [PresenceDomainService] setUserOffline: User found:`, {
      email: user.email,
      role: user.role,
      supervisorId: user.supervisorId,
      supervisorEmail: user.supervisorEmail
    });

    // 2. Update presence to offline
    console.log(`📊 [PresenceDomainService] setUserOffline: Updating presence to offline...`);
    await this.presenceRepository.upsertPresence(user.id, Status.Offline, now);
    console.log(`📊 [PresenceDomainService] setUserOffline: Presence updated successfully`);

    // 3. Close open history entry
    console.log(`📊 [PresenceDomainService] setUserOffline: Closing open history entry...`);
    await this.presenceRepository.closeOpenPresenceHistory(user.id, now);
    console.log(`📊 [PresenceDomainService] setUserOffline: History entry closed successfully`);

    // 4. Broadcast change
    console.log(`📊 [PresenceDomainService] setUserOffline: Broadcasting presence change...`);
    await this.broadcastPresenceChange(user, Status.Offline, now);
    console.log(`📊 [PresenceDomainService] setUserOffline: Broadcast completed successfully`);
  }

  /**
   * Gets the current presence status for a user
   * @param userId - The ID of the user to check
   * @returns Promise that resolves to the presence status
   * @throws UserNotFoundError when the user is not found
   * @example
   * const status = await presenceDomainService.getPresenceStatus(userId);
   */
  async getPresenceStatus(userId: string): Promise<Status> {
    const user = await this.findActiveUser(userId);
    const presence = await this.presenceRepository.findPresenceByUserId(user.id);
    return presence?.status ?? Status.Offline;
  }

  /**
   * Finds an active user by flexible key (ID, Azure AD Object ID, or email)
   * @param key - The user identifier (ID, Azure AD Object ID, or email)
   * @returns Promise that resolves to the user
   * @throws UserNotFoundError when the user is not found
   * @private
   */
  private async findActiveUser(key: string): Promise<{ id: string; email: string; fullName: string; role: string; supervisorId: string | null; supervisorEmail: string | null }> {
    // Try to find user by Azure AD Object ID first
    let user = await this.userRepository.findByAzureAdObjectId(key);
    
    if (!user) {
      // Try to find by database ID
      user = await this.userRepository.findById(key);
    }

    if (!user) {
      // Try to find by email
      user = await this.userRepository.findByEmail(key);
    }

    if (!user) {
      throw new UserNotFoundError(`User not found for presence operation (${key})`);
    }

    // Get supervisor email if supervisorId exists
    let supervisorEmail: string | null = null;
    if (user.supervisorId) {
      try {
        const supervisor = await this.userRepository.findById(user.supervisorId);
        supervisorEmail = supervisor?.email || null;
      } catch (error) {
        console.warn(`Failed to get supervisor email for user ${user.email}:`, error);
      }
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      supervisorId: user.supervisorId,
      supervisorEmail
    };
  }

  /**
   * Broadcasts presence changes to connected clients
   * @param user - The user information
   * @param status - The new presence status
   * @param lastSeenAt - When the user was last seen
   * @private
   */
  private async broadcastPresenceChange(
    user: { email: string; fullName: string; role: string; supervisorId: string | null; supervisorEmail: string | null },
    status: Status,
    lastSeenAt: Date
  ): Promise<void> {
    console.log(`📢 [PresenceDomainService] broadcastPresenceChange: Starting broadcast for user ${user.email} with status ${status}`);
    
    const broadcast = {
      email: user.email,
      fullName: user.fullName,
      status: status,
      lastSeenAt: lastSeenAt.toISOString(),
      role: user.role,
      supervisorId: user.supervisorId,
      supervisorEmail: user.supervisorEmail,
    };

    console.log(`📢 [PresenceDomainService] broadcastPresenceChange: Broadcast payload:`, broadcast);
    
    try {
      await this.webPubSubService.broadcastPresence(broadcast);
      console.log(`📢 [PresenceDomainService] broadcastPresenceChange: Broadcast sent successfully for user ${user.email}`);
    } catch (error: any) {
      console.error(`📢 [PresenceDomainService] broadcastPresenceChange: Failed to broadcast for user ${user.email}:`, error);
      throw error;
    }
  }
}
