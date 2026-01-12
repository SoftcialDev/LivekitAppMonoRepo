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
 * Event data extracted from various sources
 */
type EventData = {
  eventName: string;
  hub: string;
  connectionId: string;
  userId: string;
};

/**
 * Extracts event name from CloudEvents headers
 * @param headers - Request headers
 * @returns Event name or empty string
 */
function extractEventNameFromHeaders(headers: Record<string, unknown>): string {
  for (const key of Object.keys(headers)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === "ce-eventname" || lowerKey === "ce-event") {
      return String(headers[key]).toLowerCase().trim();
    }
  }
  return "";
}

/**
 * Extracts userId from object with various possible structures
 * @param data - Object that may contain userId
 * @returns UserId or empty string
 */
function extractUserId(data: Record<string, unknown>): string {
  if (typeof data.userId === "string") {
    return data.userId;
  }
  
  const user = data.user;
  if (user !== null && user !== undefined && typeof user === "object" && "id" in user) {
    const userId = (user as { id?: unknown }).id;
    if (typeof userId === "string") {
      return userId;
    }
  }
  
  const claims = data.claims;
  if (claims !== null && claims !== undefined && typeof claims === "object" && "userId" in claims) {
    const userId = (claims as { userId?: unknown }).userId;
    if (typeof userId === "string") {
      return userId;
    }
  }
  
  return "";
}

/**
 * Extracts event data from webPubSubContext
 * @param webPubSubContext - WebPubSub context (string or object)
 * @param context - Azure Functions context for logging
 * @returns Event data extracted from context
 */
function extractEventDataFromWebPubSubContext(
  webPubSubContext: unknown,
  context: Context
): Partial<EventData> {
  if (!webPubSubContext) {
    return {};
  }

  if (typeof webPubSubContext === "string") {
    try {
      const parsed = JSON.parse(webPubSubContext);
      return {
        eventName: parsed.eventName || parsed.event?.name || "",
        hub: parsed.hub || "",
        connectionId: parsed.connectionId || "",
        userId: extractUserId(parsed)
      };
    } catch (e) {
      context.log.warn("Failed to parse webPubSubContext as JSON", { error: e });
      return {};
    }
  }

  if (typeof webPubSubContext === "object" && webPubSubContext !== null) {
    const data = webPubSubContext as Record<string, unknown>;
    const eventName = (data.eventName as string) || ((data.event as { name?: string })?.name) || "";
    const hub = (data.hub as string) || "";
    const connectionId = (data.connectionId as string) || "";
    return {
      eventName,
      hub,
      connectionId,
      userId: extractUserId(data)
    };
  }

  return {};
}

/**
 * Extracts event data from binding context
 * @param bindingContext - Binding context (string or object)
 * @param context - Azure Functions context for logging
 * @returns Event data extracted from binding context
 */
function extractEventDataFromBindingContext(
  bindingContext: unknown,
  context: Context
): Partial<EventData> {
  if (!bindingContext) {
    return {};
  }

  if (typeof bindingContext === "string") {
    try {
      const parsed = JSON.parse(bindingContext);
      return {
        eventName: parsed.eventName || parsed.event?.name || "",
        hub: parsed.hub || "",
        connectionId: parsed.connectionId || "",
        userId: extractUserId(parsed)
      };
    } catch (e) {
      // Error is intentionally ignored as we want to continue with empty object
      context.log.warn("Failed to parse bindingData.webPubSubContext as JSON", { error: e });
      return {};
    }
  }

  if (typeof bindingContext === "object" && bindingContext !== null) {
    const data = bindingContext as Record<string, unknown>;
    const eventName = (data.eventName as string) || ((data.event as { name?: string })?.name) || "";
    const hub = (data.hub as string) || "";
    const connectionId = (data.connectionId as string) || "";
    return {
      eventName,
      hub,
      connectionId,
      userId: extractUserId(data)
    };
  }

  return {};
}

/**
 * Extracts event data from request body
 * @param body - Request body (string or object)
 * @returns Event data extracted from body
 */
function extractEventDataFromBody(body: unknown): Partial<EventData> {
  if (!body) {
    return {};
  }

  let bodyData: unknown = body;
  if (typeof body === "string") {
    try {
      bodyData = JSON.parse(body);
    } catch {
      return {};
    }
  }

  if (!bodyData || typeof bodyData !== "object" || bodyData === null) {
    return {};
  }

  const data = bodyData as Record<string, unknown>;
  
  // Extract event name from various possible locations
  let eventName = "";
  if (typeof data.eventName === "string") {
    eventName = data.eventName;
  } else if (typeof data.event === "object" && data.event !== null && "name" in data.event && typeof data.event.name === "string") {
    eventName = data.event.name;
  } else if (typeof data.type === "string") {
    eventName = data.type;
  }

  const hub = (typeof data.hub === "string" ? data.hub : "") || "";
  const connectionId = (typeof data.connectionId === "string" ? data.connectionId : "") || "";

  return {
    eventName,
    hub,
    connectionId,
    userId: extractUserId(data)
  };
}

/**
 * Extracts additional event data from headers
 * @param headers - Request headers
 * @returns Event data extracted from headers
 */
function extractEventDataFromHeaders(headers: Record<string, unknown>): Partial<EventData> {
  return {
    hub: (headers["ce-hub"] as string) || (headers["Ce-Hub"] as string) || "",
    connectionId: (headers["ce-connectionid"] as string) || (headers["Ce-Connectionid"] as string) || "",
    userId: (headers["ce-userid"] as string) || (headers["Ce-Userid"] as string) || ""
  };
}

/**
 * Parses event data from all available sources
 * @param req - HTTP request
 * @param context - Azure Functions context
 * @param webPubSubContext - WebPubSub context from binding
 * @returns Parsed event data
 */
function parseEventData(
  req: HttpRequest,
  context: Context,
  webPubSubContext: unknown
): EventData {
  const headers = req.headers || {};
  
  let eventName = extractEventNameFromHeaders(headers);
  let hub = "";
  let connectionId = "";
  let userId = "";

  if (!eventName && webPubSubContext) {
    const contextData = extractEventDataFromWebPubSubContext(webPubSubContext, context);
    eventName = eventName || contextData.eventName || "";
    hub = hub || contextData.hub || "";
    connectionId = connectionId || contextData.connectionId || "";
    userId = userId || contextData.userId || "";
  }

  if (!eventName && context.bindingData?.webPubSubContext) {
    const bindingData = extractEventDataFromBindingContext(context.bindingData.webPubSubContext, context);
    eventName = eventName || bindingData.eventName || "";
    hub = hub || bindingData.hub || "";
    connectionId = connectionId || bindingData.connectionId || "";
    userId = userId || bindingData.userId || "";
  }

  if (!eventName && req.body) {
    const bodyData = extractEventDataFromBody(req.body);
    eventName = eventName || bodyData.eventName || "";
    hub = hub || bodyData.hub || "";
    connectionId = connectionId || bodyData.connectionId || "";
    userId = userId || bodyData.userId || "";
  }

  const headerData = extractEventDataFromHeaders(headers);
  hub = hub || headerData.hub || "";
  connectionId = connectionId || headerData.connectionId || "";
  userId = userId || headerData.userId || "";

  if (!eventName && hub) {
    eventName = "connect";
  }

  return {
    eventName: eventName.toLowerCase().trim(),
    hub,
    connectionId,
    userId
  };
}

/**
 * Builds context data for WebSocketEventRequest
 * @param webPubSubContext - WebPubSub context
 * @param req - HTTP request
 * @param eventData - Parsed event data
 * @returns Context data object
 */
function buildContextData(
  webPubSubContext: unknown,
  req: HttpRequest,
  eventData: EventData
): Record<string, unknown> {
  const contextData = (webPubSubContext || req.body || {}) as Record<string, unknown>;
  
  if (eventData.hub && !contextData.hub) {
    contextData.hub = eventData.hub;
  }
  if (eventData.connectionId && !contextData.connectionId) {
    contextData.connectionId = eventData.connectionId;
  }
  if (eventData.userId && !contextData.userId) {
    const user = contextData.user as Record<string, unknown> | undefined;
    const claims = contextData.claims as Record<string, unknown> | undefined;
    if (!user?.id && !claims?.userId) {
      contextData.userId = eventData.userId;
    }
  }

  return contextData;
}

/**
 * Handles connect/connected events
 * @param request - WebSocket event request
 * @param eventName - Event name
 * @param serviceContainer - Service container
 * @param context - Azure Functions context
 * @returns HTTP response
 */
async function handleConnectEvent(
  request: WebSocketEventRequest,
  eventName: string,
  serviceContainer: ServiceContainer,
  context: Context
): Promise<void> {
  const applicationService = serviceContainer.resolve<WebSocketConnectionApplicationService>(
    "WebSocketConnectionApplicationService"
  );
  const response = await applicationService.handleConnection(request);
  
  await logWebPubSubErrorIfAny(response, request, eventName, serviceContainer, context, { serviceName: "handleConnection" });
  
  if (response.status === 200) {
    await logWebPubSubEvent(eventName, request, serviceContainer, context);
  }
  
  context.res = { 
    status: response.status || 200,
    headers: { "Content-Type": "application/json" },
    body: response.status === 200 ? undefined : { error: response.message }
  };
}

/**
 * Handles disconnected events
 * @param request - WebSocket event request
 * @param eventName - Event name
 * @param serviceContainer - Service container
 * @param context - Azure Functions context
 * @returns HTTP response
 */
async function handleDisconnectEvent(
  request: WebSocketEventRequest,
  eventName: string,
  serviceContainer: ServiceContainer,
  context: Context
): Promise<void> {
  const connectionService = serviceContainer.resolve<WebSocketConnectionApplicationService>(
    "WebSocketConnectionApplicationService"
  );
  const disconnectResponse = await connectionService.handleDisconnection(request, context);
  await logWebPubSubErrorIfAny(disconnectResponse, request, eventName, serviceContainer, context, { serviceName: "handleDisconnection" });

  const cmService = serviceContainer.resolve<ContactManagerDisconnectApplicationService>(
    "ContactManagerDisconnectApplicationService"
  );
  const cmResponse = await cmService.handleContactManagerDisconnect(request);
  await logWebPubSubErrorIfAny(cmResponse, request, eventName, serviceContainer, context, { serviceName: "ContactManagerDisconnect" });

  if (disconnectResponse.status === 200) {
    await logWebPubSubEvent(eventName, request, serviceContainer, context);
  }

  context.res = { status: 200 };
}

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

    const eventData = parseEventData(req, context, webPubSubContext);

    if (!eventData.eventName) {
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

    const contextData = buildContextData(webPubSubContext, req, eventData);
    const request = WebSocketEventRequest.fromWebPubSubContext(contextData, eventData.eventName);

    if (eventData.eventName === "connect" || eventData.eventName === "connected") {
      await handleConnectEvent(request, eventData.eventName, serviceContainer, context);
      return;
    }

    if (eventData.eventName === "disconnected") {
      await handleDisconnectEvent(request, eventData.eventName, serviceContainer, context);
      return;
    }

    context.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: `Unknown event name: ${eventData.eventName}` }
    };
  },
  {
    genericMessage: "Error processing WebPubSub event",
    showStackInDev: true,
  }
);

export default webPubSubEvents;

