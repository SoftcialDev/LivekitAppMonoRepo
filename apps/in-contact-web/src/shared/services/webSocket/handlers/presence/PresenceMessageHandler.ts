/**
 * @fileoverview Presence message handler
 * @summary Handler for presence WebSocket messages
 * @description Processes presence updates (online/offline) from WebSocket
 */

import { BaseWebSocketHandler } from '../base/BaseWebSocketHandler';
import { usePresenceStore } from '@/modules/presence/stores/presence-store';
import { PresenceStatus } from '@/modules/presence/enums/presenceEnums';
import { WEBSOCKET_MESSAGE_TYPES } from '../../constants/webSocketConstants';
import type { PresenceMessage } from '@/modules/presence/types/presenceTypes';

/**
 * Handler for presence WebSocket messages
 * 
 * Processes presence updates and updates the presence store.
 * This handler follows Single Responsibility Principle - it only
 * handles presence messages, nothing else.
 */
export class PresenceMessageHandler extends BaseWebSocketHandler<PresenceMessage> {
  readonly messageType = WEBSOCKET_MESSAGE_TYPES.PRESENCE;

  protected validate(message: unknown): message is PresenceMessage {
    return (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === WEBSOCKET_MESSAGE_TYPES.PRESENCE &&
      'user' in message &&
      typeof message.user === 'object' &&
      message.user !== null &&
      'email' in message.user &&
      'status' in message.user
    );
  }

  protected process(message: PresenceMessage): void {
    const { user } = message;
    const isOnline = user.status === PresenceStatus.Online;

    // Update presence store
    usePresenceStore.getState().updateUserStatus(user, isOnline);
  }
}

