/**
 * @fileoverview CommandMessagingService - Infrastructure service for command messaging
 * @description Handles command delivery with WebSocket primary and Service Bus fallback
 */

import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';
import { webPubSubClient } from './WebPubSubClient';
import { Command } from '../../domain/value-objects/Command';
import { MessagingResult } from '../../domain/value-objects/MessagingResult';
import { MessagingChannel } from '../../domain/enums/MessagingChannel';
import { ICommandMessagingService } from '../../domain/interfaces/ICommandMessagingService';
import { config } from '../../config';

/**
 * Service for sending commands with WebSocket primary and Service Bus fallback
 */
export class CommandMessagingService implements ICommandMessagingService {
  private static serviceBusClient: ServiceBusClient;
  private static serviceBusSender: ServiceBusSender;

  /**
   * Creates a new CommandMessagingService instance
   */
  constructor() {
    if (!CommandMessagingService.serviceBusClient) {
      CommandMessagingService.serviceBusClient = new ServiceBusClient(config.serviceBusConnection);
      CommandMessagingService.serviceBusSender = CommandMessagingService.serviceBusClient.createSender(config.serviceBusTopicName);
    }
  }

  /**
   * Sends a command with WebSocket primary and Service Bus fallback
   * @param command - The command to send
   * @returns Promise that resolves to messaging result
   */
  async sendCommand(command: Command): Promise<MessagingResult> {
    try {
      await this.sendToWebSocket(command);
      return MessagingResult.webSocketSuccess();
    } catch (wsError) {
      console.warn('WebSocket delivery failed, falling back to Service Bus:', wsError);
      try {
        await this.sendToServiceBus(command);
        return MessagingResult.serviceBusSuccess();
      } catch (busError) {
        console.error('Service Bus delivery failed:', busError);
        return MessagingResult.failure(MessagingChannel.ServiceBus, (busError as Error).message);
      }
    }
  }

  /**
   * Sends a message to a WebSocket group
   * @param groupName - Name of the target group
   * @param payload - Payload to send
   * @returns Promise that resolves when message is sent
   */
  async sendToGroup(groupName: string, payload: unknown): Promise<void> {
    const groupClient = webPubSubClient.group(groupName);
    await groupClient.sendToAll(JSON.stringify(payload));
    console.debug(`Broadcast to group '${groupName}'`, payload);
  }

  /**
   * Sends command via WebSocket
   * @param command - Command to send
   * @returns Promise that resolves when sent
   */
  private async sendToWebSocket(command: Command): Promise<void> {
    const groupName = `commands:${command.employeeEmail}`;
    await this.sendToGroup(groupName, command.toPayload());
  }

  /**
   * Sends command via Service Bus
   * @param command - Command to send
   * @returns Promise that resolves when sent
   */
  private async sendToServiceBus(command: Command): Promise<void> {
    const message = {
      body: command.toPayload(),
      contentType: 'application/json'
    };
    await CommandMessagingService.serviceBusSender.sendMessages(message);
  }

  /**
   * Closes Service Bus connections
   * @returns Promise that resolves when connections are closed
   */
  static async closeConnections(): Promise<void> {
    if (CommandMessagingService.serviceBusSender) {
      await CommandMessagingService.serviceBusSender.close();
    }
    if (CommandMessagingService.serviceBusClient) {
      await CommandMessagingService.serviceBusClient.close();
    }
  }
}
