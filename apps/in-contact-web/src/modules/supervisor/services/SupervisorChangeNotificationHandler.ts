/**
 * @fileoverview Supervisor change notification handler
 * @summary Handler for supervisor change WebSocket messages
 * @description Processes supervisor assignment changes from WebSocket
 */

import { BaseWebSocketHandler } from '@/shared/services/webSocket/handlers/base/BaseWebSocketHandler';
import { WEBSOCKET_MESSAGE_TYPES } from '@/shared/services/webSocket/constants/webSocketConstants';
import { useSupervisorStore } from '../stores/supervisor-store';
import type { ISupervisorChangeNotificationMessage } from '../types/supervisorTypes';

/**
 * Handler for supervisor change notifications
 * 
 * Processes supervisor assignment changes and updates both the supervisor
 * store and the presence store (via delegation).
 */
export class SupervisorChangeNotificationHandler
  extends BaseWebSocketHandler<ISupervisorChangeNotificationMessage>
{
  readonly messageType = WEBSOCKET_MESSAGE_TYPES.SUPERVISOR_CHANGE_NOTIFICATION;

  protected validate(
    message: unknown
  ): message is ISupervisorChangeNotificationMessage {
    return (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === WEBSOCKET_MESSAGE_TYPES.SUPERVISOR_CHANGE_NOTIFICATION &&
      'data' in message &&
      typeof message.data === 'object' &&
      message.data !== null &&
      'psoEmails' in message.data &&
      'newSupervisorEmail' in message.data
    );
  }

  protected process(message: ISupervisorChangeNotificationMessage): void {
    const { data } = message;

    // Handle supervisor change (updates presence store via delegation)
    // This always updates presence store, and notifies subscribers via Zustand
    // Components that need to refresh should listen to lastSupervisorChange
    // from useSupervisorChange() hook and decide if they need to refresh
    useSupervisorStore.getState().handleSupervisorChange(data);
  }
}

