import { AzureFunction, Context } from "@azure/functions";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { WebSocketEventRequest } from "../shared/domain/value-objects/WebSocketEventRequest";
import { WebSocketConnectionApplicationService } from "../shared/application/services/WebSocketConnectionApplicationService";

/**
 * Azure Function: handles WebSocket connection events
 * 
 * @remarks
 * 1. Extracts user information from connection context.  
 * 2. Sets user online status.  
 * 3. Logs connection event.  
 * 4. Returns success response.
 *
 * @param context - Azure Functions execution context with connection data
 */
const onConnected: AzureFunction = async (context: Context) => {
  try {
    const serviceContainer = ServiceContainer.getInstance();
    serviceContainer.initialize();

    const applicationService = serviceContainer.resolve<WebSocketConnectionApplicationService>('WebSocketConnectionApplicationService');
    const request = WebSocketEventRequest.fromContext(context);
    
    const response = await applicationService.handleConnection(request);
    
    context.res = { status: response.status };
  } catch (error: any) {
    context.res = { status: 500, body: `Internal error: ${error.message}` };
  }
};

export default onConnected;
