/**
 * @fileoverview WebSocket provider component
 * @summary Registers WebSocket handlers on app initialization
 * @description Provides WebSocket service with registered handlers for the entire application
 */

import { useEffect } from 'react';
import { webSocketService } from '@/shared/services/webSocket/index';
import { PresenceMessageHandler } from '@/shared/services/webSocket/handlers/presence/PresenceMessageHandler';
import {
  SupervisorChangeNotificationHandler,
  SupervisorListChangedHandler,
} from '@/modules/supervisor/services';
import { logDebug } from '@/shared/utils/logger';

/**
 * WebSocketProvider component
 * 
 * Registers all WebSocket message handlers on mount.
 * This ensures handlers are available before any WebSocket connections are established.
 * 
 * Should be placed high in the component tree, ideally in AppProviders.
 * 
 * @param props - Component props
 * @returns JSX element (no-op wrapper)
 * 
 * @example
 * ```tsx
 * <WebSocketProvider>
 *   <App />
 * </WebSocketProvider>
 * ```
 */
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    logDebug('Registering WebSocket handlers');

    // Register presence handler
    webSocketService.registerHandler(new PresenceMessageHandler());

    // Register supervisor handlers
    webSocketService.registerHandler(new SupervisorChangeNotificationHandler());
    webSocketService.registerHandler(new SupervisorListChangedHandler());

    logDebug('WebSocket handlers registered successfully');
  }, []);

  return <>{children}</>;
};

