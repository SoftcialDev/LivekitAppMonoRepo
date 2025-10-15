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
  console.log('🔌 [DISCONNECT] Handler triggered');
  console.log('🔌 [DISCONNECT] Context:', JSON.stringify(context.bindingData, null, 2));
  
  try {
    const serviceContainer = ServiceContainer.getInstance();
    serviceContainer.initialize();
    console.log('🔌 [DISCONNECT] ServiceContainer initialized');

    const request = WebSocketEventRequest.fromContext(context);
    console.log('🔌 [DISCONNECT] Request parsed:', {
      userId: request.userId,
      phase: request.phase,
      connectionId: request.connectionId,
      hub: request.hub
    });

    // 1) Generic presence + streaming logic for all users
    console.log('🔌 [DISCONNECT] Resolving WebSocketConnectionApplicationService...');
    const connectionService = serviceContainer.resolve<WebSocketConnectionApplicationService>('WebSocketConnectionApplicationService');
    console.log('🔌 [DISCONNECT] WebSocketConnectionApplicationService resolved successfully');
    console.log('🔌 [DISCONNECT] Calling handleDisconnection...');
    const disconnectResult = await connectionService.handleDisconnection(request);
    console.log('🔌 [DISCONNECT] handleDisconnection completed with result:', disconnectResult);

    // 2) Additional Contact Manager logic (no-op for non-CMs)
    console.log('🔌 [DISCONNECT] Resolving ContactManagerDisconnectApplicationService...');
    const cmService = serviceContainer.resolve<ContactManagerDisconnectApplicationService>('ContactManagerDisconnectApplicationService');
    console.log('🔌 [DISCONNECT] Calling handleContactManagerDisconnect...');
    await cmService.handleContactManagerDisconnect(request);
    console.log('🔌 [DISCONNECT] handleContactManagerDisconnect completed');

    // 3) Test sync directly to verify it works
    console.log('🔌 [DISCONNECT] Testing sync directly...');
    try {
      const webPubSubService = serviceContainer.resolve<any>('WebPubSubService');
      console.log('🔌 [DISCONNECT] WebPubSubService resolved for direct test');
      const syncResult = await webPubSubService.syncAllUsersWithDatabase();
      console.log('🔌 [DISCONNECT] Direct sync test completed:', syncResult);
    } catch (syncError: any) {
      console.error('🔌 [DISCONNECT] Direct sync test failed:', syncError);
      console.error('🔌 [DISCONNECT] Sync error stack:', syncError.stack);
    }

    console.log('🔌 [DISCONNECT] Handler completed successfully');
    context.res = { status: 200 };
  } catch (error: any) {
    console.error('🔌 [DISCONNECT] ERROR:', error);
    console.error('🔌 [DISCONNECT] Error stack:', error.stack);
    context.res = { status: 500, body: `Internal error: ${error.message}` };
  }
};

export default onDisconnected;
