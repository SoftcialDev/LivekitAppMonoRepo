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
 * Lists users in specific known groups using REST API.
 *
 * @returns Promise<void>
 * @throws Error when unable to retrieve group information
 */
export async function listAllGroupsAndUsers(): Promise<void> {
  try {
    console.log('[DEBUG] ===== LISTING USERS IN KNOWN GROUPS (REST API) =====');
    
    // Known groups to check
    const knownGroups = [
      'presence',
      'livekit_agent_azure_pubsub',
      'notifications',
      'streaming'
    ];
    
    console.log(`[DEBUG] Checking ${knownGroups.length} known groups using REST API:`);
    
    for (const groupName of knownGroups) {
      console.log(`[DEBUG] Checking group: "${groupName}"`);
      
      try {
        const connections = await listConnectionsInGroup(groupName);
        
        console.log(`[DEBUG] Total users in group "${groupName}": ${connections.length}`);
        
        if (connections.length > 0) {
          // Contar usuarios únicos en el grupo
          const userCounts = new Map<string, number>();
          connections.forEach(conn => {
            const userId = conn.userId || 'unknown';
            userCounts.set(userId, (userCounts.get(userId) || 0) + 1);
          });
          
          // Mostrar resumen del grupo
          console.log(`[DEBUG] ===== ${groupName.toUpperCase()} GROUP SUMMARY =====`);
          const sortedUsers = Array.from(userCounts.entries())
            .sort((a, b) => b[1] - a[1]); // Ordenar por número de conexiones
          
          // Para el grupo "presence", mostrar TODOS los usuarios sin truncar
          if (groupName === 'presence') {
            sortedUsers.forEach(([userId, count], index) => {
              const warningIcon = count > 10 ? '⚠️' : count > 5 ? '🔶' : '';
              console.log(`[DEBUG] ${index + 1}. ${userId}: ${count} conexiones ${warningIcon}`);
            });
          } else {
            // Para otros grupos, truncar a 10
            const truncatedUsers = sortedUsers.slice(0, 10);
            truncatedUsers.forEach(([userId, count], index) => {
              const warningIcon = count > 10 ? '⚠️' : count > 5 ? '🔶' : '';
              console.log(`[DEBUG] ${index + 1}. ${userId}: ${count} conexiones ${warningIcon}`);
            });
            
            if (userCounts.size > 10) {
              console.log(`[DEBUG] ... and ${userCounts.size - 10} more users (truncated)`);
            }
          }
          
          // Estadísticas del grupo
          const totalConnections = Array.from(userCounts.values()).reduce((sum, count) => sum + count, 0);
          const usersWithManyConnections = Array.from(userCounts.values()).filter(count => count > 10).length;
          
          console.log(`[DEBUG] Group "${groupName}" stats: ${userCounts.size} unique users, ${totalConnections} total connections`);
          if (usersWithManyConnections > 0) {
            console.log(`[WARNING] ⚠️ ${usersWithManyConnections} users in "${groupName}" have >10 connections`);
          }
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
      
      // Array para almacenar el resumen de conexiones
      const connectionSummary: Array<{email: string, connections: number, status: string}> = [];
      
      for (const user of dbUsers) {
        if (user.presence?.status === 'online') {
          try {
            const userConnections = await listConnectionsInGroup(user.email);
            connectionSummary.push({
              email: user.email,
              connections: userConnections.length,
              status: user.presence?.status || 'unknown'
            });
          } catch (userGroupError: any) {
            connectionSummary.push({
              email: user.email,
              connections: 0,
              status: 'error'
            });
          }
        }
      }
      
      // Mostrar resumen ordenado por número de conexiones
      console.log('[DEBUG] ===== CONNECTION SUMMARY =====');
      connectionSummary
        .sort((a, b) => b.connections - a.connections) // Ordenar por número de conexiones (mayor a menor)
        .forEach((user, index) => {
          const statusIcon = user.status === 'online' ? '🟢' : user.status === 'error' ? '❌' : '⚪';
          const warningIcon = user.connections > 10 ? '⚠️' : user.connections > 5 ? '🔶' : '';
          console.log(`[DEBUG] ${index + 1}. ${statusIcon} ${user.email}: ${user.connections} conexiones ${warningIcon}`);
        });

      // ✅ NUEVO: Detectar usuarios conectados en Web PubSub pero NO marcados online en BD
      console.log('[DEBUG] ===== DETECTING ORPHANED CONNECTIONS =====');
      try {
        // Obtener TODOS los usuarios de BD (online y offline)
        const allDbUsers = await prisma.user.findMany({
          where: { deletedAt: null },
          select: { id: true, email: true, presence: { select: { status: true } } }
        });
        
        const dbOnlineEmails = new Set(
          allDbUsers
            .filter(u => u.presence?.status === 'online')
            .map(u => u.email.toLowerCase())
        );
        
        // Verificar grupos de usuarios offline en BD
        const orphanedConnections: Array<{email: string, connections: number, dbStatus: string}> = [];
        
        for (const user of allDbUsers) {
          if (user.presence?.status === 'offline') {
            try {
              const userConnections = await listConnectionsInGroup(user.email);
              if (userConnections.length > 0) {
                orphanedConnections.push({
                  email: user.email,
                  connections: userConnections.length,
                  dbStatus: user.presence?.status || 'unknown'
                });
              }
            } catch (userGroupError: any) {
              // Ignorar errores de grupos que no existen
            }
          }
        }
        
        if (orphanedConnections.length > 0) {
          console.log(`[WARNING] 🔍 Found ${orphanedConnections.length} users with connections but marked OFFLINE in DB:`);
          orphanedConnections
            .sort((a, b) => b.connections - a.connections)
            .forEach((user, index) => {
              const warningIcon = user.connections > 10 ? '⚠️' : user.connections > 5 ? '🔶' : '';
              console.log(`[WARNING] ${index + 1}. 🔴 ${user.email}: ${user.connections} conexiones (DB: ${user.dbStatus}) ${warningIcon}`);
            });
        } else {
          console.log('[DEBUG] ✅ No orphaned connections found');
        }
        
      } catch (error: any) {
        console.log(`[DEBUG] Error detecting orphaned connections: ${error.message}`);
      }
      
      // Mostrar estadísticas
      const totalConnections = connectionSummary.reduce((sum, user) => sum + user.connections, 0);
      const usersWithConnections = connectionSummary.filter(user => user.connections > 0).length;
      const usersWithManyConnections = connectionSummary.filter(user => user.connections > 10).length;
      
      console.log(`[DEBUG] ===== STATISTICS =====`);
      console.log(`[DEBUG] Total users checked: ${connectionSummary.length}`);
      console.log(`[DEBUG] Users with connections: ${usersWithConnections}`);
      console.log(`[DEBUG] Users with >10 connections: ${usersWithManyConnections}`);
      console.log(`[DEBUG] Total connections: ${totalConnections}`);
      
      if (usersWithManyConnections > 0) {
        console.log(`[WARNING] ⚠️ ${usersWithManyConnections} users have too many connections (connection leaks detected)`);
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
 * Syncs all users between Web PubSub and Database.
 * Only runs on disconnect events to avoid overhead.
 *
 * @returns Promise<{corrected: number, warnings: string[], errors: string[]}>
 * @throws Error when unable to sync users
 */
export async function syncAllUsersWithDatabase(): Promise<{
  corrected: number;
  warnings: string[];
  errors: string[];
}> {
  try {
    console.log('[DEBUG] ===== SYNCING ALL USERS WITH DATABASE =====');
    
    // 1. Fuente de verdad: SOLO miembros del grupo 'presence'
    //    Un usuario está "online" si y solo si tiene una conexión activa
    //    y pertenece al grupo 'presence'.
    const webPubSubUsers = new Set<string>();
    try {
      const presenceConnections = await listConnectionsInGroup('presence');
      presenceConnections.forEach(conn => {
        if (conn.userId && conn.userId !== 'unknown') {
          webPubSubUsers.add(conn.userId);
        }
      });
      console.log(`[DEBUG] Presence truth: ${webPubSubUsers.size} unique users in presence group (${presenceConnections.length} connections)`);
    } catch (error: any) {
      console.log(`[DEBUG] Error getting presence group: ${error.message}`);
    }
    
    // 2. Obtener usuarios de BD
    const prisma = (await import('./prismaClienService')).default;
    const dbUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      include: { presence: { select: { status: true } } }
    });
    
    console.log(`[DEBUG] Found ${dbUsers.length} users in database`);
    
    // 3. Detectar discrepancias y aplicar correcciones
    const corrections = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    
    for (const user of dbUsers) {
      // Online en WS solo si está en el grupo 'presence'
      const isInWebPubSub = webPubSubUsers.has(user.email);
      const isOnlineInDb = user.presence?.status === 'online';
      
      if (isInWebPubSub && !isOnlineInDb) {
        // ✅ REGLA 1: Usuario en Web PubSub + OFFLINE en BD → Marcar online
        try {
          await prisma.presence.upsert({
            where: { userId: user.id },
            update: { status: 'online', lastSeenAt: new Date() },
            create: { userId: user.id, status: 'online', lastSeenAt: new Date() }
          });
          corrections.push({
            email: user.email,
            action: 'mark_online',
            reason: 'Connected in Web PubSub but offline in DB'
          });
          console.log(`[INFO] ✅ ${user.email}: Marking online (connected in Web PubSub but offline in DB)`);
        } catch (error: any) {
          errors.push(`Failed to mark ${user.email} online: ${error.message}`);
          console.log(`[ERROR] ❌ Failed to mark ${user.email} online: ${error.message}`);
        }
      } else if (!isInWebPubSub && isOnlineInDb) {
        // ✅ REGLA 3: Usuario ONLINE en BD + NO en Web PubSub → Marcar offline
        try {
          await prisma.presence.upsert({
            where: { userId: user.id },
            update: { status: 'offline', lastSeenAt: new Date() },
            create: { userId: user.id, status: 'offline', lastSeenAt: new Date() }
          });
          corrections.push({
            email: user.email,
            action: 'mark_offline',
            reason: 'Not in Web PubSub but online in DB'
          });
          console.log(`[INFO] ✅ ${user.email}: Marking offline (not in Web PubSub but online in DB)`);
        } catch (error: any) {
          errors.push(`Failed to mark ${user.email} offline: ${error.message}`);
          console.log(`[ERROR] ❌ Failed to mark ${user.email} offline: ${error.message}`);
        }
      }
      // ✅ REGLA 2: Usuario en Web PubSub + NO existe en BD → Ignorar
      // ✅ REGLA 4: Usuario en Web PubSub + ONLINE en BD → No hacer nada
    }
    
    console.log(`[DEBUG] ===== SYNC COMPLETED =====`);
    console.log(`[DEBUG] Total corrections: ${corrections.length}`);
    console.log(`[DEBUG] Total warnings: ${warnings.length}`);
    console.log(`[DEBUG] Total errors: ${errors.length}`);
    
    return {
      corrected: corrections.length,
      warnings,
      errors
    };
    
  } catch (error: any) {
    console.error('[WebPubSubService] Error syncing users with database:', error);
    throw new Error(`Failed to sync users with database: ${error.message}`);
  }
}

/**
 * Lists connections in a specific group using REST API.
 *
 * @param groupName - Name of the group to list connections for
 * @returns Promise<Array<{connectionId: string, userId?: string}>>
 * @throws Error when unable to retrieve group connections
 */
async function listConnectionsInGroup(groupName: string): Promise<Array<{connectionId: string, userId?: string}>> {
  try {
    console.log(`[DEBUG] Using Web PubSub SDK to list connections in group: "${groupName}"`);
    
    // Use the existing Web PubSub client instead of REST API
    const groupClient = wpsClient.group(groupName);
    
    console.log(`[DEBUG] Getting connections from SDK for group: "${groupName}"`);
    const connections = await groupClient.listConnections();
    
    console.log(`[DEBUG] SDK returned connections for group "${groupName}":`, connections);
    
    const result: Array<{connectionId: string, userId?: string}> = [];
    
    for await (const conn of connections) {
      result.push({
        connectionId: conn.connectionId || 'unknown',
        userId: conn.userId || undefined
      });
    }
    
    console.log(`[DEBUG] Processed ${result.length} connections for group "${groupName}"`);
    return result;

  } catch (error: any) {
    console.error(`[WebPubSubService] Error listing connections in group "${groupName}":`, error);
    throw new Error(`Failed to list connections in group "${groupName}": ${error.message}`);
  }
}

/**
 * Generates a SAS token for Web PubSub authentication.
 *
 * @param endpoint - Web PubSub endpoint URL
 * @param accessKey - Web PubSub access key
 * @param hubName - Hub name
 * @returns SAS token string
 */
function generateSasToken(endpoint: string, accessKey: string, hubName: string): string {
  const crypto = require('crypto');
  const expires = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  
  // For Web PubSub, we need to use the access key directly as a JWT
  // The access key is actually a connection string that contains the key
  // Format: "Endpoint=https://...;AccessKey=...;Version=1.0;"
  
  console.log(`[DEBUG] Generating SAS token for endpoint: ${endpoint}`);
  console.log(`[DEBUG] Access key length: ${accessKey.length}`);
  console.log(`[DEBUG] Hub name: ${hubName}`);
  
  // For Web PubSub, we can use the access key directly as a JWT token
  // or create a proper SAS token
  try {
    // Try to parse the connection string format
    if (accessKey.includes('Endpoint=')) {
      // This is a connection string, extract the key
      const keyMatch = accessKey.match(/AccessKey=([^;]+)/);
      if (keyMatch) {
        const actualKey = keyMatch[1];
        console.log(`[DEBUG] Extracted key from connection string`);
        return actualKey; // Use the key directly
      }
    }
    
    // If it's not a connection string, use it as is
    console.log(`[DEBUG] Using access key directly`);
    return accessKey;
    
  } catch (error: any) {
    console.error(`[DEBUG] Error generating SAS token:`, error.message);
    // Fallback: return the access key as is
    return accessKey;
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