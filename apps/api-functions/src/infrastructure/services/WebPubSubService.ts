/**
 * @fileoverview WebPubSubService - Infrastructure service for WebPubSub operations
 * @summary Implements WebPubSub service using Azure WebPubSub SDK
 * @description Infrastructure implementation of WebPubSub service for token generation and messaging
 */

import { WebPubSubServiceClient } from "@azure/web-pubsub";
import { AzureKeyCredential } from "@azure/core-auth";
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { wrapWebPubSubTokenError, wrapWebPubSubBroadcastError, wrapWebPubSubSyncError, extractErrorDetails } from '../../utils/error/ErrorHelpers';
import { WebPubSubGroups } from '../../domain/constants/WebPubSubGroups';
import { config } from '../../config';
import prisma from "../database/PrismaClientService";

/**
 * Infrastructure implementation of WebPubSub service
 * @description Provides WebPubSub operations using Azure WebPubSub SDK
 */
export class WebPubSubService implements IWebPubSubService {
  private readonly client: WebPubSubServiceClient;

  /**
   * Creates a new WebPubSubService instance
   */
  constructor() {
    const endpoint = config.webPubSubEndpoint;
    const accessKey = config.webPubSubKey;
    const hubName = config.webPubSubHubName;

    this.client = new WebPubSubServiceClient(
      endpoint,
      new AzureKeyCredential(accessKey),
      hubName
    );
  }

  /**
   * Generates a client access token for WebPubSub authentication
   * @param userId - The user identifier for the token
   * @param groups - The groups the user should be subscribed to
   * @returns Promise that resolves to the JWT token string
   * @throws Error when token generation fails
   * @example
   * const token = await webPubSubService.generateToken('user@example.com', ['presence', 'user@example.com']);
   */
  async generateToken(userId: string, groups: string[]): Promise<string> {
    try {
      const normalizedUser = userId.trim().toLowerCase();
      const normalizedGroups = groups.map(g => g.trim().toLowerCase());

      const tokenResponse = await this.client.getClientAccessToken({
        roles: ["webpubsub.joinLeaveGroup", "webpubsub.receive"],
        userId: normalizedUser,
        groups: normalizedGroups,
      });

      return tokenResponse.token;
    } catch (error: unknown) {
      throw wrapWebPubSubTokenError('Failed to generate WebPubSub token', error);
    }
  }

  /**
   * Broadcasts a presence event to all clients in the presence group
   * @param payload - The presence information to broadcast
   * @returns Promise that resolves when the broadcast is complete
   * @throws Error when broadcast fails
   * @example
   * await webPubSubService.broadcastPresence({
   *   email: 'user@example.com',
   *   fullName: 'John Doe',
   *   status: 'online',
   *   lastSeenAt: '2023-01-01T00:00:00Z'
   * });
   */
  async broadcastPresence(payload: {
    email: string;
    fullName: string;
    status: "online" | "offline";
    lastSeenAt: string;
    role?: string;
    supervisorId?: string | null;
    supervisorEmail?: string | null;
  }): Promise<void> {
    try {
      const event = { type: "presence", user: payload };
      await this.client.group(WebPubSubGroups.PRESENCE).sendToAll(JSON.stringify(event));
    } catch (error: unknown) {
      throw wrapWebPubSubBroadcastError('Failed to broadcast presence', error);
    }
  }

  /**
   * Broadcasts a custom message to all clients in a specific group
   * @param group - The group to broadcast to
   * @param message - The message to broadcast
   * @returns Promise that resolves when the broadcast is complete
   * @throws Error when broadcast fails
   * @example
   * await webPubSubService.broadcastMessage('presence', {
   *   type: 'contactManagerStatusChange',
   *   contactManager: { email: 'cm@example.com', status: 'Available' }
   * });
   */
  async broadcastMessage(group: string, message: Record<string, unknown>): Promise<void> {
    try {
      await this.client.group(group).sendToAll(JSON.stringify(message));
    } catch (error: unknown) {
      throw wrapWebPubSubBroadcastError(`Failed to broadcast message to group '${group}'`, error);
    }
  }

  /**
   * Lists all groups and users in the WebPubSub hub
   * @description Iterates through known groups (presence, livekit_agent_azure_pubsub, notifications, streaming)
   * and lists connections in each group
   * @returns Promise that resolves when listing is complete
   * @throws Error if listing operation fails
   */
  async listAllGroupsAndUsers(): Promise<void> {
    try {
      // 1. List presence group connections
      try {
        await this.listConnectionsInGroup(WebPubSubGroups.PRESENCE);
      } catch {
        // Failed to list presence group
      }
      
      // 2. List other known groups
      const otherGroups = ['livekit_agent_azure_pubsub', 'notifications', 'streaming'];
      
      for (const groupName of otherGroups) {
        try {
          await this.listConnectionsInGroup(groupName);
        } catch {
          // Group doesn't exist or error - this is normal
        }
      }
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Lists connections in a specific group
   * @param groupName - Name of the group to list connections for
   * @returns Promise that resolves to array of connections with connectionId and userId
   * @throws Error if listing connections fails
   */
  public async listConnectionsInGroup(groupName: string): Promise<Array<{connectionId: string, userId?: string}>> {
    try {
      const groupClient = this.client.group(groupName);
      const connections = await groupClient.listConnections();
      
      const result: Array<{connectionId: string, userId?: string}> = [];
      
      for await (const conn of connections) {
        result.push({
          connectionId: conn.connectionId || 'unknown',
          userId: conn.userId || undefined
        });
      }
      
      return result;
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Gets the list of active users connected to the 'presence' group
   * @returns Promise that resolves to array of active users with userId and userRoles
   * @throws WebPubSubSyncError if retrieving active users fails
   */
  async getActiveUsersInPresenceGroup(): Promise<Array<{ userId: string; userRoles: string[] }>> {
    try {
      const groupClient = this.client.group(WebPubSubGroups.PRESENCE);
      const connections = await groupClient.listConnections();
      
      const activeUsers: Array<{ userId: string; userRoles: string[] }> = [];
      
      for await (const conn of connections) {
        const connectionWithRoles = conn as { userId?: string; userRoles?: string[] };
        activeUsers.push({
          userId: connectionWithRoles.userId || 'unknown',
          userRoles: connectionWithRoles.userRoles || []
        });
      }
      
      return activeUsers;
    } catch (error: unknown) {
      throw wrapWebPubSubSyncError('Failed to get active users in presence group', error);
    }
  }

  /**
   * Updates user presence status in database
   * @param userId - User ID
   * @param userEmail - User email
   * @param status - Presence status ('online' or 'offline')
   * @param action - Action name for correction log
   * @param reason - Reason for correction
   * @param corrections - Array to push correction records
   * @param errors - Array to push error messages
   */
  private async updateUserPresenceStatus(
    userId: string,
    userEmail: string,
    status: 'online' | 'offline',
    action: 'mark_online' | 'mark_offline',
    reason: string,
    corrections: Array<{ email: string; action: string; reason: string }>,
    errors: string[]
  ): Promise<void> {
    try {
      await prisma.presence.upsert({
        where: { userId },
        update: { status, lastSeenAt: getCentralAmericaTime(), updatedAt: getCentralAmericaTime() },
        create: { userId, status, lastSeenAt: getCentralAmericaTime(), updatedAt: getCentralAmericaTime() }
      });
      corrections.push({
        email: userEmail,
        action,
        reason
      });
    } catch (error: unknown) {
      const { message } = extractErrorDetails(error);
      errors.push(`Failed to mark ${userEmail} ${status}: ${message}`);
    }
  }

  /**
   * Syncs all users between Web PubSub and Database
   * @description Compares users in WebPubSub presence group with database presence records
   * and corrects discrepancies (marks users online/offline as needed)
   * @returns Promise that resolves to sync results with corrected count, warnings, and errors
   * @throws WebPubSubSyncError if sync operation fails
   */
  async syncAllUsersWithDatabase(): Promise<{
    corrected: number;
    warnings: string[];
    errors: string[];
  }> {
    try {
      // 1. Get users from WebPubSub presence group
      const webPubSubUsers = new Set<string>();
      try {
        const presenceConnections = await this.listConnectionsInGroup('presence');
        presenceConnections.forEach((conn) => {
          if (conn.userId && conn.userId !== 'unknown') {
            webPubSubUsers.add(conn.userId);
          }
        });
      } catch {
        // Failed to get WebPubSub users
      }
      
      // 2. Get users from database
      const dbUsers = await prisma.user.findMany({
        where: { deletedAt: null },
        include: { presence: { select: { status: true } } }
      });
      
      // 3. Detect discrepancies and apply corrections
      const corrections: Array<{ email: string; action: string; reason: string }> = [];
      const warnings: string[] = [];
      const errors: string[] = [];
      
      for (const user of dbUsers) {
        const isInWebPubSub = webPubSubUsers.has(user.email);
        const isOnlineInDb = user.presence?.status === 'online';
        
        if (isInWebPubSub && !isOnlineInDb) {
          // User in WebPubSub but offline in DB → Mark online
          await this.updateUserPresenceStatus(
            user.id,
            user.email,
            'online',
            'mark_online',
            'Connected in WebPubSub but offline in DB',
            corrections,
            errors
          );
        } else if (!isInWebPubSub && isOnlineInDb) {
          // User online in DB but not in WebPubSub → Mark offline
          await this.updateUserPresenceStatus(
            user.id,
            user.email,
            'offline',
            'mark_offline',
            'Not in WebPubSub but online in DB',
            corrections,
            errors
          );
        }
      }
      
      return {
        corrected: corrections.length,
        warnings,
        errors
      };
    } catch (error: unknown) {
      throw wrapWebPubSubSyncError('Failed to sync users with database', error);
    }
  }

  /**
   * Debug function to test sync functionality
   * @description Executes sync operation and returns detailed debug information
   * including WebPubSub users and database users for comparison
   * @returns Promise that resolves to sync results with detailed logging information
   * @throws Error if debug sync operation fails
   */
  async debugSync(): Promise<{
    corrected: number;
    warnings: string[];
    errors: string[];
    webPubSubUsers: string[];
    dbUsers: Array<{ email: string; status: string }>;
  }> {
    try {
      const result = await this.syncAllUsersWithDatabase();
      
      // Get additional debug info
      const webPubSubUsers: string[] = [];
      try {
        const presenceConnections = await this.listConnectionsInGroup('presence');
        presenceConnections.forEach(conn => {
          if (conn.userId && conn.userId !== 'unknown') {
            webPubSubUsers.push(conn.userId);
          }
        });
      } catch {
        // Failed to get WebPubSub users for debug
      }

      const dbUsers = await prisma.user.findMany({
        where: { deletedAt: null },
        include: { presence: { select: { status: true } } }
      });

      const dbUsersDebug = dbUsers.map(user => ({
        email: user.email,
        status: user.presence?.status || 'no_presence'
      }));
      
      return {
        ...result,
        webPubSubUsers,
        dbUsers: dbUsersDebug
      };
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Broadcasts supervisor list changes (add/remove) to the presence group
   * @param payload - The supervisor list change data
   * @returns Promise that resolves when the broadcast is complete
   * @throws WebPubSubBroadcastError when broadcast fails
   * @example
   * await webPubSubService.broadcastSupervisorListChanged({
   *   email: 'supervisor@example.com',
   *   fullName: 'John Supervisor',
   *   action: 'added'
   * });
   */
  async broadcastSupervisorListChanged(payload: {
    email: string;
    fullName: string;
    action: 'added' | 'removed';
    azureAdObjectId?: string | null;
  }): Promise<void> {
    try {
      const message = {
        type: 'supervisor_list_changed',
        data: payload,
        timestamp: getCentralAmericaTime().toISOString(),
      };
      await this.client.group(WebPubSubGroups.PRESENCE).sendToAll(JSON.stringify(message));
    } catch (error: unknown) {
      throw wrapWebPubSubBroadcastError('Failed to broadcast supervisor list change', error);
    }
  }

  /**
   * Broadcasts supervisor change notifications to all users in the presence group
   * @param payload - The supervisor change notification data
   * @returns Promise that resolves when the broadcast is complete
   * @throws WebPubSubBroadcastError when broadcast fails
   * @example
   * await webPubSubService.broadcastSupervisorChangeNotification({
   *   psoEmails: ['pso1@example.com', 'pso2@example.com'],
   *   newSupervisorEmail: 'supervisor@example.com',
   *   newSupervisorName: 'John Supervisor',
   *   psoNames: ['PSO One', 'PSO Two']
   * });
   */
  async broadcastSupervisorChangeNotification(payload: {
    psoEmails: string[];
    oldSupervisorEmail?: string;
    newSupervisorEmail: string;
    newSupervisorId?: string;
    psoNames: string[];
    newSupervisorName: string;
  }): Promise<void> {
    try {
      const event = {
        type: "supervisor_change_notification",
        data: payload,
        timestamp: getCentralAmericaTime().toISOString()
      };
      
      await this.client.group(WebPubSubGroups.PRESENCE).sendToAll(JSON.stringify(event));
    } catch (error: unknown) {
      throw wrapWebPubSubBroadcastError('Failed to broadcast supervisor change notification', error);
    }
  }

  /**
   * Logs active users in the presence group and compares with database
   * @description Retrieves and logs active users from WebPubSub presence group
   * @returns Promise that resolves when logging is complete
   * @throws Error if logging operation fails
   */
  async logActiveUsersInPresenceGroup(): Promise<void> {
    try {
      await this.getActiveUsersInPresenceGroup();
    } catch (error: unknown) {
      throw error;
    }
  }
}