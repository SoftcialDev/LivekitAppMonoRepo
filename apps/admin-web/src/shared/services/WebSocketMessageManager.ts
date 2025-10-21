/**
 * @fileoverview WebSocketMessageManager - Centralized WebSocket message management
 * @summary Singleton service for handling all WebSocket connections and message distribution
 * @description Provides a centralized way to manage WebSocket connections, subscribe to message types, and distribute messages to registered listeners
 */

import { WebPubSubClientService } from '../api/webpubsubClient';

/**
 * Interface for WebSocket message handlers
 */
export interface MessageHandler {
  (data: any): void;
}

/**
 * Interface for message filters
 */
export interface MessageFilter {
  userEmail?: string;
  userRole?: string;
  customFilter?: (message: any) => boolean;
}

/**
 * Centralized WebSocket message manager
 * Handles all WebSocket connections and message distribution
 */
export class WebSocketMessageManager {
  private static instance: WebSocketMessageManager;
  private listeners: Map<string, Set<{ handler: MessageHandler; filter?: MessageFilter }>> = new Map();
  private webSocketService: WebPubSubClientService | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance
   * @returns WebSocketMessageManager instance
   */
  static getInstance(): WebSocketMessageManager {
    if (!WebSocketMessageManager.instance) {
      WebSocketMessageManager.instance = new WebSocketMessageManager();
    }
    return WebSocketMessageManager.instance;
  }

  /**
   * Subscribe to a specific message type
   * @param messageType - Type of message to listen for
   * @param handler - Function to call when message is received
   * @param filter - Optional filter to determine if message should be processed
   * @returns Unsubscribe function
   */
  subscribe(
    messageType: string, 
    handler: MessageHandler, 
    filter?: MessageFilter
  ): () => void {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, new Set());
    }

    const listenerEntry = { handler, filter };
    this.listeners.get(messageType)!.add(listenerEntry);

    // Ensure WebSocket is connected
    this.ensureConnected();

    // Return unsubscribe function
    return () => {
      this.unsubscribe(messageType, handler);
    };
  }

  /**
   * Unsubscribe from a message type
   * @param messageType - Type of message to unsubscribe from
   * @param handler - Handler function to remove
   */
  unsubscribe(messageType: string, handler: MessageHandler): void {
    const listeners = this.listeners.get(messageType);
    if (listeners) {
      for (const listener of listeners) {
        if (listener.handler === handler) {
          listeners.delete(listener);
          break;
        }
      }
      
      // Clean up empty message types
      if (listeners.size === 0) {
        this.listeners.delete(messageType);
      }
    }
  }

  /**
   * Connect to WebSocket if not already connected
   * @returns Promise that resolves when connection is established
   */
  private async ensureConnected(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.connect();
    return this.connectionPromise;
  }

  /**
   * Connect to WebSocket service
   * @returns Promise that resolves when connection is established
   */
  private async connect(): Promise<void> {
    try {
      if (this.webSocketService) {
        this.webSocketService.forceCleanup().catch(() => {});
      }

      this.webSocketService = WebPubSubClientService.getInstance();
      
      // Set up message handler
      this.webSocketService.onMessage<any>((msg) => {
        this.distributeMessage(msg);
      });

      this.isConnected = true;
      console.log('🔌 [WebSocketMessageManager] Connected to WebSocket service');
    } catch (error) {
      console.error('🔌 [WebSocketMessageManager] Failed to connect:', error);
      this.isConnected = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket service
   */
  disconnect(): void {
    if (this.webSocketService) {
      this.webSocketService.forceCleanup().catch(() => {});
      this.webSocketService = null;
    }
    this.isConnected = false;
    this.connectionPromise = null;
    console.log('🔌 [WebSocketMessageManager] Disconnected from WebSocket service');
  }

  /**
   * Distribute message to all registered listeners
   * @param message - WebSocket message to distribute
   */
  private distributeMessage(message: any): void {
    if (!message || !message.type) {
      return;
    }

    const messageType = message.type;
    const listeners = this.listeners.get(messageType);
    
    if (!listeners || listeners.size === 0) {
      return;
    }

    console.log(`📡 [WebSocketMessageManager] Distributing message type: ${messageType} to ${listeners.size} listeners`);

    // Distribute to all listeners for this message type
    for (const listener of listeners) {
      try {
        // Apply filter if provided
        if (listener.filter && !this.shouldProcessMessage(message, listener.filter)) {
          continue;
        }

        // Call the handler
        listener.handler(message);
      } catch (error) {
        console.error(`📡 [WebSocketMessageManager] Error in message handler for ${messageType}:`, error);
      }
    }
  }

  /**
   * Check if message should be processed based on filter
   * @param message - WebSocket message
   * @param filter - Filter criteria
   * @returns True if message should be processed
   */
  private shouldProcessMessage(message: any, filter: MessageFilter): boolean {
    // Custom filter takes precedence
    if (filter.customFilter) {
      return filter.customFilter(message);
    }

    // Check user email filter
    if (filter.userEmail && message.data) {
      const { psoEmails, oldSupervisorEmail, newSupervisorEmail } = message.data;
      if (psoEmails && !psoEmails.includes(filter.userEmail) && 
          oldSupervisorEmail !== filter.userEmail && 
          newSupervisorEmail !== filter.userEmail) {
        return false;
      }
    }

    // Check user role filter
    if (filter.userRole && message.data) {
      const currentRole = localStorage.getItem('userRole') || '';
      if (filter.userRole !== currentRole) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get connection status
   * @returns True if connected
   */
  isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get number of active listeners
   * @returns Total number of active listeners
   */
  getListenerCount(): number {
    let total = 0;
    for (const listeners of this.listeners.values()) {
      total += listeners.size;
    }
    return total;
  }

  /**
   * Get listeners for a specific message type
   * @param messageType - Message type to check
   * @returns Number of listeners for the message type
   */
  getListenersForType(messageType: string): number {
    return this.listeners.get(messageType)?.size || 0;
  }
}