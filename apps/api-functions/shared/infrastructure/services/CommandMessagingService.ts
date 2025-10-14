/**
 * @fileoverview CommandMessagingService - Infrastructure service for command messaging operations
 * @summary Handles command messaging using existing CommandMessagingService
 * @description Infrastructure service that implements command messaging using the existing CommandMessagingService
 */

import { ICommandMessagingService } from "../../domain/interfaces/ICommandMessagingService";
import { CommandMessagingService as ExistingCommandMessagingService } from "../messaging/CommandMessagingService";

/**
 * Infrastructure service for command messaging operations
 * @description Handles command messaging using the existing CommandMessagingService
 */
export class CommandMessagingService implements ICommandMessagingService {
  private readonly messagingService: ExistingCommandMessagingService;

  /**
   * Creates a new CommandMessagingService instance
   */
  constructor() {
    this.messagingService = new ExistingCommandMessagingService();
  }

  /**
   * Sends a command message to a specific group
   * @param groupName - The name of the group to send the message to
   * @param message - The message payload to send
   * @returns Promise that resolves when the message is sent
   * @throws Error if the message sending fails
   */
  async sendToGroup(groupName: string, message: any): Promise<void> {
    await this.messagingService.sendToGroup(groupName, message);
  }
}
