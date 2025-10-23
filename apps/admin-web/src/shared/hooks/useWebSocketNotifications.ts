/**
 * @fileoverview useWebSocketNotifications - Generic hook for WebSocket notifications
 * @summary Reusable hook for subscribing to WebSocket message types
 * @description Provides a generic way to subscribe to WebSocket messages with filtering and automatic cleanup
 */

import { useEffect, useCallback, useRef } from 'react';
import { WebSocketMessageManager, MessageHandler, MessageFilter } from '../services/WebSocketMessageManager';
import { WebSocketMessage } from '../types/WebSocketMessages';

/**
 * Interface for message handlers
 */
export interface MessageHandlers {
  [messageType: string]: MessageHandler;
}

/**
 * Interface for message filters
 */
export interface NotificationFilters {
  userEmail?: string;
  userRole?: string;
  customFilter?: (message: any) => boolean;
}

/**
 * Generic hook for WebSocket notifications
 * @param messageTypes - Array of message types to listen for
 * @param handlers - Object with message type handlers
 * @param filters - Optional filters for message processing
 * @returns void
 * ```
 */
export function useWebSocketNotifications(
  messageTypes: string[],
  handlers: MessageHandlers,
  filters?: NotificationFilters
): void {
  const managerRef = useRef<WebSocketMessageManager | null>(null);
  const unsubscribeFunctionsRef = useRef<(() => void)[]>([]);

  /**
   * Create message handler with error handling
   * @param messageType - Type of message
   * @param handler - Handler function
   * @returns Wrapped handler with error handling
   */
  const createHandler = useCallback((messageType: string, handler: MessageHandler): MessageHandler => {
    return (message: any) => {
      try {
        console.log(`📡 [useWebSocketNotifications] Processing ${messageType}:`, message);
        handler(message);
      } catch (error) {
        console.error(`📡 [useWebSocketNotifications] Error in handler for ${messageType}:`, error);
      }
    };
  }, []);

  /**
   * Setup subscriptions for all message types
   */
  const setupSubscriptions = useCallback(() => {
    if (!messageTypes.length) {
      return;
    }

    // Get or create manager instance
    if (!managerRef.current) {
      managerRef.current = WebSocketMessageManager.getInstance();
    }

    const manager = managerRef.current;

    // Clear existing subscriptions
    unsubscribeFunctionsRef.current.forEach(unsubscribe => unsubscribe());
    unsubscribeFunctionsRef.current = [];

    // Subscribe to each message type
    messageTypes.forEach(messageType => {
      const handler = handlers[messageType];
      if (handler) {
        const wrappedHandler = createHandler(messageType, handler);
        const unsubscribe = manager.subscribe(messageType, wrappedHandler, filters);
        unsubscribeFunctionsRef.current.push(unsubscribe);
        
        // Removed subscription log to reduce console spam
      } else {
        console.warn(`📡 [useWebSocketNotifications] No handler provided for message type: ${messageType}`);
      }
    });
  }, [messageTypes, handlers, filters, createHandler]);

  /**
   * Cleanup subscriptions
   */
  const cleanup = useCallback(() => {
    unsubscribeFunctionsRef.current.forEach(unsubscribe => unsubscribe());
    unsubscribeFunctionsRef.current = [];
    // Removed cleanup log to reduce console spam
  }, []);

  // Setup subscriptions on mount and when dependencies change
  useEffect(() => {
    setupSubscriptions();
    
    // Cleanup on unmount
    return cleanup;
  }, [setupSubscriptions, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
}

/**
 * Specialized hook for supervisor change notifications
 * @param onSupervisorChange - Callback for supervisor changes
 * @param userEmail - Current user's email
 * @param userRole - Current user's role
 * @returns void
 */
export function useSupervisorChangeNotifications(
  onSupervisorChange?: (data: any) => void,
  userEmail?: string,
  userRole?: string | null
): void {
  useWebSocketNotifications(
    ['supervisor_change_notification'],
    {
      supervisor_change_notification: (message) => {
        if (onSupervisorChange) {
          onSupervisorChange(message.data);
        }
      }
    },
    {
      userEmail,
      userRole: userRole || undefined,
      customFilter: (message) => {
        if (!message.data) return false;
        
        const { psoEmails, oldSupervisorEmail, newSupervisorEmail } = message.data;
        const currentEmail = userEmail || '';
        const currentRole = userRole || '';
        
        // Determine if this user should be notified
        return currentRole === 'Admin' || 
               currentRole === 'SuperAdmin' ||
               currentEmail === oldSupervisorEmail ||
               currentEmail === newSupervisorEmail ||
               (psoEmails && psoEmails.includes(currentEmail));
      }
    }
  );
}

/**
 * Specialized hook for PSO supervisor change notifications
 * @param onSupervisorChanged - Callback for supervisor changes
 * @param userEmail - PSO's email address
 * @returns void
 */
export function usePsoSupervisorChangeNotifications(
  onSupervisorChanged: () => void,
  userEmail: string
): void {
  useWebSocketNotifications(
    ['SUPERVISOR_CHANGED'],
    {
      SUPERVISOR_CHANGED: () => {
        onSupervisorChanged();
      }
    },
    {
      userEmail,
      customFilter: (message) => {
        // Only process if this is for the current user
        return true; // The manager will handle user-specific filtering
      }
    }
  );
}