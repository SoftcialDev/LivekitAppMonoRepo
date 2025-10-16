/**
 * @fileoverview WebPubSubService - Infrastructure service for WebPubSub operations
 * @summary Implements WebPubSub service using Azure WebPubSub SDK
 * @description Infrastructure implementation of WebPubSub service for token generation and messaging
 */

import { WebPubSubServiceClient } from "@azure/web-pubsub";
import { AzureKeyCredential } from "@azure/core-auth";
import { IWebPubSubService } from "../../domain/interfaces/IWebPubSubService";
import { config } from "../../config";
import { getCentralAmericaTime } from "../../utils/dateUtils";
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
    } catch (error: any) {
      throw new Error(`Failed to generate WebPubSub token: ${error.message}`);
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
      console.log(`📡 [WebPubSubService] broadcastPresence: Starting broadcast for user ${payload.email} with status ${payload.status}`);
      
      const event = { type: "presence", user: payload };
      console.log(`📡 [WebPubSubService] broadcastPresence: Event to send:`, event);
      
      await this.client.group("presence").sendToAll(JSON.stringify(event));
      console.log(`📡 [WebPubSubService] broadcastPresence: Message sent successfully to presence group for user ${payload.email}`);
      console.debug("Presence broadcast:", event);
    } catch (error: any) {
      console.error(`📡 [WebPubSubService] broadcastPresence: Failed to send message for user ${payload.email}:`, error);
      throw new Error(`Failed to broadcast presence: ${error.message}`);
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
      console.debug(`Message broadcast to group '${group}':`, message);
    } catch (error: any) {
      throw new Error(`Failed to broadcast message to group '${group}': ${error.message}`);
    }
  }

  /**
   * Lists all groups and users in the WebPubSub hub
   * @returns Promise that resolves when listing is complete
   */
  async listAllGroupsAndUsers(): Promise<void> {
    try {
      console.log('🔍 Listing WebPubSub groups and users...');
      
      // 1. List presence group connections
      try {
        const presenceConnections = await this.listConnectionsInGroup('presence');
        console.log(`📊 Presence group: ${presenceConnections.length} connections`);
        
        if (presenceConnections.length > 0) {
          const userCounts = new Map<string, number>();
          presenceConnections.forEach(conn => {
            const userId = conn.userId || 'unknown';
            userCounts.set(userId, (userCounts.get(userId) || 0) + 1);
          });
          
          const sortedUsers = Array.from(userCounts.entries())
            .sort((a, b) => b[1] - a[1]);
          
          sortedUsers.forEach(([userId, count], index) => {
            const warningIcon = count > 10 ? '⚠️' : count > 5 ? '🔶' : '';
            console.log(`  ${index + 1}. ${userId} (${count} connections) ${warningIcon}`);
          });
        }
      } catch (error: any) {
        console.log('❌ Failed to list presence group:', error.message);
      }
      
      // 2. List other known groups
      const otherGroups = ['livekit_agent_azure_pubsub', 'notifications', 'streaming'];
      
      for (const groupName of otherGroups) {
        try {
          const connections = await this.listConnectionsInGroup(groupName);
          if (connections.length > 0) {
            console.log(`📊 ${groupName}: ${connections.length} connections`);
          }
        } catch (groupError: any) {
          // Group doesn't exist or error - this is normal
        }
      }
      
      console.log('✅ Successfully listed all groups and users');
    } catch (error: any) {
      console.error('❌ Failed to list groups and users:', error.message);
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
      console.error(`Failed to list connections in group "${groupName}":`, error);
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
      console.error('Error getting active users in presence group:', error);
      throw new Error(`Failed to get active users in presence group: ${error.message}`);
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
      console.log('🔄 [SYNC] Starting WebPubSub ↔ Database sync...');
      
      // 1. Get users from WebPubSub presence group
      const webPubSubUsers = new Set<string>();
      try {
        console.log('🔄 [SYNC] Getting connections from presence group...');
        const presenceConnections = await this.listConnectionsInGroup('presence');
        console.log(`🔄 [SYNC] Found ${presenceConnections.length} connections in presence group`);
        
        presenceConnections.forEach((conn, index) => {
          console.log(`🔄 [SYNC] Connection ${index + 1}: userId=${conn.userId}, connectionId=${conn.connectionId}`);
          if (conn.userId && conn.userId !== 'unknown') {
            webPubSubUsers.add(conn.userId);
          }
        });
        console.log(`🔄 [SYNC] WebPubSub presence group: ${webPubSubUsers.size} unique users`);
        console.log(`🔄 [SYNC] WebPubSub users:`, Array.from(webPubSubUsers));
      } catch (error: any) {
        console.error('🔄 [SYNC] Failed to get WebPubSub users:', error.message);
        console.error('🔄 [SYNC] WebPubSub error stack:', error.stack);
      }
      
      // 2. Get users from database
      console.log('🔄 [SYNC] Getting users from database...');
      const dbUsers = await prisma.user.findMany({
        where: { deletedAt: null },
        include: { presence: { select: { status: true } } }
      });
      console.log(`🔄 [SYNC] Database users: ${dbUsers.length} total`);
      
      // 3. Detect discrepancies and apply corrections
      console.log('🔄 [SYNC] Starting comparison and correction process...');
      const corrections = [];
      const warnings: string[] = [];
      const errors: string[] = [];
      
      for (const user of dbUsers) {
        const isInWebPubSub = webPubSubUsers.has(user.email);
        const isOnlineInDb = user.presence?.status === 'online';
        
        console.log(`🔄 [SYNC] Checking user: ${user.email}`);
        console.log(`🔄 [SYNC] - In WebPubSub: ${isInWebPubSub}`);
        console.log(`🔄 [SYNC] - Online in DB: ${isOnlineInDb}`);
        
        if (isInWebPubSub && !isOnlineInDb) {
          // User in WebPubSub but offline in DB → Mark online
          console.log(`🔄 [SYNC] CORRECTION: Marking ${user.email} online (in WebPubSub but offline in DB)`);
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
            console.log(`✅ [SYNC] Marked ${user.email} online`);
          } catch (error: any) {
            console.error(`❌ [SYNC] Failed to mark ${user.email} online:`, error.message);
            errors.push(`Failed to mark ${user.email} online: ${error.message}`);
          }
        } else if (!isInWebPubSub && isOnlineInDb) {
          // User online in DB but not in WebPubSub → Mark offline
          console.log(`🔄 [SYNC] CORRECTION: Marking ${user.email} offline (not in WebPubSub but online in DB)`);
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
            console.log(`✅ [SYNC] Marked ${user.email} offline`);
          } catch (error: any) {
            console.error(`❌ [SYNC] Failed to mark ${user.email} offline:`, error.message);
            errors.push(`Failed to mark ${user.email} offline: ${error.message}`);
          }
        } else {
          console.log(`✅ [SYNC] User ${user.email} is consistent (WebPubSub: ${isInWebPubSub}, DB: ${isOnlineInDb})`);
        }
      }
      
      console.log(`🔄 Sync completed: ${corrections.length} corrections, ${warnings.length} warnings, ${errors.length} errors`);
      
      return {
        corrected: corrections.length,
        warnings,
        errors
      };
    } catch (error: any) {
      console.error('Error syncing users with database:', error);
      throw new Error(`Failed to sync users with database: ${error.message}`);
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
    console.log('🔧 [DEBUG] Starting debug sync...');
    
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
      } catch (error) {
        console.error('🔧 [DEBUG] Failed to get WebPubSub users for debug:', error);
      }

      const dbUsers = await prisma.user.findMany({
        where: { deletedAt: null },
        include: { presence: { select: { status: true } } }
      });

      const dbUsersDebug = dbUsers.map(user => ({
        email: user.email,
        status: user.presence?.status || 'no_presence'
      }));

      console.log('🔧 [DEBUG] Debug sync completed');
      console.log('🔧 [DEBUG] WebPubSub users:', webPubSubUsers);
      console.log('🔧 [DEBUG] DB users:', dbUsersDebug);
      
      return {
        ...result,
        webPubSubUsers,
        dbUsers: dbUsersDebug
      };
    } catch (error: any) {
      console.error('🔧 [DEBUG] Debug sync failed:', error);
      throw error;
    }
  }

  /**
   * Logs active users in the presence group and compares with database
   * @returns Promise that resolves when logging is complete
   */
  async logActiveUsersInPresenceGroup(): Promise<void> {
    try {
      console.log('📊 Logging active users in presence group...');
      
      const activeUsers = await this.getActiveUsersInPresenceGroup();
      console.log(`📊 Active users in presence group: ${activeUsers.length}`);
      
      if (activeUsers.length > 0) {
        activeUsers.forEach((user, index) => {
          const roles = user.userRoles.length > 0 ? user.userRoles.join(', ') : 'No roles';
          console.log(`  ${index + 1}. ${user.userId} (${roles})`);
        });
      }
      
      // Compare with database
      try {
        const prisma = (await import('../database/PrismaClientService')).default;
        const dbUsers = await prisma.user.findMany({
          where: { deletedAt: null },
          include: { 
            presence: {
              select: {
                status: true,
                lastSeenAt: true
              }
            }
          }
        });
        
        const wsUserIds = new Set(activeUsers.map(u => u.userId));
        const dbOnlineUsers = dbUsers.filter(u => u.presence?.status === 'online');
        const dbOfflineUsers = dbUsers.filter(u => u.presence?.status === 'offline');
        
        console.log(`📊 Database: ${dbOnlineUsers.length} online, ${dbOfflineUsers.length} offline`);
        
        // Find discrepancies
        const wsOnlyUsers = [...wsUserIds].filter(userId => {
          const user = dbUsers.find(u => u.id === userId);
          return user && user.presence?.status !== 'online';
        });
        
        const dbOnlyUsers = dbOnlineUsers.filter(u => !wsUserIds.has(u.id));
        
        if (wsOnlyUsers.length > 0) {
          console.log(`⚠️ Users in WebPubSub but not online in DB: ${wsOnlyUsers.length}`);
        }
        
        if (dbOnlyUsers.length > 0) {
          console.log(`⚠️ Users online in DB but not in WebPubSub: ${dbOnlyUsers.length}`);
        }
        
        if (wsOnlyUsers.length === 0 && dbOnlyUsers.length === 0) {
          console.log('✅ WebPubSub and Database are in sync');
        }
      } catch (dbError: any) {
        console.error('Error comparing with database:', dbError.message);
      }
    } catch (error: any) {
      console.error('Error logging active users in presence group:', error);
      throw error;
    }
  }
}