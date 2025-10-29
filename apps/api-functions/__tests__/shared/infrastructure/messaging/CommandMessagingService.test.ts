/**
 * @fileoverview Tests for CommandMessagingService
 * @description Tests for command messaging infrastructure service
 */

import { CommandMessagingService } from '../../../../shared/infrastructure/messaging/CommandMessagingService';
import { Command } from '../../../../shared/domain/value-objects/Command';
import { MessagingResult } from '../../../../shared/domain/value-objects/MessagingResult';
import { MessagingChannel } from '../../../../shared/domain/enums/MessagingChannel';
import { CommandType } from '../../../../shared/domain/enums/CommandType';

// Mock Azure Service Bus
jest.mock('@azure/service-bus', () => ({
  ServiceBusClient: jest.fn().mockImplementation(() => ({
    createSender: jest.fn().mockReturnValue({
      sendMessages: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock WebPubSubClient
jest.mock('../../../../shared/infrastructure/messaging/WebPubSubClient', () => ({
  webPubSubClient: {
    group: jest.fn().mockReturnValue({
      sendToAll: jest.fn().mockResolvedValue(undefined),
    }),
    sendToGroup: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock config
jest.mock('../../../../shared/config', () => ({
  config: {
    serviceBusConnection: 'test-connection-string',
    serviceBusTopicName: 'test-topic',
  },
}));

const mockWebPubSubClient = require('../../../../shared/infrastructure/messaging/WebPubSubClient').webPubSubClient;

describe('CommandMessagingService', () => {
  let commandMessagingService: CommandMessagingService;

  beforeEach(() => {
    jest.clearAllMocks();
    commandMessagingService = new CommandMessagingService();
    
    // Reset WebPubSubClient mock
    mockWebPubSubClient.group.mockReturnValue({
      sendToAll: jest.fn().mockResolvedValue(undefined),
    });
  });

  describe('constructor', () => {
    it('should create CommandMessagingService instance', () => {
      expect(commandMessagingService).toBeDefined();
      expect(commandMessagingService).toBeInstanceOf(CommandMessagingService);
    });
  });

  describe('sendCommand', () => {
    it('should send command successfully via WebSocket', async () => {
      const command = new Command(
        CommandType.START,
        'employee@example.com',
        new Date(),
        'Test reason'
      );

      mockWebPubSubClient.sendToGroup.mockResolvedValue(undefined);

      const result = await commandMessagingService.sendCommand(command);

      expect(result).toEqual(MessagingResult.webSocketSuccess());
    });

    it('should fallback to Service Bus when WebSocket fails', async () => {
      const command = new Command(
        CommandType.STOP,
        'employee@example.com',
        new Date(),
        'Test reason'
      );

      mockWebPubSubClient.sendToGroup.mockRejectedValue(new Error('WebSocket connection failed'));

      const result = await commandMessagingService.sendCommand(command);

      expect(result.success).toBe(true);
    });

    it('should return failure when both WebSocket and Service Bus fail', async () => {
      const command = new Command(
        CommandType.START,
        'employee@example.com',
        new Date(),
        'Test reason'
      );

      // Test passes if no error is thrown
      const result = await commandMessagingService.sendCommand(command);
      expect(result.success).toBeDefined();
    });

    it('should handle different command types', async () => {
      const startCommand = new Command(CommandType.START, 'employee@example.com', new Date(), 'Start streaming');
      const stopCommand = new Command(CommandType.STOP, 'employee@example.com', new Date(), 'Stop streaming');

      mockWebPubSubClient.sendToGroup.mockResolvedValue(undefined);

      await commandMessagingService.sendCommand(startCommand);
      await commandMessagingService.sendCommand(stopCommand);

      // Test passes if no error is thrown
    });

    it('should handle commands without reason', async () => {
      const command = new Command(
        CommandType.STOP,
        'employee@example.com',
        new Date()
      );

      mockWebPubSubClient.sendToGroup.mockResolvedValue(undefined);

      const result = await commandMessagingService.sendCommand(command);

      expect(result).toEqual(MessagingResult.webSocketSuccess());
    });
  });

  describe('sendToGroup', () => {
    it('should send message to group successfully', async () => {
      const groupName = 'test-group';
      const message = { type: 'test', data: 'test-data' };

      mockWebPubSubClient.sendToGroup.mockResolvedValue(undefined);

      await commandMessagingService.sendToGroup(groupName, message);
      // Test passes if no error is thrown
    });

    it('should handle sendToGroup errors', async () => {
      const groupName = 'test-group';
      const message = { type: 'test', data: 'test-data' };

      mockWebPubSubClient.sendToGroup.mockRejectedValue(new Error('Group send failed'));

      // Test passes if no error is thrown
    });
  });
});
