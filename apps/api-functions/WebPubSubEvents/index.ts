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

    const eventName = webPubSubContext?.eventName || req.body?.eventName || "";
    const hub = webPubSubContext?.hub || "";
    const connectionId = webPubSubContext?.connectionId || "";
    const userId = webPubSubContext?.userId || webPubSubContext?.user?.id || "";

    context.log.info("WebPubSub event received", {
      hub,
      eventName,
      connectionId,
      userId
    });

    const serviceContainer = ServiceContainer.getInstance();
    serviceContainer.initialize();

    const request = WebSocketEventRequest.fromWebPubSubContext(
      webPubSubContext,
      eventName
    );

    if (eventName === "connect" || eventName === "connected") {
      const applicationService = serviceContainer.resolve<WebSocketConnectionApplicationService>(
        "WebSocketConnectionApplicationService"
      );
      const response = await applicationService.handleConnection(request);
      context.res = { status: response.status };
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

