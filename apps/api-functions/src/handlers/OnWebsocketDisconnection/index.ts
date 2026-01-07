import { AzureFunction, Context } from "@azure/functions";
import { withErrorHandler } from '../../index';
import { ServiceContainer } from '../../index';
import { WebSocketEventRequest } from '../../index';
import { WebSocketConnectionApplicationService } from '../../index';
import { ContactManagerDisconnectApplicationService } from '../../index';

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
const onDisconnected: AzureFunction = withErrorHandler(
  async (context: Context) => {
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
      context.log.warn(`[OnWebsocketDisconnection] Sync error (non-critical): ${syncError.message}`);
    }

    context.res = { status: 200 };
  },
  {
    genericMessage: "Error processing WebSocket disconnection",
    showStackInDev: true,
  }
);

export default onDisconnected;
