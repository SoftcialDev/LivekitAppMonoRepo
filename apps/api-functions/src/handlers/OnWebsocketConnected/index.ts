import { AzureFunction, Context } from "@azure/functions";
import { withErrorHandler } from '../../index';
import { ServiceContainer } from '../../index';
import { WebSocketEventRequest } from '../../index';
import { WebSocketConnectionApplicationService } from '../../index';

/**
 * Azure Function: handles WebSocket connected events
 * 
 * @remarks
 * 1. Extracts user information from connection context.  
 * 2. Sets user online status.  
 * 3. Logs connection event.  
 * 4. Returns success response.
 *
 * @param context - Azure Functions execution context with connection data
 */
const onConnected: AzureFunction = withErrorHandler(
  async (context: Context) => {
    const serviceContainer = ServiceContainer.getInstance();
    serviceContainer.initialize();

    const applicationService = serviceContainer.resolve<WebSocketConnectionApplicationService>('WebSocketConnectionApplicationService');
    const request = WebSocketEventRequest.fromContext(context);
    
    const response = await applicationService.handleConnection(request);
    
    context.res = { status: response.status };
  },
  {
    genericMessage: "Error processing WebSocket connected event",
    showStackInDev: true,
  }
);

export default onConnected;
