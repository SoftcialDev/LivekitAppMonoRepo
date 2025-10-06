import { AzureFunction, Context } from "@azure/functions";
import { setUserOnline, setUserOffline } from "../services/presenceService";
import { stopStreamingSession } from "../services/streamingService";
import { LiveKitRecordingService } from "../services/livekitRecordingService";
import { isUuid } from "../utils/uuid";
import prisma from "../services/prismaClienService";
import { WebPubSubServiceClient } from "@azure/web-pubsub";
import { AzureKeyCredential } from "@azure/core-auth";
import { config } from "../config";
import { logActiveUsersInPresenceGroup, listAllGroupsAndUsers } from "../services/webPubSubService";

/**
 * Web PubSub Service Client for connection operations
 */
const webPubSubService = new WebPubSubServiceClient(
  config.webPubSubEndpoint,
  new AzureKeyCredential(config.webPubSubKey),
  config.webPubSubHubName
);

/**
 * Logs all active connections from Web PubSub
 */
async function logActiveConnections(context: Context): Promise<void> {
  try {
    context.log.info("🔍 Getting real connections from Web PubSub...");
    
    // Get users from database to check against Web PubSub
    const dbOnlineUsers = await prisma.presence.findMany({
      where: { status: "online" },
      include: {
        user: {
          select: { id: true, email: true, fullName: true }
        }
      }
    });
    
    context.log.info(`🔍 Database shows ${dbOnlineUsers.length} online users`);
    
    // Check each user against Web PubSub
    const realConnections: string[] = [];
    for (const user of dbOnlineUsers) {
      try {
        const userExists = await webPubSubService.userExists(user.userId);
        if (userExists) {
          realConnections.push(`${user.user.email} (${user.userId})`);
        } else {
          context.log.warn(`⚠️ User ${user.user.email} is marked online in DB but NOT in Web PubSub!`);
        }
      } catch (error: any) {
        context.log.warn(`⚠️ Failed to check user ${user.user.email}:`, error.message);
      }
    }
    
    context.log.info(`🔍 Real Web PubSub connections (${realConnections.length}):`, realConnections);
  } catch (error: any) {
    context.log.warn(`🔍 Failed to get real connections:`, error.message);
  }
}

////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////

/**
 * Returns a *non-deleted* user matched by one of:
 *  • database UUID                     (`id`)
 *  • Azure AD object ID                (`azureAdObjectId`)
 *  • e-mail address (always lower-cased)
 *
 * @throws If no active user matches the **key**.
 */
async function findActiveUserFlexible(key: string) {
  const OR: import("@prisma/client").Prisma.UserWhereInput[] = [];

  if (isUuid(key)) {
    OR.push({ id: key }, { azureAdObjectId: key });
  }
  OR.push({ email: key.toLowerCase() });

  const user = await prisma.user.findFirst({
    where: { deletedAt: null, OR },
  });

  if (!user) {
    throw new Error(`User not found for presence operation (${key})`);
  }
  return user;
}

const bar = "─".repeat(80);

/**
 * Logs a banner with a border around a message.
 *
 * @param ctx - Azure Function execution context.
 * @param msg - The message to log inside the banner.
 */
function banner(ctx: Context, msg: string): void {
  ctx.log.info(`${bar}\n${msg}\n${bar}`);
}

/**
 * Safely JSON-stringifies a value, falling back to `String(x)` on error.
 *
 * @param x - The value to stringify.
 * @returns A pretty-printed JSON string or the result of `String(x)`.
 */
function safeStringify(x: unknown): string {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

////////////////////////////////////////////////////////////////////////////////
// Handler
////////////////////////////////////////////////////////////////////////////////

/**
 * presenceAndStreamingHandler
 *
 * Web PubSub trigger that handles "connect", "connected", and "disconnected" events
 * to update presence and stop streaming sessions as needed.
 *
 * - Normalizes both GA and preview eventType/eventName combinations into a single `phase`.
 * - On `connect` or `connected`, marks the user online.
 * - On `disconnected`, marks the user offline and stops their streaming session.
 * - Ignores other phases but always returns HTTP 200 to prevent retries.
 *
 * @param context - Azure Function execution context containing `bindingData.connectionContext`.
 */
export const presenceAndStreamingHandler: AzureFunction = async (
  context: Context
): Promise<void> => {
  // Raw connection context from the Web PubSub trigger
  const c = context.bindingData.connectionContext as Record<string, any>;

  /**
   * Normalize GA vs. preview fields into `phase`:
   * - GA:    eventType="System", eventName="connect" | "connected" | "disconnected"
   * - Preview: eventType="connect" | "connected" | "disconnected", eventName="system"
   */
  const phase = (() => {
    const et = (c.eventType ?? "").toLowerCase();
    const en = (c.eventName ?? "").toLowerCase();
    if (et === "system" || et === "") {
      return en;  // GA → use eventName
    }
    return et;    // Preview → use eventType
  })();  // one of "connect" | "connected" | "disconnected" | "user" | ""

  const userId       = c.userId       ?? "(unknown)";
  const connectionId = c.connectionId ? `#${c.connectionId}` : "(n/a)";

  // 1. Diagnostic banner
  banner(context, `WebPubSub webhook  ←  phase="${phase}"  user=${userId}`);
  context.log.info(`• hub          : ${c.hub}`);
  context.log.info(`• connectionId : ${connectionId}`);
  context.log.verbose(`• raw payload  : ${safeStringify(c)}`);

  // 2. Business logic
  try {
    switch (phase) {
      case "connect":
      case "connected": {
        // Mark the user as online on both initial connect and handshake-confirm events
        context.log.verbose(`→ setUserOnline("${userId}")`);
        await setUserOnline(userId);
        context.log.info(`✅ User ONLINE (${userId})`);
        
        // Log all active connections
        await logActiveConnections(context);
        
        // List all groups and users
        try {
          context.log.info('🔍 Starting listAllGroupsAndUsers...');
          await listAllGroupsAndUsers();
          context.log.info('✅ listAllGroupsAndUsers completed');
        } catch (error: any) {
          context.log.error(`❌ Failed to list all groups: ${error.message}`);
          context.log.error(`❌ Error stack: ${error.stack}`);
        }
        
        // Log active users in presence group with detailed comparison
        try {
          await logActiveUsersInPresenceGroup();
        } catch (error: any) {
          context.log.warn(`Failed to log presence group users: ${error.message}`);
        }
        break;
      }

      case "disconnected": {
        // Mark the user offline and stop any in-progress stream
        context.log.verbose(`→ setUserOffline("${userId}")`);
        await setUserOffline(userId);

        context.log.verbose(`→ stopStreamingSession("${userId}") - DISCONNECT reason`);
        await stopStreamingSession(userId, 'DISCONNECT');

        // Try to stop recordings, but don't let it fail the entire handler
        try {
          context.log.verbose(`→ stopAll recordings for user "${userId}"`);
          
          // Use the same flexible user lookup as setUserOffline
          const user = await findActiveUserFlexible(userId);
          context.log.verbose(`→ Found user for recordings: ${user.email} (${user.id})`);
          
          const summary = await LiveKitRecordingService.stopAllForUser(user.id, 60);
          context.log.info(
            `✅ Recordings stop summary: ${summary.completed}/${summary.total} completed (user=${user.email})`
          );
        } catch (recordingError: any) {
          context.log.error(`❌ Failed to stop recordings for user ${userId}:`, recordingError.message);
          context.log.warn(`⚠️ Continuing with disconnect despite recording error`);
        }
        
        // Log all active connections
        await logActiveConnections(context);
        
        // Log active users in presence group with detailed comparison
        try {
          await logActiveUsersInPresenceGroup();
        } catch (error: any) {
          context.log.warn(`Failed to log presence group users: ${error.message}`);
        }
        break;
      }

      case "user":
        context.log.info("👤 Custom user event (no handler configured)");
        
        // Log all active connections
        await logActiveConnections(context);
        
        // Log active users in presence group with detailed comparison
        try {
          await logActiveUsersInPresenceGroup();
        } catch (error: any) {
          context.log.warn(`Failed to log presence group users: ${error.message}`);
        }
        break;

      default:
        context.log.warn(`⚠️  Unknown phase="${phase}" – ignoring`);
    }

    // 3. Always respond 200 so Web PubSub does not retry
    context.res = { status: 200, body: "OK" };
  } catch (err: any) {
    // 4. Error handling
    context.log.error(`❌ Handler failed (phase=${phase} user=${userId})`, err);
    context.res = { status: 500, body: String(err?.message ?? err) };
  }

  banner(context, "Handler completed");
};
