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
    let bodyData: any = req.body;
    if (typeof req.body === "string") {
      try {
        bodyData = JSON.parse(req.body);
      } catch (e) {
        bodyData = null;
      }
    }

    if (bodyData && typeof bodyData === "object") {
      eventName = eventName || bodyData.eventName || bodyData.event?.name || bodyData.type || "";
      hub = hub || bodyData.hub || "";
      connectionId = connectionId || bodyData.connectionId || "";
      userId = userId || bodyData.userId || bodyData.user?.id || bodyData.claims?.userId || "";
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

  try {
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
      
      if (response.status !== 200) {
        context.log.error("handleConnection error", {
          status: response.status,
          message: response.message,
          userId: request.userId
        });
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
      await connectionService.handleDisconnection(request, context);

      const cmService = serviceContainer.resolve<ContactManagerDisconnectApplicationService>(
        "ContactManagerDisconnectApplicationService"
      );
      await cmService.handleContactManagerDisconnect(request);

      try {
        const webPubSubService = serviceContainer.resolve<any>("WebPubSubService");
        await webPubSubService.syncAllUsersWithDatabase();
      } catch (syncError: any) {
        context.log.warn("Sync error", syncError);
      }

      context.res = { status: 200 };
      return;
    }

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

