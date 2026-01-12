/**
 * @fileoverview ILogWebPubSubErrorOptions - Interface for WebPubSub error logging options
 * @summary Options interface for logging WebPubSub event errors
 * @description Defines the options parameter for WebPubSub error logging functions
 */

/**
 * Options for logging WebPubSub errors
 */
export interface ILogWebPubSubErrorOptions {
  /**
   * Optional name of the service that generated the error (for context)
   */
  serviceName?: string;
  /**
   * Optional endpoint path (defaults to "/api/webpubsub-events")
   */
  endpoint?: string;
  /**
   * Optional function name (defaults to "WebPubSubEvents")
   */
  functionName?: string;
}

