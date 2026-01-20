/**
 * @fileoverview Camera failure message handler
 * @summary Handler for camera failure WebSocket messages
 * @description Processes camera failure notifications from WebSocket and triggers toast notifications
 */

import { BaseWebSocketHandler } from '../base/BaseWebSocketHandler';
import { logDebug } from '@/shared/utils/logger';
import type { CameraFailureMessage } from '@/modules/camera-failures/types/cameraFailureWebSocketTypes';

/**
 * Handler for camera failure WebSocket messages
 * 
 * Processes camera failure notifications and displays toast messages to the user.
 * This handler follows Single Responsibility Principle - it only handles camera failure messages.
 */
export class CameraFailureMessageHandler extends BaseWebSocketHandler<CameraFailureMessage> {
  readonly messageType = 'cameraFailure';

  protected validate(message: unknown): message is CameraFailureMessage {
    return (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === 'cameraFailure' &&
      'psoEmail' in message &&
      typeof message.psoEmail === 'string' &&
      'psoName' in message &&
      typeof message.psoName === 'string' &&
      'errorMessage' in message &&
      typeof message.errorMessage === 'string' &&
      'stage' in message &&
      typeof message.stage === 'string' &&
      'timestamp' in message &&
      typeof message.timestamp === 'string'
    );
  }

  protected process(message: CameraFailureMessage): void {
    const { psoEmail, psoName, errorMessage } = message;
    
    logDebug('[CameraFailureMessageHandler] Processing camera failure message', {
      psoEmail,
      psoName,
      errorMessage,
    });

    // Dispatch custom event that can be listened to by React components
    // This allows us to show toast notifications from outside React context
    const event = new CustomEvent('cameraFailure', {
      detail: {
        psoEmail,
        psoName,
        errorMessage,
      },
    });
    window.dispatchEvent(event);
  }
}

