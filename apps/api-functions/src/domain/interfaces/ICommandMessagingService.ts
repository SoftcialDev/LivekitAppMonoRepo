/**
 * @fileoverview ICommandMessagingService - Interface for command messaging operations
 * @summary Defines the contract for command messaging service operations
 * @description Interface for command messaging and Web PubSub operations
 */

import { WebPubSubMessage } from '../types/MessageTypes';

/**
 * Interface for command messaging service operations
 * @description Defines the contract for command messaging and Web PubSub operations
 */
export interface ICommandMessagingService {
  /**
   * Sends a command message to a specific group
   * @param groupName - The name of the group to send the message to
   * @param message - The message payload to send (must be JSON-serializable)
   * @returns Promise that resolves when the message is sent
   * @throws Error if the message sending fails
   */
  sendToGroup(groupName: string, message: WebPubSubMessage): Promise<void>;
}