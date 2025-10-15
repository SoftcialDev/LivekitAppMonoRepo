import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { IWebPubSubService } from "../shared/domain/interfaces/IWebPubSubService";

/**
 * Azure Function: Debug sync functionality
 * 
 * @remarks
 * This function allows you to test and debug the sync functionality
 * without triggering actual WebSocket events.
 *
 * @param context - Azure Functions execution context
 * @param req - HTTP request object
 */
const debugSync: AzureFunction = async (context: Context, req: HttpRequest) => {
  console.log('🔧 [DEBUG] Debug sync endpoint called');
  
  try {
    const serviceContainer = ServiceContainer.getInstance();
    serviceContainer.initialize();
    console.log('🔧 [DEBUG] ServiceContainer initialized');

    const webPubSubService = serviceContainer.resolve<IWebPubSubService>('WebPubSubService');
    console.log('🔧 [DEBUG] WebPubSubService resolved');

    console.log('🔧 [DEBUG] Calling debugSync...');
    const result = await webPubSubService.debugSync();
    
    console.log('🔧 [DEBUG] Debug sync completed successfully');
    console.log('🔧 [DEBUG] Result:', JSON.stringify(result, null, 2));

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: true,
        message: 'Debug sync completed',
        result: result
      }
    };
  } catch (error: any) {
    console.error('🔧 [DEBUG] Debug sync failed:', error);
    console.error('🔧 [DEBUG] Error stack:', error.stack);
    
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: false,
        message: 'Debug sync failed',
        error: error.message,
        stack: error.stack
      }
    };
  }
};

export default debugSync;
