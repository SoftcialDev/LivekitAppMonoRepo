import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { WebSocketEventRequest } from "../shared/domain/value-objects/WebSocketEventRequest";
import { WebSocketConnectionApplicationService } from "../shared/application/services/WebSocketConnectionApplicationService";
import { ContactManagerDisconnectApplicationService } from "../shared/application/services/ContactManagerDisconnectApplicationService";

const webPubSubEvents: AzureFunction = async (
  context: Context,
  req: HttpRequest,
  webPubSubContext: any
): Promise<void> => {
  context.log.info("WebPubSubEvents function started", {
    method: req.method,
    url: req.url,
    hasWebPubSubContext: !!webPubSubContext,
    webPubSubContextType: typeof webPubSubContext,
    bindingDataKeys: Object.keys(context.bindingData || {}),
    bodyType: typeof req.body,
    headerKeys: Object.keys(req.headers || {})
  });

  if (req.method === "OPTIONS") {
    context.res = {
      status: 200,
      headers: {
        "WebHook-Allowed-Origin": "*"
      }
    };
    context.log.info("OPTIONS request handled for WebHook-Allowed-Origin");
    return;
  }

  if (req.method !== "POST") {
    context.res = {
      status: 405,
      headers: { "Content-Type": "application/json" },
      body: { error: "Method not allowed" }
    };
    context.log.warn(`Method not allowed: ${req.method}`);
    return;
  }

  let eventName = "";
  let hub = "";
  let connectionId = "";
  let userId = "";

  const headers = req.headers || {};
  const allHeaderKeys = Object.keys(headers);
  context.log.verbose("Headers available", { 
    keys: allHeaderKeys,
    ceHeaders: allHeaderKeys.filter(k => k.toLowerCase().startsWith("ce-"))
  });

  for (const key of allHeaderKeys) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === "ce-eventname" || lowerKey === "ce-event") {
      eventName = String(headers[key]).toLowerCase().trim();
      context.log.verbose(`Found eventName in header ${key}: ${eventName}`);
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
        context.log.verbose(`Parsed webPubSubContext from string, eventName: ${eventName}`);
      } catch (e) {
        context.log.warn("Failed to parse webPubSubContext as JSON", { error: e });
      }
    } else if (typeof webPubSubContext === "object") {
      eventName = webPubSubContext.eventName || webPubSubContext.event?.name || "";
      hub = webPubSubContext.hub || "";
      connectionId = webPubSubContext.connectionId || "";
      userId = webPubSubContext.userId || webPubSubContext.user?.id || webPubSubContext.claims?.userId || "";
      context.log.verbose(`Extracted from webPubSubContext object, eventName: ${eventName}`);
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
        context.log.verbose(`Parsed bindingData.webPubSubContext from string, eventName: ${eventName}`);
      } catch (e) {
        context.log.warn("Failed to parse bindingData.webPubSubContext as JSON", { error: e });
      }
    } else if (typeof bindingContext === "object") {
      eventName = eventName || bindingContext.eventName || bindingContext.event?.name || "";
      hub = hub || bindingContext.hub || "";
      connectionId = connectionId || bindingContext.connectionId || "";
      userId = userId || bindingContext.userId || bindingContext.user?.id || bindingContext.claims?.userId || "";
      context.log.verbose(`Extracted from bindingData.webPubSubContext object, eventName: ${eventName}`);
    }
  }

  if (!eventName && req.body) {
    let bodyData: any = req.body;
    if (typeof req.body === "string") {
      try {
        bodyData = JSON.parse(req.body);
        context.log.verbose("Parsed request body from string");
      } catch (e) {
        context.log.warn("Failed to parse body as JSON", { body: req.body });
        bodyData = null;
      }
    }

    if (bodyData && typeof bodyData === "object") {
      eventName = eventName || bodyData.eventName || bodyData.event?.name || bodyData.type || "";
      hub = hub || bodyData.hub || "";
      connectionId = connectionId || bodyData.connectionId || "";
      userId = userId || bodyData.userId || bodyData.user?.id || bodyData.claims?.userId || "";
      context.log.verbose(`Extracted from request body, eventName: ${eventName}`);
    }
  }

  if (!eventName) {
    const hubHeader = headers["ce-hub"] || headers["Ce-Hub"];
    if (hubHeader) {
      hub = String(hubHeader);
    }
    const connectionIdHeader = headers["ce-connectionid"] || headers["Ce-Connectionid"];
    if (connectionIdHeader) {
      connectionId = String(connectionIdHeader);
    }
    const userIdHeader = headers["ce-userid"] || headers["Ce-Userid"];
    if (userIdHeader) {
      userId = String(userIdHeader);
    }

    if (hub && !eventName) {
      context.log.warn("Handshake detected (has hub but no eventName), treating as connect");
      eventName = "connect";
    }
  }

  eventName = eventName.toLowerCase().trim();

  if (!hub) {
    hub = headers["ce-hub"] || headers["Ce-Hub"] || "";
  }
  if (!connectionId) {
    connectionId = headers["ce-connectionid"] || headers["Ce-Connectionid"] || "";
  }
  if (!userId) {
    userId = headers["ce-userid"] || headers["Ce-Userid"] || "";
  }

  context.log.info("WebPubSub event parsed", {
    hub,
    eventName,
    connectionId,
    userId,
    hasWebPubSubContext: !!webPubSubContext,
    hasBindingData: !!context.bindingData?.webPubSubContext
  });

  if (!eventName) {
    context.log.error("Missing eventName after all extraction attempts", {
      method: req.method,
      webPubSubContextType: typeof webPubSubContext,
      webPubSubContext: JSON.stringify(webPubSubContext),
      bindingData: JSON.stringify(context.bindingData),
      body: JSON.stringify(req.body),
      headers: JSON.stringify(headers)
    });
    context.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: `Unknown event name: ${eventName || ""}` }
    };
    return;
  }

  try {
    const serviceContainer = ServiceContainer.getInstance();
    serviceContainer.initialize();

    const request = WebSocketEventRequest.fromWebPubSubContext(
      webPubSubContext || req.body || {},
      eventName
    );

    if (eventName === "connect" || eventName === "connected") {
      const applicationService = serviceContainer.resolve<WebSocketConnectionApplicationService>(
        "WebSocketConnectionApplicationService"
      );
      const response = await applicationService.handleConnection(request);
      context.res = { status: response.status || 200 };
      context.log.info(`Handled ${eventName} event for user ${userId} with status ${response.status || 200}`);
      return;
    }

    if (eventName === "disconnected") {
      const connectionService = serviceContainer.resolve<WebSocketConnectionApplicationService>(
        "WebSocketConnectionApplicationService"
      );
      await connectionService.handleDisconnection(request, context);

      const cmService = serviceContainer.resolve<ContactManagerDisconnectApplicationService>(
        "ContactManagerDisconnectApplicationService"
      );
      await cmService.handleContactManagerDisconnect(request);

      try {
        const webPubSubService = serviceContainer.resolve<any>("WebPubSubService");
        await webPubSubService.syncAllUsersWithDatabase();
      } catch (syncError: any) {
        context.log.warn("Sync error (non-critical)", syncError);
      }

      context.res = { status: 200 };
      context.log.info(`Handled disconnected event for user ${userId}`);
      return;
    }

    context.log.warn("Unknown event name", { eventName });
    context.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: `Unknown event name: ${eventName}` }
    };
  } catch (error: any) {
    context.log.error("Error processing WebPubSub event", {
      error: error.message,
      stack: error.stack
    });
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: "Internal server error" }
    };
  }
};

export default webPubSubEvents;

