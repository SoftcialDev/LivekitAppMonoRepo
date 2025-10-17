import { AzureFunction, Context } from "@azure/functions";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { WebSocketEventRequest } from "../shared/domain/value-objects/WebSocketEventRequest";
import { WebSocketConnectionApplicationService } from "../shared/application/services/WebSocketConnectionApplicationService";
import { ContactManagerDisconnectApplicationService } from "../shared/application/services/ContactManagerDisconnectApplicationService";

/**
 * Azure Function: handles WebSocket disconnection events
 * 
 * @remarks
 * 1. Extracts user information from connection context.  
 * 2. Sets user offline status and stops streaming sessions.  
 * 3. Handles Contact Manager specific logic (if applicable).  
 * 4. Returns success response.
 *
 * @param context - Azure Functions execution context with connection data
 */
const onDisconnected: AzureFunction = async (context: Context) => {
  try {
    const serviceContainer = ServiceContainer.getInstance();
    serviceContainer.initialize();

    const request = WebSocketEventRequest.fromContext(context);

    // 1) Generic presence + streaming logic for all users
    const connectionService = serviceContainer.resolve<WebSocketConnectionApplicationService>('WebSocketConnectionApplicationService');
    await connectionService.handleDisconnection(request, context);

    // 2) Additional Contact Manager logic (no-op for non-CMs)
    const cmService = serviceContainer.resolve<ContactManagerDisconnectApplicationService>('ContactManagerDisconnectApplicationService');
    await cmService.handleContactManagerDisconnect(request);

    // 3) Sync all users with database
    try {
      const webPubSubService = serviceContainer.resolve<any>('WebPubSubService');
      await webPubSubService.syncAllUsersWithDatabase();
    } catch (syncError: any) {
      // Sync errors are non-critical, continue execution
    }

    context.res = { status: 200 };
  } catch (error: any) {
    context.res = { status: 500, body: `Internal error: ${error.message}` };
  }
};

export default onDisconnected;
