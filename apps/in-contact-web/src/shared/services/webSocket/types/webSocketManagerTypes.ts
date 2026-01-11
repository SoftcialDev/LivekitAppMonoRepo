/**
 * @fileoverview WebSocket manager type definitions
 */

import type { BaseWebSocketHandler } from '../handlers/base/BaseWebSocketHandler';

/**
 * Event handler callbacks for WebSocket connection lifecycle
 */
export interface IConnectionEventHandlers {
  /**
   * Handlers to call on connection
   */
  onConnected: Set<() => void>;

  /**
   * Handlers to call on disconnection
   */
  onDisconnected: Set<() => void>;

  /**
   * Message handlers to call on messages
   */
  registeredHandlers: BaseWebSocketHandler<any>[];

  /**
   * Legacy message handlers for backward compatibility
   */
  legacyMessageHandlers: Set<(data: unknown) => void>;
}

