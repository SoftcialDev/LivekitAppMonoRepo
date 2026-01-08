/**
 * @fileoverview WebPubSubClient - Singleton WebPubSub client
 * @summary Singleton WebPubSubServiceClient instance for messaging operations
 * @description Provides a single shared WebPubSubServiceClient instance for messaging operations across the application
 */

import { WebPubSubServiceClient } from '@azure/web-pubsub';
import { AzureKeyCredential } from '@azure/core-auth';
import { config } from '../../config';
import { createLazySingletonProxy } from '../utils/LazySingletonProxy';

/**
 * Singleton class to manage WebPubSub client instances
 * Prevents multiple connections from being created
 */
class WebPubSubClientSingleton {
  private static instance: WebPubSubServiceClient | null = null;

  /**
   * Get the singleton instance of WebPubSubServiceClient
   * @returns WebPubSubServiceClient instance
   */
  static getInstance(): WebPubSubServiceClient {
    if (!WebPubSubClientSingleton.instance) {
      WebPubSubClientSingleton.instance = new WebPubSubServiceClient(
        config.webPubSubEndpoint,
        new AzureKeyCredential(config.webPubSubKey),
        config.webPubSubHubName
      );
    }
    return WebPubSubClientSingleton.instance;
  }

  /**
   * Resets the singleton instance (useful for testing)
   */
  static reset(): void {
    WebPubSubClientSingleton.instance = null;
  }
}

/**
 * Lazy-initialized WebPubSub client proxy
 * @remarks
 * Uses the generic lazy singleton proxy utility to avoid code duplication.
 * The client only initializes when first accessed, ensuring config is available.
 * After first initialization, subsequent accesses use the cached instance for optimal performance.
 */
const webPubSubClientProxy = createLazySingletonProxy(
  () => WebPubSubClientSingleton.getInstance(),
  { reset: () => WebPubSubClientSingleton.reset() }
);

/**
 * Get the singleton WebPubSub service client instance (lazy initialization)
 * @returns WebPubSubServiceClient instance
 * @remarks
 * This function ensures the WebPubSub client is only initialized when needed,
 * avoiding issues with module initialization order and config availability.
 */
export function getWebPubSubClient(): WebPubSubServiceClient {
  return webPubSubClientProxy;
}

/**
 * Export the optimized WebPubSub client proxy as default export
 * @remarks
 * This provides a lazy-initialized WebPubSub client that:
 * - Only initializes when first accessed (avoids module initialization order issues)
 * - Uses cached instance after first access (optimal performance, no proxy overhead)
 * - Maintains full backwards compatibility with existing code
 */
export default webPubSubClientProxy;

/**
 * Named export for backwards compatibility
 * @deprecated Use default export or getWebPubSubClient() instead
 */
export const webPubSubClient = webPubSubClientProxy;

/**
 * Resets both the singleton instance and cached instance (useful for testing)
 * @remarks
 * This function resets the internal singleton and cache to allow for clean testing scenarios
 */
export function resetWebPubSubClient(): void {
  webPubSubClientProxy.reset?.();
}
