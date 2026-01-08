/**
 * @fileoverview WebPubSubEvents - Azure Function for handling Web PubSub events
 * @summary HTTP-triggered function that processes Web PubSub connection events
 * @description Handles connect, connected, and disconnected events from Azure Web PubSub service
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withErrorHandler } from '../../middleware/errorHandler';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { WebSocketEventRequest } from '../../domain/value-objects/WebSocketEventRequest';
import { WebSocketConnectionApplicationService } from '../../application/services/WebSocketConnectionApplicationService';
import { ContactManagerDisconnectApplicationService } from '../../application/services/ContactManagerDisconnectApplicationService';
import { logWebPubSubErrorIfAny } from '../../utils/webPubSubErrorLogger';
import { logWebPubSubEvent } from '../../utils/webPubSubEventLogger';

/**
 * Azure Function: WebPubSubEvents
 *
 * **HTTP POST** `/api/webpubsub-events`
 *
 * Handles Web PubSub system events (connect, connected, disconnected) via HTTP trigger
 * with webPubSubContext binding. This replaces the webPubSubTrigger which doesn't work
 * in Flexible Consumption plans.
 *
 * **Workflow:**
 * 1. Handles OPTIONS requests for Web PubSub handshake validation
 * 2. Extracts event information from CloudEvents headers or webPubSubContext binding
 * 3. Routes to appropriate handler based on event type:
 *    - `connect` / `connected`: Sets user online and syncs presence
 *    - `disconnected`: Sets user offline, stops streaming session, and syncs presence
 * 4. Logs errors to error log table for any 500 status responses
 *
 * **Event Types:**
 * - `connect`: Initial connection handshake
 * - `connected`: Connection established
 * - `disconnected`: Connection terminated
 *
 * **Error Handling:**
 * - 400: Missing or unknown event name
 * - 405: Method not allowed (non-POST requests)
 * - 500: Internal server error (logged to error log table)
 *
 * @param context - Azure Functions execution context
 * @param req - HTTP request object
 * @param webPubSubContext - Web PubSub context binding containing event metadata
 * @returns HTTP response with appropriate status code
 */
const webPubSubEvents: AzureFunction = withErrorHandler(
  async (
    context: Context,
    req: HttpRequest
  ): Promise<void> => {
    const webPubSubContext = context.bindingData?.webPubSubContext || null;
  if (req.method === "OPTIONS") {
    context.res = {
      status: 200,
      headers: { "WebHook-Allowed-Origin": "*" }
    };
    return;
  }

  if (req.method !== "POST") {
    context.res = {
      status: 405,
      headers: { "Content-Type": "application/json" },
      body: { error: "Method not allowed" }
    };
    return;
  }

  let eventName = "";
  let hub = "";
  let connectionId = "";
  let userId = "";

  const headers = req.headers || {};

  for (const key of Object.keys(headers)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === "ce-eventname" || lowerKey === "ce-event") {
      eventName = String(headers[key]).toLowerCase().trim();
      break;
    }
  }

  if (!eventName && webPubSubContext) {
    if (typeof webPubSubContext === "string") {
      try {
        const parsed = JSON.parse(webPubSubContext);
        eventName = parsed.eventName || parsed.event?.name || "";
        hub = parsed.hub || "";
        connectionId = parsed.connectionId || "";
        userId = parsed.userId || parsed.user?.id || parsed.claims?.userId || "";
      } catch (e) {
        context.log.warn("Failed to parse webPubSubContext as JSON", { error: e });
      }
    } else if (typeof webPubSubContext === "object") {
      eventName = webPubSubContext.eventName || webPubSubContext.event?.name || "";
      hub = webPubSubContext.hub || "";
      connectionId = webPubSubContext.connectionId || "";
      userId = webPubSubContext.userId || webPubSubContext.user?.id || webPubSubContext.claims?.userId || "";
    }
  }

  if (!eventName && context.bindingData?.webPubSubContext) {
    const bindingContext = context.bindingData.webPubSubContext;
    if (typeof bindingContext === "string") {
      try {
        const parsed = JSON.parse(bindingContext);
        eventName = parsed.eventName || parsed.event?.name || "";
        hub = hub || parsed.hub || "";
        connectionId = connectionId || parsed.connectionId || "";
        userId = userId || parsed.userId || parsed.user?.id || parsed.claims?.userId || "";
      } catch (e) {
        context.log.warn("Failed to parse bindingData.webPubSubContext as JSON", { error: e });
      }
    } else if (typeof bindingContext === "object") {
      eventName = eventName || bindingContext.eventName || bindingContext.event?.name || "";
      hub = hub || bindingContext.hub || "";
      connectionId = connectionId || bindingContext.connectionId || "";
      userId = userId || bindingContext.userId || bindingContext.user?.id || bindingContext.claims?.userId || "";
    }
  }

  if (!eventName && req.body) {
    let bodyData: unknown = req.body;
    if (typeof req.body === "string") {
      try {
        bodyData = JSON.parse(req.body);
      } catch (e) {
        bodyData = null;
      }
    }

    if (bodyData && typeof bodyData === "object" && bodyData !== null) {
      const data = bodyData as Record<string, unknown>;
      eventName = eventName || (typeof data.eventName === "string" ? data.eventName : "") || 
                  (typeof data.event === "object" && data.event !== null && "name" in data.event && typeof data.event.name === "string" ? data.event.name : "") || 
                  (typeof data.type === "string" ? data.type : "") || "";
      hub = hub || (typeof data.hub === "string" ? data.hub : "") || "";
      connectionId = connectionId || (typeof data.connectionId === "string" ? data.connectionId : "") || "";
      const userIdFromData = typeof data.userId === "string" ? data.userId : 
                            (typeof data.user === "object" && data.user !== null && "id" in data.user && typeof data.user.id === "string" ? data.user.id : "") ||
                            (typeof data.claims === "object" && data.claims !== null && "userId" in data.claims && typeof data.claims.userId === "string" ? data.claims.userId : "");
      userId = userId || userIdFromData || "";
    }
  }

  if (!eventName) {
    hub = hub || headers["ce-hub"] || headers["Ce-Hub"] || "";
    connectionId = connectionId || headers["ce-connectionid"] || headers["Ce-Connectionid"] || "";
    userId = userId || headers["ce-userid"] || headers["Ce-Userid"] || "";

    if (hub && !eventName) {
      eventName = "connect";
    }
  }

  eventName = eventName.toLowerCase().trim();
  hub = hub || headers["ce-hub"] || headers["Ce-Hub"] || "";
  connectionId = connectionId || headers["ce-connectionid"] || headers["Ce-Connectionid"] || "";
  userId = userId || headers["ce-userid"] || headers["Ce-Userid"] || "";

  if (!eventName) {
    context.log.error("Missing eventName", {
      webPubSubContext: JSON.stringify(webPubSubContext),
      bindingData: JSON.stringify(context.bindingData),
      body: JSON.stringify(req.body)
    });
    context.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Unknown event name" }
    };
    return;
  }

  const serviceContainer = ServiceContainer.getInstance();
  serviceContainer.initialize();

  const contextData = webPubSubContext || req.body || {};
  if (hub && !contextData.hub) contextData.hub = hub;
  if (connectionId && !contextData.connectionId) contextData.connectionId = connectionId;
  if (userId && !contextData.userId && !contextData.user?.id && !contextData.claims?.userId) {
    contextData.userId = userId;
  }

  const request = WebSocketEventRequest.fromWebPubSubContext(contextData, eventName);

  if (eventName === "connect" || eventName === "connected") {
    const applicationService = serviceContainer.resolve<WebSocketConnectionApplicationService>(
      "WebSocketConnectionApplicationService"
    );
    const response = await applicationService.handleConnection(request);
    
      await logWebPubSubErrorIfAny(response, request, eventName, serviceContainer, context, "handleConnection");
    
    if (response.status === 200) {
      await logWebPubSubEvent(eventName, request, serviceContainer, context);
    }
    
    context.res = { 
      status: response.status || 200,
      headers: { "Content-Type": "application/json" },
      body: response.status !== 200 ? { error: response.message } : undefined
    };
    return;
  }

  if (eventName === "disconnected") {
    const connectionService = serviceContainer.resolve<WebSocketConnectionApplicationService>(
      "WebSocketConnectionApplicationService"
    );
    const disconnectResponse = await connectionService.handleDisconnection(request, context);
      await logWebPubSubErrorIfAny(disconnectResponse, request, eventName, serviceContainer, context, "handleDisconnection");

      const cmService = serviceContainer.resolve<ContactManagerDisconnectApplicationService>(
        "ContactManagerDisconnectApplicationService"
      );
      const cmResponse = await cmService.handleContactManagerDisconnect(request);
      await logWebPubSubErrorIfAny(cmResponse, request, eventName, serviceContainer, context, "ContactManagerDisconnect");

    if (disconnectResponse.status === 200) {
      await logWebPubSubEvent(eventName, request, serviceContainer, context);
    }

    context.res = { status: 200 };
    return;
  }

  context.res = {
    status: 400,
    headers: { "Content-Type": "application/json" },
    body: { error: `Unknown event name: ${eventName}` }
  };
  },
  {
    genericMessage: "Error processing WebPubSub event",
    showStackInDev: true,
  }
);

export default webPubSubEvents;

