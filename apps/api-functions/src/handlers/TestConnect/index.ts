import { AzureFunction, Context } from "@azure/functions";
import { config } from '../../config';

/**
 * Minimal type for WebPubSub connection context
 * @description Defines the structure of the connection context passed to the handler
 */
interface WebPubSubConnectionContext {
  hub: string;
  connectionId: string;
  userId?: string;
  eventType: string;
  eventName: string;
  states?: unknown;
  claims?: Record<string, string>;
  headers?: Record<string, string>;
}

/**
 * Test function for "system:connect" events
 * @description Debug function that logs connection context details without using DI or external services
 * @param context - Azure Functions execution context
 * @param connectionContext - WebPubSub connection context
 */
const testConnect: AzureFunction = async (
  context: Context,
  connectionContext: WebPubSubConnectionContext
): Promise<void> => {
  /**
   * Log initial function execution
   */
  context.log("🔥 [TestConnect] Function START");
  context.log("🔥 [TestConnect] InvocationId:", context.invocationId);

  /**
   * Log key environment variables from config
   */
  context.log("🔥 [TestConnect] WEBPUBSUB_HUB:", config.webPubSubHubName);
  context.log("🔥 [TestConnect] WEBPUBSUB_CONNECTION exists?:", !!config.webPubSubConnection);

  try {
    /**
     * Log complete connection context
     */
    context.log("🔥 [TestConnect] Raw connectionContext object:");
    try {
      context.log(JSON.stringify(connectionContext, null, 2));
    } catch {
      context.log("Could not serialize connectionContext with JSON.stringify");
    }

    /**
     * Log individual important fields
     */
    context.log("🔥 [TestConnect] hub:", connectionContext.hub);
    context.log("🔥 [TestConnect] eventType:", connectionContext.eventType);
    context.log("🔥 [TestConnect] eventName:", connectionContext.eventName);
    context.log("🔥 [TestConnect] connectionId:", connectionContext.connectionId);
    context.log("🔥 [TestConnect] userId:", connectionContext.userId ?? "<undefined>");

    /**
     * Log headers and claims if present
     */
    if (connectionContext.headers) {
      context.log("🔥 [TestConnect] headers:", JSON.stringify(connectionContext.headers, null, 2));
    } else {
      context.log("🔥 [TestConnect] headers: <none>");
    }

    if (connectionContext.claims) {
      context.log("🔥 [TestConnect] claims:", JSON.stringify(connectionContext.claims, null, 2));
    } else {
      context.log("🔥 [TestConnect] claims: <none>");
    }

    /**
     * Do not set context.res to avoid interfering with the handshake
     */
    context.log("✅ [TestConnect] Finished without errors.");
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    context.log.error("💥 [TestConnect] ERROR:", errorMessage);
    context.log.error("💥 [TestConnect] Full error object:", JSON.stringify(err, null, 2));

    /**
     * Do not modify context.res; let the extension handle the response
     */
  }
};

export default testConnect;
