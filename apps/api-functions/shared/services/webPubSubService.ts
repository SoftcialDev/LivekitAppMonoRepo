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

    const groupClient = wpsClient.group("presence");
    

    const connections = await groupClient.listConnections();
    

    
    const activeUsers: Array<{ userId: string; userRoles: string[] }> = [];
    let connectionCount = 0;
    

    for await (const conn of connections) {
      connectionCount++;

      
      activeUsers.push({
        userId: conn.userId || 'unknown',
        userRoles: (conn as any).userRoles || []
      });
    }
    


    
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

    
    // 1. PRIMERO: Mostrar grupo 'presence'

    try {
      const presenceConnections = await listConnectionsInGroup('presence');

      
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

        });
        

      }
    } catch (error: any) {

    }
    

    
    // 2. SEGUNDO: Mostrar grupos personales de usuarios online
    try {
      const prisma = (await import('./prismaClienService')).default;
      const dbUsers = await prisma.user.findMany({
        where: { 
          deletedAt: null,
          presence: { status: 'online' }
        },
        select: { id: true, email: true, presence: { select: { status: true } } }
      });
      

      
      for (const user of dbUsers) {
        try {
          const userConnections = await listConnectionsInGroup(user.email);
          if (userConnections.length > 0) {

          }
        } catch (userGroupError: any) {
          // Grupo personal no existe o error - esto es normal
        }
      }
    } catch (error: any) {

    }
    
    // 3. TERCERO: Mostrar otros grupos conocidos
    const otherGroups = [
      'livekit_agent_azure_pubsub',
      'notifications',
      'streaming'
    ];
    

    
    for (const groupName of otherGroups) {
      try {
        const connections = await listConnectionsInGroup(groupName);
        if (connections.length > 0) {

        }
      } catch (groupError: any) {
        // Grupo no existe o error - esto es normal
      }
    }
    
    // 4. CUARTO: Resumen total de conexiones por usuario

    try {
      const prisma = (await import('./prismaClienService')).default;
      const dbUsers = await prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, email: true, presence: { select: { status: true } } }
      });
      
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
      connectionSummary
        .sort((a, b) => b.connections - a.connections)
        .forEach((user, index) => {
          const statusIcon = user.status === 'online' ? '🟢' : user.status === 'error' ? '❌' : '⚪';
          const warningIcon = user.connections > 10 ? '⚠️' : user.connections > 5 ? '🔶' : '';

        });

      // ✅ NUEVO: Detectar usuarios conectados en Web PubSub pero NO marcados online en BD

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

          orphanedConnections
            .sort((a, b) => b.connections - a.connections)
            .forEach((user, index) => {
              const warningIcon = user.connections > 10 ? '⚠️' : user.connections > 5 ? '🔶' : '';

            });
        } else {

        }
        
      } catch (error: any) {

      }
      
      // Mostrar estadísticas
      const totalConnections = connectionSummary.reduce((sum, user) => sum + user.connections, 0);
      const usersWithConnections = connectionSummary.filter(user => user.connections > 0).length;
      const usersWithManyConnections = connectionSummary.filter(user => user.connections > 10).length;
      





      
      if (usersWithManyConnections > 0) {

      }
      
    } catch (error: any) {

    }
    

    
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

    } catch (error: any) {

    }
    
    // 2. Obtener usuarios de BD
    const prisma = (await import('./prismaClienService')).default;
    const dbUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      include: { presence: { select: { status: true } } }
    });
    

    
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

        } catch (error: any) {
          errors.push(`Failed to mark ${user.email} online: ${error.message}`);

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

        } catch (error: any) {
          errors.push(`Failed to mark ${user.email} offline: ${error.message}`);

        }
      }
      // ✅ REGLA 2: Usuario en Web PubSub + NO existe en BD → Ignorar
      // ✅ REGLA 4: Usuario en Web PubSub + ONLINE en BD → No hacer nada
    }
    




    
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
export async function listConnectionsInGroup(groupName: string): Promise<Array<{connectionId: string, userId?: string}>> {
  try {

    
    // Use the existing Web PubSub client instead of REST API
    const groupClient = wpsClient.group(groupName);
    

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
  



  
  // For Web PubSub, we can use the access key directly as a JWT token
  // or create a proper SAS token
  try {
    // Try to parse the connection string format
    if (accessKey.includes('Endpoint=')) {
      // This is a connection string, extract the key
      const keyMatch = accessKey.match(/AccessKey=([^;]+)/);
      if (keyMatch) {
        const actualKey = keyMatch[1];

        return actualKey; // Use the key directly
      }
    }
    
    // If it's not a connection string, use it as is

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


    
    const activeUsers = await getActiveUsersInPresenceGroup();
    

    if (activeUsers.length === 0) {

    } else {
      activeUsers.forEach((user, index) => {
        const roles = user.userRoles.length > 0 ? user.userRoles.join(', ') : 'No roles';

      });
    }

    
    // Compare with presence table using Prisma
    try {

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
      




      
      if (wsOnlyUsers.length > 0) {
        const wsOnlyEmails = wsOnlyUsers.map(userId => {
          const user = dbUsers.find(u => u.id === userId);
          return user ? user.email : userId;
        });

      }
      
      if (dbOnlyUsers.length > 0) {
        const dbOnlyEmails = dbOnlyUsers.map(u => u.email);

      }
      
      if (offlineInWs.length > 0) {
        const offlineEmails = offlineInWs.map(userId => {
          const user = dbUsers.find(u => u.id === userId);
          return user ? user.email : userId;
        });

      }
      
      if (wsOnlyUsers.length === 0 && dbOnlyUsers.length === 0 && offlineInWs.length === 0) {

      }
      
      // Log detailed presence info

      dbOnlineUsers.forEach(user => {

      });
      
    } catch (dbError: any) {
      console.error('[DEBUG] Error comparing with presence table:', dbError.message);
    }
    
  } catch (error: any) {
    console.error('[WebPubSubService] Error logging active users in presence group:', error);
    throw error;
  }
}
