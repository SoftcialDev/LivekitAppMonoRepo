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
  context.log('🔌 [DISCONNECT] Handler triggered');
  context.log('🔌 [DISCONNECT] Context:', JSON.stringify(context.bindingData, null, 2));
  
  try {
    const serviceContainer = ServiceContainer.getInstance();
    serviceContainer.initialize();
    context.log('🔌 [DISCONNECT] ServiceContainer initialized');

    const request = WebSocketEventRequest.fromContext(context);
    context.log('🔌 [DISCONNECT] Request parsed:', {
      userId: request.userId,
      phase: request.phase,
      connectionId: request.connectionId,
      hub: request.hub
    });

    // 1) Generic presence + streaming logic for all users
    context.log('🔌 [DISCONNECT] Resolving WebSocketConnectionApplicationService...');
    const connectionService = serviceContainer.resolve<WebSocketConnectionApplicationService>('WebSocketConnectionApplicationService');
    context.log('🔌 [DISCONNECT] WebSocketConnectionApplicationService resolved successfully');
    context.log('🔌 [DISCONNECT] Calling handleDisconnection with context...');
    const disconnectResult = await connectionService.handleDisconnection(request, context);
    context.log('🔌 [DISCONNECT] handleDisconnection completed with result:', disconnectResult);

    // 2) Additional Contact Manager logic (no-op for non-CMs)
    context.log('🔌 [DISCONNECT] Resolving ContactManagerDisconnectApplicationService...');
    const cmService = serviceContainer.resolve<ContactManagerDisconnectApplicationService>('ContactManagerDisconnectApplicationService');
    context.log('🔌 [DISCONNECT] Calling handleContactManagerDisconnect...');
    await cmService.handleContactManagerDisconnect(request);
    context.log('🔌 [DISCONNECT] handleContactManagerDisconnect completed');

    // 3) Test sync directly to verify it works
    context.log('🔌 [DISCONNECT] Testing sync directly...');
    try {
      const webPubSubService = serviceContainer.resolve<any>('WebPubSubService');
      context.log('🔌 [DISCONNECT] WebPubSubService resolved for direct test');
      const syncResult = await webPubSubService.syncAllUsersWithDatabase();
      context.log('🔌 [DISCONNECT] Direct sync test completed:', syncResult);
    } catch (syncError: any) {
      context.log.error('🔌 [DISCONNECT] Direct sync test failed:', syncError);
      context.log.error('🔌 [DISCONNECT] Sync error stack:', syncError.stack);
    }

    context.log('🔌 [DISCONNECT] Handler completed successfully');
    context.res = { status: 200 };
  } catch (error: any) {
    context.log.error('🔌 [DISCONNECT] ERROR:', error);
    context.log.error('🔌 [DISCONNECT] Error stack:', error.stack);
    context.res = { status: 500, body: `Internal error: ${error.message}` };
  }
};

export default onDisconnected;
