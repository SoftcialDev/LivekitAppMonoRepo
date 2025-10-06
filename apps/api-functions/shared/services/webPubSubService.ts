import { WebPubSubServiceClient } from "@azure/web-pubsub";
import { AzureKeyCredential } from "@azure/core-auth";
import { config } from "../config";

/**
 * Singleton WebPubSubServiceClient configured with endpoint, credential, and hub name.
 */
const wpsClient = new WebPubSubServiceClient(
  config.webPubSubEndpoint,
  new AzureKeyCredential(config.webPubSubKey),
  config.webPubSubHubName
);

/**
 * Options for generating a client access token.
 */
export interface WebPubSubTokenOptions {
  /** Unique identifier for this client (will become the Web PubSub userId) */
  userId: string;
  /** List of groups this client should join */
  groups: string[];
}

/**
 * Generates a client access token for a user to connect to Web PubSub.
 *
 * @param opts.userId - The normalized user identifier (e.g. an employee email).
 * @param opts.groups - The list of group names to subscribe to.
 * @returns A Promise that resolves to a JWT token string for authentication.
 * @throws Propagates any errors from the Web PubSub SDK.
 */
export async function generateWebPubSubToken(
  opts: WebPubSubTokenOptions
): Promise<string> {
  const normalizedUser = opts.userId.trim().toLowerCase();
  const normalizedGroups = opts.groups.map(g => g.trim().toLowerCase());

  const wpsClient = new WebPubSubServiceClient(
    config.webPubSubEndpoint,
    new AzureKeyCredential(config.webPubSubKey),
    config.webPubSubHubName
  );

  const tokenResponse = await wpsClient.getClientAccessToken({
    roles:  ["webpubsub.joinLeaveGroup", "webpubsub.receive"],
    userId: normalizedUser,
    groups: normalizedGroups,
  });

  return tokenResponse.token;
}
/**
 * Broadcasts a JSON-serializable payload to all clients in the specified group.
 *
 * @param groupName - The name of the target group (e.g., an employee's email).
 * @param payload - The data to send; must be JSON-serializable.
 * @returns A Promise that resolves when the broadcast completes.
 * @throws Propagates any errors from the Web PubSub SDK.
 */
export async function sendToGroup(
  groupName: string,
  payload: unknown
): Promise<void> {
  const groupClient = wpsClient.group(groupName);
  await groupClient.sendToAll(JSON.stringify(payload));
  console.debug(`Broadcast to group '${groupName}'`, payload);
}

/**
 * Sends a presence event to all clients in the global 'presence' group.
 *
 * @param payload - The presence information: email, fullName, status, lastSeenAt.
 * @returns A Promise that resolves when the presence event is broadcast.
 * @throws Propagates any errors from the Web PubSub SDK.
 */
export async function broadcastPresence(
  payload: {
    email: string;
    fullName: string;
    status: "online" | "offline";
    lastSeenAt: string;
  }
): Promise<void> {
  const event = { type: "presence", user: payload };
  await wpsClient.group("presence").sendToAll(JSON.stringify(event));
  console.debug("Presence broadcast:", event);
}

/**
 * Gets the list of active users connected to the 'presence' group.
 *
 * @returns Promise<Array<{userId: string, userRoles: string[]}>>
 * @throws Error when unable to retrieve group information
 */
export async function getActiveUsersInPresenceGroup(): Promise<Array<{ userId: string; userRoles: string[] }>> {
  try {
    console.log('[DEBUG] Getting group client for "presence"...');
    const groupClient = wpsClient.group("presence");
    
    console.log('[DEBUG] Calling listConnections() on presence group...');
    const connections = await groupClient.listConnections();
    
    console.log('[DEBUG] listConnections() returned:', typeof connections);
    
    const activeUsers: Array<{ userId: string; userRoles: string[] }> = [];
    let connectionCount = 0;
    
    console.log('[DEBUG] Iterating through connections...');
    for await (const conn of connections) {
      connectionCount++;
      console.log(`[DEBUG] Connection ${connectionCount}:`, {
        userId: conn.userId,
        userRoles: (conn as any).userRoles,
        connectionId: (conn as any).connectionId
      });
      
      activeUsers.push({
        userId: conn.userId || 'unknown',
        userRoles: (conn as any).userRoles || []
      });
    }
    
    console.log(`[DEBUG] Total connections found: ${connectionCount}`);
    console.log(`[DEBUG] Active users array length: ${activeUsers.length}`);
    
    return activeUsers;
  } catch (error: any) {
    console.error('[WebPubSubService] Error getting active users in presence group:', error);
    throw new Error(`Failed to get active users in presence group: ${error.message}`);
  }
}

/**
 * Lists users in specific known groups.
 *
 * @returns Promise<void>
 * @throws Error when unable to retrieve group information
 */
export async function listAllGroupsAndUsers(): Promise<void> {
  try {
    console.log('[DEBUG] ===== LISTING USERS IN KNOWN GROUPS =====');
    
    // Known groups to check
    const knownGroups = [
      'presence',
      'livekit_agent_azure_pubsub',
      'notifications',
      'streaming'
    ];
    
    console.log(`[DEBUG] Checking ${knownGroups.length} known groups:`);
    
    for (const groupName of knownGroups) {
      console.log(`[DEBUG] Checking group: "${groupName}"`);
      
      try {
        const groupClient = wpsClient.group(groupName);
        const connections = await groupClient.listConnections();
        
        let userCount = 0;
        const users: string[] = [];
        
        for await (const conn of connections) {
          userCount++;
          const userId = conn.userId || 'unknown';
          users.push(userId);
          console.log(`  [DEBUG] User ${userCount}: ${userId} (Connection: ${(conn as any).connectionId || 'N/A'})`);
        }
        
        console.log(`[DEBUG] Total users in group "${groupName}": ${userCount}`);
        if (users.length > 0) {
          console.log(`[DEBUG] Users: [${users.join(', ')}]`);
        }
        console.log('[DEBUG] ---');
        
      } catch (groupError: any) {
        console.log(`[DEBUG] Group "${groupName}" not found or error: ${groupError.message}`);
      }
    }
    
    // Check for user-specific groups based on known users from DB
    console.log('[DEBUG] Checking for user-specific groups...');
    try {
      // Get users from database to check their personal groups
      const prisma = (await import('./prismaClienService')).default;
      const dbUsers = await prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, email: true, presence: { select: { status: true } } }
      });
      
      console.log(`[DEBUG] Found ${dbUsers.length} users in database`);
      
      for (const user of dbUsers) {
        if (user.presence?.status === 'online') {
          console.log(`[DEBUG] Checking personal group for online user: ${user.email}`);
          
          try {
            const userGroupClient = wpsClient.group(user.email);
            const userConnections = await userGroupClient.listConnections();
            
            let userGroupCount = 0;
            for await (const userConn of userConnections) {
              userGroupCount++;
              console.log(`  [DEBUG] User ${user.email} in personal group: ${userConn.userId} (Connection: ${(userConn as any).connectionId || 'N/A'})`);
            }
            
            console.log(`[DEBUG] User ${user.email} personal group has ${userGroupCount} connections`);
          } catch (userGroupError: any) {
            console.log(`[DEBUG] User ${user.email} personal group not found or error: ${userGroupError.message}`);
          }
        }
      }
      
    } catch (error: any) {
      console.log(`[DEBUG] Error checking user-specific groups: ${error.message}`);
    }
    
    console.log('[DEBUG] ===== END GROUP LISTING =====');
    
  } catch (error: any) {
    console.error('[WebPubSubService] Error listing groups and users:', error);
    throw new Error(`Failed to list groups and users: ${error.message}`);
  }
}

/**
 * Logs active users in the presence group and compares with presence table.
 *
 * @returns Promise<void>
 * @throws Error when unable to retrieve or log group information
 */
export async function logActiveUsersInPresenceGroup(): Promise<void> {
  try {
    console.log('[DEBUG] ===== STARTING logActiveUsersInPresenceGroup =====');
    console.log('[DEBUG] Getting active users in presence group...');
    
    const activeUsers = await getActiveUsersInPresenceGroup();
    
    console.log('[DEBUG] Active users in presence group:');
    if (activeUsers.length === 0) {
      console.log('  - No users currently connected');
    } else {
      activeUsers.forEach((user, index) => {
        const roles = user.userRoles.length > 0 ? user.userRoles.join(', ') : 'No roles';
        console.log(`  ${index + 1}. ${user.userId} - Roles: [${roles}]`);
      });
    }
    console.log(`[DEBUG] Total active users in presence group: ${activeUsers.length}`);
    
    // Compare with presence table using Prisma
    try {
      console.log('[DEBUG] Comparing with presence table...');
      const prisma = (await import('./prismaClienService')).default;
      
      // Get all users with their presence status
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
      
      const dbOnlineEmails = new Set(dbOnlineUsers.map(u => u.email));
      const dbOfflineEmails = new Set(dbOfflineUsers.map(u => u.email));
      
      // Users in WebSocket but not in DB online
      const wsOnlyUsers = [...wsUserIds].filter(userId => {
        const user = dbUsers.find(u => u.id === userId);
        return user && !dbOnlineEmails.has(user.email);
      });
      
      // Users in DB online but not in WebSocket
      const dbOnlyUsers = dbOnlineUsers.filter(u => !wsUserIds.has(u.id));
      
      // Users in DB offline but in WebSocket (shouldn't happen)
      const offlineInWs = [...wsUserIds].filter(userId => {
        const user = dbUsers.find(u => u.id === userId);
        return user && dbOfflineEmails.has(user.email);
      });
      
      console.log('[DEBUG] === PRESENCE COMPARISON ===');
      console.log(`[DEBUG] WebSocket users: ${wsUserIds.size}`);
      console.log(`[DEBUG] DB online users: ${dbOnlineUsers.length}`);
      console.log(`[DEBUG] DB offline users: ${dbOfflineUsers.length}`);
      
      if (wsOnlyUsers.length > 0) {
        const wsOnlyEmails = wsOnlyUsers.map(userId => {
          const user = dbUsers.find(u => u.id === userId);
          return user ? user.email : userId;
        });
        console.log(`[DEBUG] ⚠️  Users in WebSocket but NOT in DB online: ${wsOnlyEmails.join(', ')}`);
      }
      
      if (dbOnlyUsers.length > 0) {
        const dbOnlyEmails = dbOnlyUsers.map(u => u.email);
        console.log(`[DEBUG] ⚠️  Users in DB online but NOT in WebSocket: ${dbOnlyEmails.join(', ')}`);
      }
      
      if (offlineInWs.length > 0) {
        const offlineEmails = offlineInWs.map(userId => {
          const user = dbUsers.find(u => u.id === userId);
          return user ? user.email : userId;
        });
        console.log(`[DEBUG] ⚠️  Users marked offline in DB but connected to WebSocket: ${offlineEmails.join(', ')}`);
      }
      
      if (wsOnlyUsers.length === 0 && dbOnlyUsers.length === 0 && offlineInWs.length === 0) {
        console.log('[DEBUG] ✅ WebSocket and DB presence are in sync');
      }
      
      // Log detailed presence info
      console.log('[DEBUG] === DETAILED PRESENCE INFO ===');
      dbOnlineUsers.forEach(user => {
        console.log(`[DEBUG] DB Online: ${user.email} (${user.fullName}) - Role: ${user.role} - Last seen: ${user.presence?.lastSeenAt}`);
      });
      
    } catch (dbError: any) {
      console.error('[DEBUG] Error comparing with presence table:', dbError.message);
    }
    
  } catch (error: any) {
    console.error('[WebPubSubService] Error logging active users in presence group:', error);
    throw error;
  }
}