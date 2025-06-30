import { AzureFunction, Context } from "@azure/functions";
import { setUserOnline, setUserOffline } from "../services/presenceService";
import { stopStreamingSession } from "../services/streamingService";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const bar = "─".repeat(80);

function banner(ctx: Context, msg: string): void {
  ctx.log.info(`${bar}\n${msg}\n${bar}`);
}

function safeStringify(x: unknown): string {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

/* -------------------------------------------------------------------------- */
/* Handler                                                                    */
/* -------------------------------------------------------------------------- */

export const presenceAndStreamingHandler: AzureFunction = async (
  context: Context,
): Promise<void> => {
  // Full, untyped view of the binding so we don't miss fields in the future.
  const c = context.bindingData.connectionContext as Record<string, any>;

  /**
   * GA behaviour (Functions v4):
   *   eventType = "System"
   *   eventName = "connect" | "connected" | "disconnected"
   *
   * Early previews:
   *   eventType = "connect" | "connected" | "disconnected"
   *   eventName = "system"
   *
   * This helper normalises both worlds into `phase`.
   */
  const phase = (() => {
    const et = (c.eventType ?? "").toLowerCase();
    const en = (c.eventName ?? "").toLowerCase();
    if (et === "system" || et === "") return en;      // GA
    return et;                                        // preview
  })(); // "connect" | "connected" | "disconnected" | "user" | ""

  const userId       = c.userId       ?? "(unknown)";
  const connectionId = c.connectionId ? `#${c.connectionId}` : "(n/a)";

  /* ---------------------------------------------------------------------- */
  /* 1.  Diagnostic banner                                                  */
  /* ---------------------------------------------------------------------- */
  banner(context, `WebPubSub webhook  ←  phase="${phase}"  user=${userId}`);

  context.log.info(`• hub          : ${c.hub}`);
  context.log.info(`• connectionId : ${connectionId}`);
  context.log.verbose(`• raw payload  : ${safeStringify(c)}`);

  /* ---------------------------------------------------------------------- */
  /* 2.  Dispatch business rules                                            */
  /* ---------------------------------------------------------------------- */
  try {
    switch (phase) {
      case "connect": {
        context.log.verbose(`→ setUserOnline("${userId}")`);
        await setUserOnline(userId);
        context.log.info(`✅ User ONLINE (${userId})`);
        break;
      }

      case "disconnected": {
        context.log.verbose(`→ setUserOffline("${userId}")`);
        await setUserOffline(userId);

        context.log.verbose(`→ stopStreamingSession("${userId}")`);
        await stopStreamingSession(userId);

        context.log.info(`✅ User OFFLINE & stream stopped (${userId})`);
        break;
      }

      case "connected":
        context.log.verbose("ℹ️  Handshake confirmed (no action)");
        break;

      case "user":
        context.log.info("👤 Custom user event (no handler yet)");
        break;

      default:
        context.log.warn(`⚠️  Unknown phase="${phase}" – ignoring`);
    }

    /* ------------------------------------------------------------------ */
    /* 3.  Always send 2xx so Web PubSub doesn’t retry                    */
    /* ------------------------------------------------------------------ */
    context.res = { status: 200, body: "OK" };
  } catch (err: any) {
    /* ------------------------------------------------------------------ */
    /* 4.  Error path                                                     */
    /* ------------------------------------------------------------------ */
    context.log.error(`❌ Handler failed (phase=${phase} user=${userId})`, err);
    context.res = { status: 500, body: String(err?.message ?? err) };
  }

  banner(context, "Handler completed");
};
