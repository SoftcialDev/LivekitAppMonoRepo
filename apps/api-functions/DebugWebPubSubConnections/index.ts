import { AzureFunction, Context } from "@azure/functions";
import { config } from "../shared/config";
import { WebPubSubService } from "../shared/infrastructure/services/WebPubSubService";

/**
 * Debug endpoint to list Web PubSub connections using existing service
 * This is for debugging purposes only - should be removed in production
 */
const debugWebPubSubConnections: AzureFunction = async (context: Context): Promise<void> => {
  context.log('🔍 [DEBUG] Starting debug Web PubSub connections using existing service...');

  try {
    // Simple authentication check - require a query parameter
    const req = context.req;
    const debugKey = req?.query?.key || req?.body?.key;
    
    if (debugKey !== 'debug123') {
      context.res = {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          error: 'Unauthorized',
          message: 'Use ?key=debug123 to access this endpoint'
        }
      };
      return;
    }

    const hubName = config.webPubSubHubName;
    const endpoint = config.webPubSubEndpoint;
    const accessKey = config.webPubSubKey;

    context.log(`[DEBUG] Hub: ${hubName}`);
    context.log(`[DEBUG] Endpoint: ${endpoint}`);
    context.log(`[DEBUG] Access Key: ${accessKey ? '***' + accessKey.slice(-4) : 'NOT SET'}`);

    // Use the new DDD service
    context.log(`[DEBUG] Calling listAllGroupsAndUsers from new DDD service...`);
    
    try {
      const webPubSubService = new WebPubSubService();
      await webPubSubService.listAllGroupsAndUsers();
      context.log(`[DEBUG] ✅ listAllGroupsAndUsers completed successfully`);
    } catch (error: any) {
      context.log(`[DEBUG] ❌ listAllGroupsAndUsers failed:`, error.message);
    }

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        message: 'Debug Web PubSub connections completed using existing service',
        hubName,
        endpoint,
        note: 'Check the logs above for detailed connection information',
        usage: 'Use ?key=debug123 to access this endpoint'
      }
    };

  } catch (error: any) {
    context.log.error('❌ [DEBUG] Error in debug function:', error);
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        error: error.message,
        message: 'Debug function failed'
      }
    };
  }
};

export default debugWebPubSubConnections;
