import { AzureFunction, Context } from "@azure/functions";
import { config } from "../shared/config";
import { listAllGroupsAndUsers } from "../shared/services/webPubSubService";

/**
 * Debug endpoint to list Web PubSub connections using existing service
 * This is for debugging purposes only - should be removed in production
 */
const debugWebPubSubConnections: AzureFunction = async (context: Context): Promise<void> => {
  context.log('🔍 [DEBUG] Starting debug Web PubSub connections using existing service...');

  try {
    const hubName = config.webPubSubHubName;
    const endpoint = config.webPubSubEndpoint;
    const accessKey = config.webPubSubKey;

    context.log(`[DEBUG] Hub: ${hubName}`);
    context.log(`[DEBUG] Endpoint: ${endpoint}`);
    context.log(`[DEBUG] Access Key: ${accessKey ? '***' + accessKey.slice(-4) : 'NOT SET'}`);

    // Use the existing service that already works
    context.log(`[DEBUG] Calling listAllGroupsAndUsers from existing service...`);
    
    try {
      await listAllGroupsAndUsers();
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
        note: 'Check the logs above for detailed connection information'
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
