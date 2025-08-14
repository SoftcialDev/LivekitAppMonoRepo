import { AzureFunction, Context } from "@azure/functions";
import { setUserOnline, setUserOffline } from "../services/presenceService";
import { stopStreamingSession } from "../services/streamingService";
import { LiveKitRecordingService } from "../services/livekitRecordingService";

////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////

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
        break;
      }

      case "disconnected": {
        // Mark the user offline and stop any in-progress stream
        context.log.verbose(`→ setUserOffline("${userId}")`);
        await setUserOffline(userId);

        context.log.verbose(`→ stopStreamingSession("${userId}")`);
        await stopStreamingSession(userId);

        context.log.verbose(`→ stopAll recordings for user "${userId}"`);
        const summary = await LiveKitRecordingService.stopAllForUser(userId, 60);
        context.log.info(
          `✅ Recordings stop summary: ${summary.completed}/${summary.total} completed (user=${userId})`
        );
        break;
      }

      case "user":
        context.log.info("👤 Custom user event (no handler configured)");
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
