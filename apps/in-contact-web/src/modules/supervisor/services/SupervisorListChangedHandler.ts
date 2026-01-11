/**
 * @fileoverview Supervisor list changed handler
 * @summary Handler for supervisor list change WebSocket messages
 * @description Processes supervisor list changes from WebSocket
 */

import { BaseWebSocketHandler } from '@/shared/services/webSocket/handlers/base/BaseWebSocketHandler';
import { WEBSOCKET_MESSAGE_TYPES } from '@/shared/services/webSocket/constants/webSocketConstants';
import { useSupervisorStore } from '../stores/supervisor-store';
import type { ISupervisorListChangedMessage } from '../types/supervisorTypes';

/**
 * Handler for supervisor list changed notifications
 * 
 * Processes supervisor list changes and notifies subscribers.
 */
export class SupervisorListChangedHandler
  extends BaseWebSocketHandler<ISupervisorListChangedMessage>
{
  readonly messageType = WEBSOCKET_MESSAGE_TYPES.SUPERVISOR_LIST_CHANGED;

  protected validate(
    message: unknown
  ): message is ISupervisorListChangedMessage {
    return (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === WEBSOCKET_MESSAGE_TYPES.SUPERVISOR_LIST_CHANGED &&
      'data' in message
    );
  }

  protected process(message: ISupervisorListChangedMessage): void {
    // Handle supervisor list change
    useSupervisorStore.getState().handleSupervisorListChanged(message.data);
  }
}

