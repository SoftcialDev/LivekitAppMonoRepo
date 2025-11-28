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
  try {
    context.log.info("WebPubSubEvents received", {
      method: req.method,
      url: req.url,
      hasWebPubSubContext: !!webPubSubContext,
      webPubSubContext: JSON.stringify(webPubSubContext),
      bindingData: JSON.stringify(context.bindingData),
      body: JSON.stringify(req.body),
      headers: JSON.stringify(req.headers)
    });

    if (req.method === "OPTIONS") {
      context.res = {
        status: 200,
        headers: {
          "WebHook-Allowed-Origin": "*"
        }
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

    const bindingData = context.bindingData?.webPubSubContext || webPubSubContext || {};

    if (bindingData && Object.keys(bindingData).length > 0) {
      eventName = bindingData.eventName || bindingData.event?.name || "";
      hub = bindingData.hub || "";
      connectionId = bindingData.connectionId || "";
      userId = bindingData.userId || bindingData.user?.id || bindingData.claims?.userId || "";
    }

    if (!eventName && req.body) {
      if (typeof req.body === "string") {
        try {
          const parsed = JSON.parse(req.body);
          eventName = parsed.eventName || parsed.event?.name || "";
          hub = hub || parsed.hub || "";
          connectionId = connectionId || parsed.connectionId || "";
          userId = userId || parsed.userId || parsed.user?.id || "";
        } catch (e) {
          context.log.warn("Failed to parse body as JSON", { body: req.body });
        }
      } else {
        eventName = eventName || req.body.eventName || req.body.event?.name || "";
        hub = hub || req.body.hub || "";
        connectionId = connectionId || req.body.connectionId || "";
        userId = userId || req.body.userId || req.body.user?.id || "";
      }
    }

    if (!eventName) {
      const ceEventName = req.headers?.["ce-eventname"] || req.headers?.["Ce-Eventname"];
      if (ceEventName) {
        eventName = String(ceEventName).toLowerCase();
      }
    }

    eventName = eventName.toLowerCase().trim();

    context.log.info("WebPubSub event parsed", {
      hub,
      eventName,
      connectionId,
      userId,
      rawContext: JSON.stringify(webPubSubContext),
      rawBody: JSON.stringify(req.body)
    });

    if (!eventName) {
      context.log.error("Missing eventName", {
        webPubSubContext,
        body: req.body,
        headers: req.headers
      });
      context.res = {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: { error: "Missing eventName in request" }
      };
      return;
    }

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

