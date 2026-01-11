/**
 * @fileoverview WebSocket connection manager
 * @summary Manages WebSocket client creation and lifecycle
 * @description Handles connection setup, event handler wiring, and lifecycle events
 */

import {
  WebPubSubClient,
  WebPubSubJsonProtocol,
} from '@azure/web-pubsub-client';
import apiClient from '@/shared/api/apiClient';
import { logInfo, logError, logWarn, logDebug } from '@/shared/utils/logger';
import type { INegotiateResponse } from '../types/webSocketTypes';
import type { IConnectionEventHandlers } from '../types/webSocketManagerTypes';
import { WEBSOCKET_GROUPS } from '../constants/webSocketConstants';
import { WebSocketMessageParser } from '../utils/WebSocketMessageParser';
import type { WebSocketGroupManager } from './WebSocketGroupManager';
import { WebSocketHandshakeRetryManager } from './WebSocketHandshakeRetryManager';

/**
 * WebSocket connection manager
 * 
 * Handles:
 * - Client creation and negotiation
 * - Event handler setup
 * - Lifecycle event management
 * - Group management integration
 * - Handshake retry logic for 500 errors
 */
export class WebSocketConnectionManager {
  private static handshakeRetryManager = new WebSocketHandshakeRetryManager();

  /**
   * Creates a new WebSocket client and sets up event handlers
   * 
   * Uses handshake retry manager to handle 500 errors during WSS handshake.
   * Checks for active connection before retrying to avoid redundant attempts.
   * 
   * @param params - Connection parameters
   * @returns Promise resolving to the created client
   * @throws If negotiation or client creation fails
   */
  static async createClient(params: {
    currentUserEmail: string | null;
    groupManager: WebSocketGroupManager;
    eventHandlers: IConnectionEventHandlers;
    onReconnectNeeded: (reason: string) => void;
    setConnected: (connected: boolean) => void;
    clearReconnectTimer: () => void;
    resetBackoff: () => void;
    isConnected: () => boolean;
  }): Promise<WebPubSubClient> {
    const {
      currentUserEmail,
      groupManager,
      eventHandlers,
      onReconnectNeeded,
      setConnected,
      clearReconnectTimer,
      resetBackoff,
      isConnected,
    } = params;

    // Wrap the entire connection process in handshake retry logic
    return await this.handshakeRetryManager.connectWithRetry(
      async () => {
        // Negotiate token/URL (this works fine, no retry needed here)
        const negotiateResult = await this.negotiateConnection();

        // Create client URL
        const clientUrl = this.buildClientUrl(negotiateResult);

        // Create client with JSON subprotocol
        const client = new WebPubSubClient(clientUrl, {
          protocol: WebPubSubJsonProtocol(),
        });

        // Setup event handlers
        this.setupMessageHandlers(client, eventHandlers);
        this.setupLifecycleHandlers(client, {
          currentUserEmail,
          groupManager,
          eventHandlers,
          onReconnectNeeded,
          setConnected,
          clearReconnectTimer,
          resetBackoff,
        });

        // Start the client (handshake) - THIS IS WHERE 500 ERROR OCCURS
        try {
          await client.start();
          logInfo('WebSocket client started successfully', {
            email: currentUserEmail,
          });
          return client;
        } catch (error) {
          // Check if it's a handshake error (will be caught by retry manager)
          if (this.handshakeRetryManager.isHandshakeError(error)) {
            logWarn('Handshake error detected', { error, email: currentUserEmail });
            throw error; // Will be retried by connectWithRetry
          }

          // Not a handshake error, handle normally
          logError('Failed to start WebSocket client (non-handshake error)', {
            error,
            email: currentUserEmail,
          });
          setConnected(false);
          onReconnectNeeded('start failed');
          throw error;
        }
      },
      isConnected
    );
  }

  /**
   * Negotiates connection with the backend to get token and endpoint
   * 
   * @returns Negotiation response with token, endpoint, and hub name
   * @throws If negotiation fails
   */
  private static async negotiateConnection(): Promise<INegotiateResponse> {
    const { data } = await apiClient.get<INegotiateResponse>(
      '/api/WebPubSubToken'
    );
    return data;
  }

  /**
   * Builds WebSocket client URL from negotiation response
   * 
   * @param negotiateResult - Negotiation response
   * @returns WebSocket client URL
   */
  private static buildClientUrl(
    negotiateResult: INegotiateResponse
  ): string {
    const { token, endpoint, hubName } = negotiateResult;

    // Convert HTTPS endpoint to WSS
    const wssUrl = endpoint.replace(/^https?:\/\//, 'wss://');

    // Build client URL with access token
    return `${wssUrl}/client/hubs/${hubName}?access_token=${encodeURIComponent(token)}`;
  }

  /**
   * Sets up message event handlers
   * 
   * @param client - WebPubSub client
   * @param eventHandlers - Event handler callbacks
   */
  private static setupMessageHandlers(
    client: WebPubSubClient,
    eventHandlers: IConnectionEventHandlers
  ): void {
    const messageHandler = (event: unknown): void => {
      // Parse message using parser utility
      const parsed = this.parseMessage(event);
      if (!parsed) {
        return;
      }

      // Try registered handlers first (SRP-based)
      let handled = false;
      for (const handler of eventHandlers.registeredHandlers) {
        if (handler.canHandle(parsed)) {
          handler.handle(parsed);
          handled = true;
          break; // Only one handler per message type
        }
      }

      // Fall back to legacy message handlers for backward compatibility
      if (!handled) {
        for (const handler of eventHandlers.legacyMessageHandlers) {
          try {
            handler(parsed);
          } catch (error) {
            logWarn('Error in legacy message handler', { error });
          }
        }
      }
    };

    client.on('group-message', messageHandler);
    client.on('server-message', messageHandler);
  }

  /**
   * Parses a message event
   * 
   * @param event - Raw event
   * @returns Parsed message or null
   */
  private static parseMessage(event: unknown): unknown | null {
    return WebSocketMessageParser.parse(event);
  }

  /**
   * Sets up lifecycle event handlers (connected/disconnected)
   * 
   * @param client - WebPubSub client
   * @param params - Lifecycle handler parameters
   */
  private static setupLifecycleHandlers(
    client: WebPubSubClient,
    params: {
      currentUserEmail: string | null;
      groupManager: WebSocketGroupManager;
      eventHandlers: IConnectionEventHandlers;
      onReconnectNeeded: (reason: string) => void;
      setConnected: (connected: boolean) => void;
      clearReconnectTimer: () => void;
      resetBackoff: () => void;
    }
  ): void {
    const {
      currentUserEmail,
      groupManager,
      eventHandlers,
      onReconnectNeeded,
      setConnected,
      clearReconnectTimer,
      resetBackoff,
    } = params;

    // Connected handler
    client.on('connected', async () => {
      logInfo('WebSocket connected', { email: currentUserEmail });

      setConnected(true);
      clearReconnectTimer();
      resetBackoff();

      // Ensure default groups exist in memory
      if (currentUserEmail) {
        groupManager.rememberGroup(currentUserEmail);
      }
      groupManager.rememberGroup(WEBSOCKET_GROUPS.PRESENCE);

      // Re-join all remembered groups
      await groupManager.rejoinAllGroups(client);

      // Notify external subscribers
      for (const handler of eventHandlers.onConnected) {
        try {
          handler();
        } catch (error) {
          logWarn('Error in connected handler', { error });
        }
      }
    });

    // Disconnected handler
    client.on('disconnected', () => {
      logInfo('WebSocket disconnected', { email: currentUserEmail });
      setConnected(false);

      // Notify external subscribers
      for (const handler of eventHandlers.onDisconnected) {
        try {
          handler();
        } catch (error) {
          logWarn('Error in disconnected handler', { error });
        }
      }

      onReconnectNeeded('ws disconnected');
    });
  }

  /**
   * Stops and cleans up a client
   * 
   * @param client - Client to stop
   */
  static stopClient(client: WebPubSubClient | undefined): void {
    if (!client) {
      return;
    }

    try {
      client.stop();
      logDebug('WebSocket client stopped');
    } catch (error) {
      logWarn('Error stopping WebSocket client', { error });
    }
  }
}

