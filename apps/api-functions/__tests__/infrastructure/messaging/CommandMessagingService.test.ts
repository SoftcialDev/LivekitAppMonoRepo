import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';
import { CommandMessagingService } from '../../../src/infrastructure/messaging/CommandMessagingService';
import { Command } from '../../../src/domain/value-objects/Command';
import { CommandType } from '../../../src/domain/enums/CommandType';
import { MessagingResult } from '../../../src/domain/value-objects/MessagingResult';
import { MessagingChannel } from '../../../src/domain/enums/MessagingChannel';
import webPubSubClient from '../../../src/infrastructure/messaging/WebPubSubClient';
import { config } from '../../../src/config';

jest.mock('@azure/service-bus');
jest.mock('../../../src/infrastructure/messaging/WebPubSubClient', () => ({
  __esModule: true,
  default: {
    group: jest.fn(),
  },
}));
jest.mock('../../../src/config', () => ({
  config: {
    serviceBusConnection: 'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=test',
    serviceBusTopicName: 'test-topic',
  },
}));

const MockServiceBusClient = ServiceBusClient as jest.MockedClass<typeof ServiceBusClient>;

describe('CommandMessagingService', () => {
  let service: CommandMessagingService;
  let mockServiceBusClient: jest.Mocked<ServiceBusClient>;
  let mockServiceBusSender: jest.Mocked<ServiceBusSender>;
  let mockGroupClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGroupClient = {
      sendToAll: jest.fn().mockResolvedValue(undefined),
    };

    (webPubSubClient.group as jest.Mock).mockReturnValue(mockGroupClient);

    mockServiceBusSender = {
      sendMessages: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockServiceBusClient = {
      createSender: jest.fn().mockReturnValue(mockServiceBusSender),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    MockServiceBusClient.mockImplementation(() => mockServiceBusClient);

    (CommandMessagingService as any).serviceBusClient = undefined;
    (CommandMessagingService as any).serviceBusSender = undefined;

    service = new CommandMessagingService();
  });

  describe('constructor', () => {
    it('should create ServiceBusClient and sender', () => {
      expect(MockServiceBusClient).toHaveBeenCalledWith(config.serviceBusConnection);
      expect(mockServiceBusClient.createSender).toHaveBeenCalledWith(config.serviceBusTopicName);
    });

    it('should reuse existing ServiceBusClient on subsequent instantiations', () => {
      const service1 = new CommandMessagingService();
      const service2 = new CommandMessagingService();

      expect(MockServiceBusClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendCommand', () => {
    it('should send command via WebSocket successfully', async () => {
      const command = new Command(
        CommandType.START,
        'user@test.com',
        new Date()
      );

      const result = await service.sendCommand(command);

      expect(mockGroupClient.sendToAll).toHaveBeenCalled();
      expect(result).toEqual(MessagingResult.webSocketSuccess());
    });

    it('should fallback to Service Bus when WebSocket fails', async () => {
      const command = new Command(
        CommandType.START,
        'user@test.com',
        new Date()
      );

      (webPubSubClient.group as jest.Mock).mockReturnValueOnce({
        sendToAll: jest.fn().mockRejectedValue(new Error('WebSocket failed')),
      });

      const result = await service.sendCommand(command);

      expect(mockServiceBusSender.sendMessages).toHaveBeenCalled();
      expect(result).toEqual(MessagingResult.serviceBusSuccess());
    });

    it('should return failure result when both WebSocket and Service Bus fail', async () => {
      const command = new Command(
        CommandType.START,
        'user@test.com',
        new Date()
      );

      (webPubSubClient.group as jest.Mock).mockReturnValueOnce({
        sendToAll: jest.fn().mockRejectedValue(new Error('WebSocket failed')),
      });
      mockServiceBusSender.sendMessages.mockRejectedValue(new Error('Service Bus failed'));

      const result = await service.sendCommand(command);

      expect(result.sentVia).toBe(MessagingChannel.ServiceBus);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Service Bus failed');
    });
  });

  describe('sendToGroup', () => {
    it('should send message to WebPubSub group', async () => {
      const groupName = 'test-group';
      const payload = { type: 'test', data: 'value' };

      await service.sendToGroup(groupName, payload);

      expect(webPubSubClient.group).toHaveBeenCalledWith(groupName);
      expect(mockGroupClient.sendToAll).toHaveBeenCalledWith(JSON.stringify(payload));
    });
  });

  describe('closeConnections', () => {
    it('should close Service Bus sender and client', async () => {
      (CommandMessagingService as any).serviceBusSender = mockServiceBusSender;
      (CommandMessagingService as any).serviceBusClient = mockServiceBusClient;

      await CommandMessagingService.closeConnections();

      expect(mockServiceBusSender.close).toHaveBeenCalled();
      expect(mockServiceBusClient.close).toHaveBeenCalled();
    });

    it('should handle case when sender does not exist', async () => {
      (CommandMessagingService as any).serviceBusSender = undefined;
      (CommandMessagingService as any).serviceBusClient = mockServiceBusClient;

      await CommandMessagingService.closeConnections();

      expect(mockServiceBusClient.close).toHaveBeenCalled();
    });

    it('should handle case when client does not exist', async () => {
      (CommandMessagingService as any).serviceBusClient = undefined;
      (CommandMessagingService as any).serviceBusSender = mockServiceBusSender;

      await CommandMessagingService.closeConnections();

      expect(mockServiceBusSender.close).toHaveBeenCalled();
    });
  });
});

