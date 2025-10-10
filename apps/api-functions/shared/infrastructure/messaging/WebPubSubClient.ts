/**
 * @fileoverview WebPubSubClient - Singleton WebPubSub client
 * @description Provides a singleton instance of the WebPubSub service client
 */

import { WebPubSubServiceClient } from '@azure/web-pubsub';
import { AzureKeyCredential } from '@azure/core-auth';
import { config } from '../../config';

/**
 * Singleton WebPubSub service client
 */
class WebPubSubClientSingleton {
  private static instance: WebPubSubServiceClient | null = null;

  /**
   * Gets the singleton WebPubSub service client instance
   * @returns WebPubSub service client instance
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

export const webPubSubClient = WebPubSubClientSingleton.getInstance();
