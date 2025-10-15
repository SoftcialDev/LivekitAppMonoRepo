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
    // 1. Find user
    const user = await this.findActiveUser(userId);
    const now = getCentralAmericaTime();

    // 2. Update presence to offline
    await this.presenceRepository.upsertPresence(user.id, Status.Offline, now);

    // 3. Close open history entry
    await this.presenceRepository.closeOpenPresenceHistory(user.id, now);

    // 4. Broadcast change
    await this.broadcastPresenceChange(user, Status.Offline, now);
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
  private async findActiveUser(key: string): Promise<{ id: string; email: string; fullName: string }> {
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

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName
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
    user: { email: string; fullName: string },
    status: Status,
    lastSeenAt: Date
  ): Promise<void> {
    const broadcast = {
      email: user.email,
      fullName: user.fullName,
      status: status,
      lastSeenAt: lastSeenAt.toISOString(),
    };

    await this.webPubSubService.broadcastPresence(broadcast);
  }
}
