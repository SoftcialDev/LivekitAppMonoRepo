/**
 * @fileoverview WebPubSubService - Infrastructure service for WebPubSub operations
 * @summary Implements WebPubSub service using Azure WebPubSub SDK
 * @description Infrastructure implementation of WebPubSub service for token generation and messaging
 */

import { WebPubSubServiceClient } from "@azure/web-pubsub";
import { AzureKeyCredential } from "@azure/core-auth";
import { IWebPubSubService } from '../../index';
import { config } from '../../index';
import { getCentralAmericaTime } from '../../index';
import prisma from "../database/PrismaClientService";
import { WebPubSubTokenError, WebPubSubBroadcastError, WebPubSubSyncError } from '../../index';

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
    } catch (error: any) {
      throw new WebPubSubTokenError(`Failed to generate WebPubSub token: ${error.message}`, error instanceof Error ? error : new Error(String(error)));
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
      await this.client.group("presence").sendToAll(JSON.stringify(event));
    } catch (error: any) {
      throw new WebPubSubBroadcastError(`Failed to broadcast presence: ${error.message}`, error instanceof Error ? error : new Error(String(error)));
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
  async broadcastMessage(group: string, message: any): Promise<void> {
    try {
      await this.client.group(group).sendToAll(JSON.stringify(message));
    } catch (error: any) {
      throw new WebPubSubBroadcastError(`Failed to broadcast message to group '${group}': ${error.message}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Lists all groups and users in the WebPubSub hub
   * @returns Promise that resolves when listing is complete
   */
  async listAllGroupsAndUsers(): Promise<void> {
    try {
      // 1. List presence group connections
      try {
        await this.listConnectionsInGroup('presence');
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
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Lists connections in a specific group
   * @param groupName - Name of the group to list connections for
   * @returns Promise that resolves to array of connections
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
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Gets the list of active users connected to the 'presence' group
   * @returns Promise that resolves to array of active users
   */
  async getActiveUsersInPresenceGroup(): Promise<Array<{ userId: string; userRoles: string[] }>> {
    try {
      const groupClient = this.client.group("presence");
      const connections = await groupClient.listConnections();
      
      const activeUsers: Array<{ userId: string; userRoles: string[] }> = [];
      
      for await (const conn of connections) {
        activeUsers.push({
          userId: conn.userId || 'unknown',
          userRoles: (conn as any).userRoles || []
        });
      }
      
      return activeUsers;
    } catch (error: any) {
      throw new WebPubSubSyncError(`Failed to get active users in presence group: ${error.message}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Syncs all users between Web PubSub and Database
   * @returns Promise that resolves to sync results
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
      const corrections = [];
      const warnings: string[] = [];
      const errors: string[] = [];
      
      for (const user of dbUsers) {
        const isInWebPubSub = webPubSubUsers.has(user.email);
        const isOnlineInDb = user.presence?.status === 'online';
        
        if (isInWebPubSub && !isOnlineInDb) {
          // User in WebPubSub but offline in DB → Mark online
          try {
            await prisma.presence.upsert({
              where: { userId: user.id },
              update: { status: 'online', lastSeenAt: getCentralAmericaTime(), updatedAt: getCentralAmericaTime() },
              create: { userId: user.id, status: 'online', lastSeenAt: getCentralAmericaTime(), updatedAt: getCentralAmericaTime() }
            });
            corrections.push({
              email: user.email,
              action: 'mark_online',
              reason: 'Connected in WebPubSub but offline in DB'
            });
          } catch (error: any) {
            errors.push(`Failed to mark ${user.email} online: ${error.message}`);
          }
        } else if (!isInWebPubSub && isOnlineInDb) {
          // User online in DB but not in WebPubSub → Mark offline
          try {
            await prisma.presence.upsert({
              where: { userId: user.id },
              update: { status: 'offline', lastSeenAt: getCentralAmericaTime(), updatedAt: getCentralAmericaTime() },
              create: { userId: user.id, status: 'offline', lastSeenAt: getCentralAmericaTime(), updatedAt: getCentralAmericaTime() }
            });
            corrections.push({
              email: user.email,
              action: 'mark_offline',
              reason: 'Not in WebPubSub but online in DB'
            });
          } catch (error: any) {
            errors.push(`Failed to mark ${user.email} offline: ${error.message}`);
          }
        }
      }
      
      return {
        corrected: corrections.length,
        warnings,
        errors
      };
    } catch (error: any) {
      throw new WebPubSubSyncError(`Failed to sync users with database: ${error.message}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Debug function to test sync functionality
   * @returns Promise that resolves to sync results with detailed logging
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
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Broadcasts supervisor list changes (add/remove) to the presence group.
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
      await this.client.group('presence').sendToAll(JSON.stringify(message));
    } catch (error: any) {
      throw new WebPubSubBroadcastError(`Failed to broadcast supervisor list change: ${error.message}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Broadcasts supervisor change notifications to all users in the presence group
   * @param payload - The supervisor change notification data
   * @returns Promise that resolves when the broadcast is complete
   * @throws Error when broadcast fails
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
      
      await this.client.group("presence").sendToAll(JSON.stringify(event));
    } catch (error: any) {
      throw new WebPubSubBroadcastError(`Failed to broadcast supervisor change notification: ${error.message}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Logs active users in the presence group and compares with database
   * @returns Promise that resolves when logging is complete
   */
  async logActiveUsersInPresenceGroup(): Promise<void> {
    try {
      await this.getActiveUsersInPresenceGroup();
    } catch (error: any) {
      throw error;
    }
  }
}