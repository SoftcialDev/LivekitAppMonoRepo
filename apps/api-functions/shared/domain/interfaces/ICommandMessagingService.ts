/**
 * @fileoverview ICommandMessagingService - Domain interface for command messaging
 * @description Defines the contract for command messaging operations
 */

import { Command } from '../value-objects/Command';
import { MessagingResult } from '../value-objects/MessagingResult';

/**
 * Interface for command messaging service operations
 */
export interface ICommandMessagingService {
  /**
   * Sends a command with WebSocket primary and Service Bus fallback
   * @param command - The command to send
   * @returns Promise that resolves to messaging result
   */
  sendCommand(command: Command): Promise<MessagingResult>;

  /**
   * Sends a message to a WebSocket group
   * @param groupName - Name of the target group
   * @param payload - Payload to send
   * @returns Promise that resolves when message is sent
   */
  sendToGroup(groupName: string, payload: unknown): Promise<void>;
}
