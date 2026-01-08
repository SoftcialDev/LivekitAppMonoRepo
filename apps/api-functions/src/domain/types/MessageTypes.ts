/**
 * @fileoverview MessageTypes - Type definitions for message payloads
 * @summary Type definitions for WebPubSub and Chat messages
 * @description Provides type safety for message payloads used in messaging services
 */

/**
 * Base message type for WebPubSub broadcasts
 * @description Messages are serialized to JSON, so they must be serializable
 */
export type WebPubSubMessage = Record<string, unknown>;

/**
 * Base message type for Chat/Teams messages
 * @description Messages sent to Teams chats via Graph API
 */
export interface BaseChatMessage {
  type?: string;
  subject?: string;
  [key: string]: unknown;
}

/**
 * Context type for Azure Functions context in domain services
 * @description Used when context is optional for logging/error handling
 */
export type FunctionContext = Record<string, unknown> | undefined;

