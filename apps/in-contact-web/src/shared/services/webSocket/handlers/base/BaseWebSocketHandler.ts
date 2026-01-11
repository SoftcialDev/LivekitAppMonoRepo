/**
 * @fileoverview Base class for WebSocket message handlers
 * @summary Abstract base class following Template Method pattern
 * @description Provides common structure for all WebSocket message handlers
 */

import type { IWebSocketHandler } from '../../types/webSocketTypes';
import { logWarn, logError } from '@/shared/utils/logger';

/**
 * Abstract base class for WebSocket message handlers
 * 
 * Implements Template Method pattern to provide consistent structure
 * for all message handlers while allowing specific implementations
 * to define validation and processing logic.
 * 
 * @template TMessage - Type of message this handler processes
 * 
 * @example
 * ```typescript
 * class MyHandler extends BaseWebSocketHandler<MyMessage> {
 *   readonly messageType = 'my_message';
 *   
 *   protected validate(message: unknown): message is MyMessage {
 *     return message?.type === 'my_message' && !!message?.data;
 *   }
 *   
 *   protected process(message: MyMessage): void {
 *     // Handle the message
 *   }
 * }
 * ```
 */
export abstract class BaseWebSocketHandler<TMessage = unknown> implements IWebSocketHandler {
  /**
   * Message type this handler processes
   */
  abstract readonly messageType: string;

  /**
   * Checks if this handler can process the given message
   * 
   * @param message - WebSocket message to check
   * @returns True if this handler can process the message
   */
  canHandle(message: unknown): boolean {
    return (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === this.messageType
    );
  }

  /**
   * Validates the message structure
   * 
   * @param message - Message to validate
   * @returns True if message is valid
   */
  protected abstract validate(message: unknown): message is TMessage;

  /**
   * Processes the validated message
   * 
   * @param message - Validated message
   */
  protected abstract process(message: TMessage): void;

  /**
   * Handles the message (Template Method)
   * 
   * This method implements the template method pattern:
   * 1. Check if handler can process the message
   * 2. Validate the message structure
   * 3. Process the message (delegated to subclass)
   * 
   * @param message - WebSocket message
   */
  handle(message: unknown): void {
    if (!this.canHandle(message)) {
      return;
    }

    if (!this.validate(message)) {
      logWarn('Invalid message structure', {
        handler: this.constructor.name,
        messageType: this.messageType,
        message,
      });
      return;
    }

    try {
      this.process(message);
    } catch (error) {
      logError('Error processing WebSocket message', {
        handler: this.constructor.name,
        messageType: this.messageType,
        error,
      });
    }
  }
}

