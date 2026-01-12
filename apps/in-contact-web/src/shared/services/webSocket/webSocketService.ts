/**
 * @fileoverview WebSocket service for Azure Web PubSub
 * @summary Singleton service for managing WebSocket connections
 * @description Resilient, app-wide singleton wrapper for Azure Web PubSub client sockets
 * 
 * Key features:
 * - Singleton: one socket per app
 * - Multi-listener fan-out: supports many listeners
 * - Idempotent connect: repeated connect() is safe
 * - Group memory: automatically rejoins groups on reconnect
 * - Exponential backoff with jitter for reconnect attempts
 * - Handler registry: delegates message processing to registered handlers
 */

import { WebPubSubClient } from '@azure/web-pubsub-client';
import { logInfo, logError, logDebug, logWarn } from '@/shared/utils/logger';
import type {
  MessageHandler,
  VoidHandler,
} from './types/webSocketTypes';
import type { BaseWebSocketHandler } from './handlers/base/BaseWebSocketHandler';
import { WEBSOCKET_GROUPS } from './constants/webSocketConstants';
import { WebSocketConnectionValidator } from './utils/WebSocketConnectionValidator';
import { WebSocketConnectionManager } from './managers/WebSocketConnectionManager';
import { WebSocketReconnectManager } from './managers/WebSocketReconnectManager';
import { WebSocketGroupManager } from './managers/WebSocketGroupManager';
import type { IConnectionEventHandlers } from './types/webSocketManagerTypes';

/**
 * A resilient, app-wide singleton wrapper for Azure Web PubSub client sockets
 * 
 * This service manages a single WebSocket connection for the entire application
 * and delegates message processing to registered handlers following the
 * Single Responsibility Principle.
 */
export class WebSocketService {
  // === Singleton instance ===
  private static instance: WebSocketService | null = null;

  // === Connection state ===
  private client?: WebPubSubClient;
  private currentUserEmail: string | null = null;

  /** True while the socket is open and authenticated */
  private connected = false;

  /** True while a connect() is in progress. Used to coalesce concurrent calls */
  private connecting = false;

  /** Promise shared by concurrent connect() callers (idempotent connect) */
  private connectPromise: Promise<void> | null = null;

  // === Auto-reconnect state ===
  private shouldReconnect = false;
  
  // === Managers (SRP-based separation) ===
  private readonly reconnectManager = new WebSocketReconnectManager();
  private readonly groupManager = new WebSocketGroupManager();

  // === App-level listener registries (persist across client recreation) ===
  private readonly messageHandlers = new Set<MessageHandler<any>>();
  private readonly connectedHandlers = new Set<VoidHandler>();
  private readonly disconnectedHandlers = new Set<VoidHandler>();

  // === Handler registry (for SRP-based message handling) ===
  private readonly registeredHandlers: BaseWebSocketHandler<any>[] = [];

  // === Global "online" listener ref (so we can uninstall it) ===
  private onlineListener?: () => void;

  /**
   * Get the singleton instance of WebSocketService
   * 
   * @returns Singleton instance
   */
  static getInstance(): WebSocketService {
    WebSocketService.instance ??= new WebSocketService();
    return WebSocketService.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  /**
   * Registers a message handler for WebSocket messages
   * 
   * Handlers are processed in registration order. The first handler that
   * can handle a message will process it.
   * 
   * @param handler - Handler to register
   * 
   * @example
   * ```typescript
   * const handler = new PresenceMessageHandler();
   * wsService.registerHandler(handler);
   * ```
   */
  registerHandler(handler: BaseWebSocketHandler<any>): void {
    this.registeredHandlers.push(handler);
    logDebug('WebSocket handler registered', {
      handler: handler.constructor.name,
      messageType: handler.messageType,
    });
  }

  /**
   * Returns whether the underlying socket is currently connected
   * 
   * @returns True if connected
   */
  isConnected(): boolean {
    return this.connected && !!this.client;
  }

  /**
   * Connects (or ensures a connection) for a given user email
   * 
   * - Idempotent: if already connected/connecting for the same email, returns the existing promise
   * - Switch user: if you pass a different email than the active one, the client disconnects and connects fresh
   * - Auto-reconnect remains enabled until you call disconnect()
   * 
   * @param userEmail - Normalized email identifying the client connection
   * @returns Promise that resolves when connection is established
   */
  async connect(userEmail: string): Promise<void> {
    const email = userEmail.trim().toLowerCase();

    // Validate connection state using validator
    const validation = WebSocketConnectionValidator.validate({
      isConnected: this.connected,
      isConnecting: this.connecting,
      currentEmail: this.currentUserEmail,
      newEmail: email,
      hasClient: !!this.client,
      hasConnectPromise: !!this.connectPromise,
    });

    // Reuse existing connection if valid
    if (validation.shouldReuse) {
      logDebug('WebSocket already connected', { email });
      return;
    }

    // Switch user scenario
    if (validation.shouldSwitch) {
      logInfo('Switching WebSocket user', {
        from: this.currentUserEmail,
        to: email,
      });
      this.disconnect();
      this.groupManager.clearGroups();
    }

    // Idempotent connect coalescing
    if (validation.isInProgress) {
      logDebug('WebSocket connection already in progress', { email });
      return this.connectPromise!;
    }

    this.currentUserEmail = email;
    this.shouldReconnect = true;

    // Ensure default groups are always present
    this.groupManager.rememberGroup(email);
    this.groupManager.rememberGroup(WEBSOCKET_GROUPS.PRESENCE);

    this.connecting = true;

    this.connectPromise = (async () => {
      try {
        await this.startFreshClient();
        this.reconnectManager.resetBackoff();
      } catch (err) {
        logError('Initial WebSocket connection failed', { error: err, email });
        this.connected = false;

        if (this.shouldReconnect) {
          this.scheduleReconnect('initial connect failed');
        }
      } finally {
        this.connecting = false;
      }
    })();

    // Install a single 'online' handler (first connect only)
    if (globalThis.window !== undefined && !this.onlineListener) {
      this.onlineListener = () => {
        if (!this.isConnected() && this.shouldReconnect) {
          this.scheduleReconnect('online event', true);
        }
      };
      globalThis.window.addEventListener('online', this.onlineListener, { passive: true });
    }

    return this.connectPromise;
  }

  /**
   * Schedules a reconnect attempt using the reconnect manager
   * 
   * @param reason - Human-readable reason for diagnostics
   * @param immediate - If true, attempts reconnect without delay
   */
  private scheduleReconnect(reason: string, immediate = false): void {
    if (!this.shouldReconnect || !this.currentUserEmail) {
      return;
    }

    this.reconnectManager.scheduleReconnect(
      async () => {
        await this.startFreshClient();
      },
      reason,
      immediate
    );
  }

  /**
   * Explicitly triggers a reconnect using the current identity and remembered groups
   * 
   * Safe to call even if connected; the client will be recreated.
   * 
   * @returns Promise that resolves when reconnected
   */
  async reconnect(): Promise<void> {
    if (!this.currentUserEmail) {
      return;
    }
    this.scheduleReconnect('explicit reconnect', true);
  }

  /**
   * Gracefully stops the client, disables auto-reconnect, removes global handlers,
   * and clears the socket reference
   * 
   * Listener registries remain intact so you can connect() again and keep your subscriptions.
   */
  disconnect(): void {
    logDebug('Disconnecting WebSocket');

    this.shouldReconnect = false;
    this.reconnectManager.clearReconnectTimer();

    if (this.onlineListener) {
      globalThis.window.removeEventListener('online', this.onlineListener);
      this.onlineListener = undefined;
    }

    WebSocketConnectionManager.stopClient(this.client);
    this.client = undefined;

    this.connected = false;
    this.connecting = false;
    this.connectPromise = null;
    this.currentUserEmail = null;
  }

  /**
   * Force cleanup of all existing connections
   * 
   * This should be called when switching users or when connection leaks are detected.
   * 
   * @returns Promise that resolves when cleanup is complete
   */
  async forceCleanup(): Promise<void> {
    logDebug('Force cleaning up WebSocket connection');

    if (this.client) {
      try {
        // Leave all groups before disconnecting
        await this.groupManager.leaveAllGroups(this.client);
        WebSocketConnectionManager.stopClient(this.client);
      } catch (error) {
        logWarn('Error during force cleanup', { error });
      }
    }

    // Reset all state
    this.client = undefined;
    this.connected = false;
    this.connecting = false;
    this.connectPromise = null;
    this.currentUserEmail = null;
    this.shouldReconnect = false;
    this.reconnectManager.cleanup();
  }

  /**
   * Joins a PubSub group and remembers it for automatic rejoin on future reconnects
   * 
   * Calling this more than once for the same group is harmless.
   * 
   * @param groupName - Group name to join; normalized to lowercase
   * @returns Promise that resolves when group is joined
   */
  async joinGroup(groupName: string): Promise<void> {
    if (!this.client) {
      logDebug('Client not connected, group will be joined after connect', {
        group: groupName,
      });
      // Remember group for later
      this.groupManager.rememberGroup(groupName);
      return;
    }

    await this.groupManager.joinGroup(this.client, groupName);
  }

  /**
   * Leaves a PubSub group and removes it from the rejoin memory
   * 
   * @param groupName - Group name to leave; normalized to lowercase
   * @returns Promise that resolves when group is left
   */
  async leaveGroup(groupName: string): Promise<void> {
    if (!this.client) {
      // Forget group even if not connected
      this.groupManager.forgetGroup(groupName);
      return;
    }

    await this.groupManager.leaveGroup(this.client, groupName);
  }

  /**
   * Registers a message handler that will receive all group/server messages
   * 
   * The handler persists across reconnects and client recreation.
   * 
   * @param handler - Function invoked with each JSON-parsed message payload
   * @returns Unsubscribe function
   */
  onMessage<T = unknown>(handler: MessageHandler<T>): () => void {
    this.messageHandlers.add(handler as MessageHandler<any>);
    return () => this.messageHandlers.delete(handler as MessageHandler<any>);
  }

  /**
   * Registers a callback for the "connected" lifecycle event
   * 
   * The handler persists across reconnects and client recreation.
   * 
   * @param handler - Callback invoked after a successful (re)connection
   * @returns Unsubscribe function
   */
  onConnected(handler: VoidHandler): () => void {
    this.connectedHandlers.add(handler);
    return () => this.connectedHandlers.delete(handler);
  }

  /**
   * Registers a callback for the "disconnected" lifecycle event
   * 
   * The handler persists across reconnects and client recreation.
   * 
   * @param handler - Callback invoked when the socket disconnects
   * @returns Unsubscribe function
   */
  onDisconnected(handler: VoidHandler): () => void {
    this.disconnectedHandlers.add(handler);
    return () => this.disconnectedHandlers.delete(handler);
  }

  // ------------------------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------------------------

  /**
   * Creates a fresh low-level client using the connection manager
   * 
   * Delegates to WebSocketConnectionManager which handles:
   * - Client creation and negotiation
   * - Event handler setup
   * - Lifecycle event management
   * - Group management integration
   * 
   * @throws If negotiate/start fails
   */
  private async startFreshClient(): Promise<void> {
    // Stop previous client (if any)
    WebSocketConnectionManager.stopClient(this.client);
    this.client = undefined;

    // Prepare event handlers structure
    const eventHandlers: IConnectionEventHandlers = {
      onConnected: this.connectedHandlers,
      onDisconnected: this.disconnectedHandlers,
      registeredHandlers: this.registeredHandlers,
      legacyMessageHandlers: this.messageHandlers,
    };

    // Create new client using connection manager
    const newClient = await WebSocketConnectionManager.createClient({
      currentUserEmail: this.currentUserEmail,
      groupManager: this.groupManager,
      eventHandlers,
      onReconnectNeeded: (reason: string) => {
        if (this.shouldReconnect) {
          this.scheduleReconnect(reason);
        }
      },
      setConnected: (connected: boolean) => {
        this.connected = connected;
      },
      clearReconnectTimer: () => {
        this.reconnectManager.clearReconnectTimer();
      },
      resetBackoff: () => {
        this.reconnectManager.resetBackoff();
      },
      isConnected: () => {
        return this.isConnected();
      },
    });

    this.client = newClient;
  }


}

/**
 * App-wide singleton instance
 * 
 * Import and reuse this instance everywhere instead of creating new clients:
 * ```typescript
 * import { webSocketService } from '@/shared/services/webSocket';
 * ```
 */
export const webSocketService = WebSocketService.getInstance();

