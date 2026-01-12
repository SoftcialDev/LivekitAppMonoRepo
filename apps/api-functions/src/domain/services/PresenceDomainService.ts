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
import { getCentralAmericaTime } from '../../utils/dateUtils';

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
   * @param context - Optional Azure Functions context for logging
   * @returns Promise that resolves when the operation completes
   * @throws UserNotFoundError when the user is not found
   * @example
   * await presenceDomainService.setUserOffline(userId, context);
   */
  async setUserOffline(userId: string, context?: Record<string, unknown>): Promise<void> {
    try {
      // 1. Find user
      const user = await this.findActiveUser(userId);
      const now = getCentralAmericaTime();

      // 2. Update presence to offline
      await this.presenceRepository.upsertPresence(user.id, Status.Offline, now);

      // 3. Close open history entry
      await this.presenceRepository.closeOpenPresenceHistory(user.id, now);

      // 4. Broadcast change
      await this.broadcastPresenceChange(user, Status.Offline, now, context);
    } catch (error: unknown) {
      throw error;
    }
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
    // Check if key is an email (contains @) or UUID (contains -)
    const isEmail = key.includes('@');
    const isUUID = key.includes('-') && !key.includes('@');
    
    let user = null;
    
    if (isEmail) {
      // If it's an email, try to find by email first
      user = await this.userRepository.findByEmail(key);
    } else if (isUUID) {
      // If it's a UUID, try Azure AD Object ID first, then database ID
      user = await this.userRepository.findByAzureAdObjectId(key);
      
      user ??= await this.userRepository.findById(key);
    } else {
      // Fallback: try all methods in order
      user = await this.userRepository.findByAzureAdObjectId(key);
      
      user ??= await this.userRepository.findById(key);
      
      user ??= await this.userRepository.findByEmail(key);
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
      } catch {
        // Failed to get supervisor email
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
   * @param context - Optional Azure Functions context for logging
   * @private
   */
  private async broadcastPresenceChange(
    user: { email: string; fullName: string; role: string; supervisorId: string | null; supervisorEmail: string | null },
    status: Status,
    lastSeenAt: Date,
    context?: Record<string, unknown>
  ): Promise<void> {
    const broadcast = {
      email: user.email,
      fullName: user.fullName,
      status: status,
      lastSeenAt: lastSeenAt.toISOString(),
      role: user.role,
      supervisorId: user.supervisorId,
      supervisorEmail: user.supervisorEmail,
    };
    
    try {
      await this.webPubSubService.broadcastPresence(broadcast);
    } catch (error: unknown) {
      throw error;
    }
  }
}
