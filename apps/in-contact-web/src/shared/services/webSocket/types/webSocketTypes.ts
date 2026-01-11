/**
 * @fileoverview WebSocket type definitions
 * @summary Type definitions for WebSocket service and messages
 * @description Provides type safety for WebSocket messages and service interfaces
 */

/**
 * Base interface for all WebSocket messages
 */
export interface IBaseWebSocketMessage {
  /**
   * Message type identifier
   */
  type: string;

  /**
   * Optional timestamp when message was sent
   */
  timestamp?: string;
}

/**
 * Callback invoked when a message arrives (already JSON-parsed)
 * 
 * @template T Payload type
 */
export type MessageHandler<T = unknown> = (data: T) => void;

/**
 * Callback invoked on connection lifecycle transitions
 */
export type VoidHandler = () => void;

/**
 * Shape returned by negotiate endpoint
 */
export interface INegotiateResponse {
  /**
   * JWT or SAS token for client access (already audience-scoped)
   */
  token: string;

  /**
   * Service endpoint, e.g. https://<res>.webpubsub.azure.com
   */
  endpoint: string;

  /**
   * Hub to connect to (used to compose the client URL)
   */
  hubName: string;
}

// Re-export manager and validator types for convenience
export type { IConnectionEventHandlers } from './webSocketManagerTypes';
export type { IConnectionValidationResult } from './webSocketValidatorTypes';

/**
 * Interface for WebSocket message handlers
 */
export interface IWebSocketHandler {
  /**
   * Message type this handler processes
   */
  readonly messageType: string;

  /**
   * Checks if this handler can process the given message
   * 
   * @param message - WebSocket message to check
   * @returns True if this handler can process the message
   */
  canHandle(message: unknown): boolean;

  /**
   * Handles the message
   * 
   * @param message - WebSocket message
   */
  handle(message: unknown): void;
}

