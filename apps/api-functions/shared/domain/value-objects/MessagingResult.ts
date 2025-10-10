/**
 * @fileoverview MessagingResult - Domain value object for messaging results
 * @description Represents the result of a messaging operation
 */

import { MessagingChannel } from '../enums/MessagingChannel';

/**
 * Value object representing the result of a messaging operation
 */
export class MessagingResult {
  /**
   * Creates a new MessagingResult instance
   * @param sentVia - The channel used to send the message
   * @param success - Whether the operation was successful
   * @param error - Optional error message if operation failed
   */
  constructor(
    public readonly sentVia: MessagingChannel,
    public readonly success: boolean,
    public readonly error?: string
  ) {}

  /**
   * Creates a successful WebSocket result
   * @returns Successful WebSocket messaging result
   */
  static webSocketSuccess(): MessagingResult {
    return new MessagingResult(MessagingChannel.WebSocket, true);
  }

  /**
   * Creates a successful Service Bus result
   * @returns Successful Service Bus messaging result
   */
  static serviceBusSuccess(): MessagingResult {
    return new MessagingResult(MessagingChannel.ServiceBus, true);
  }

  /**
   * Creates a failed result
   * @param channel - The channel that failed
   * @param error - Error message
   * @returns Failed messaging result
   */
  static failure(channel: MessagingChannel, error: string): MessagingResult {
    return new MessagingResult(channel, false, error);
  }
}
