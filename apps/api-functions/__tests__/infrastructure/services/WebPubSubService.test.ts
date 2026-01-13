import { WebPubSubService } from '../../../src/infrastructure/services/WebPubSubService';
import { WebPubSubServiceClient } from '@azure/web-pubsub';
import { config } from '../../../src/config';
import { WebPubSubGroups } from '../../../src/domain/constants/WebPubSubGroups';
import prisma from '../../../src/infrastructure/database/PrismaClientService';
import { createMockPrismaClient } from '../../shared/mocks';

jest.mock('@azure/web-pubsub');
jest.mock('../../../src/config', () => ({
  config: {
    webPubSubEndpoint: 'https://test.webpubsub.azure.com',
    webPubSubKey: 'test-key',
    webPubSubHubName: 'test-hub',
  },
}));
jest.mock('../../../src/infrastructure/database/PrismaClientService');

const MockWebPubSubServiceClient = WebPubSubServiceClient as jest.MockedClass<typeof WebPubSubServiceClient>;
const mockPrismaClient = prisma as ReturnType<typeof createMockPrismaClient>;

describe('WebPubSubService', () => {
  let service: WebPubSubService;
  let mockClient: jest.Mocked<WebPubSubServiceClient>;
  let mockGroup: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGroup = {
      sendToAll: jest.fn().mockResolvedValue(undefined),
      sendToConnection: jest.fn().mockResolvedValue(undefined),
      addConnection: jest.fn().mockResolvedValue(undefined),
      removeConnection: jest.fn().mockResolvedValue(undefined),
    };

    mockClient = {
      getClientAccessToken: jest.fn(),
      group: jest.fn().mockReturnValue(mockGroup),
    } as any;

    MockWebPubSubServiceClient.mockImplementation(() => mockClient);

    service = new WebPubSubService();
  });

  describe('constructor', () => {
    it('should create WebPubSubServiceClient with config values', () => {
      expect(MockWebPubSubServiceClient).toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate token successfully', async () => {
      const userId = 'user@example.com';
      const groups = ['presence', 'notifications'];
      const expectedToken = 'jwt-token';

      mockClient.getClientAccessToken.mockResolvedValue({
        token: expectedToken,
      } as any);

      const result = await service.generateToken(userId, groups);

      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        roles: ['webpubsub.joinLeaveGroup', 'webpubsub.receive'],
        userId: 'user@example.com',
        groups: ['presence', 'notifications'],
      });
      expect(result).toBe(expectedToken);
    });

    it('should normalize userId and groups', async () => {
      const userId = '  USER@EXAMPLE.COM  ';
      const groups = ['  PRESENCE  ', '  NOTIFICATIONS  '];
      const expectedToken = 'jwt-token';

      mockClient.getClientAccessToken.mockResolvedValue({
        token: expectedToken,
      } as any);

      const result = await service.generateToken(userId, groups);

      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        roles: ['webpubsub.joinLeaveGroup', 'webpubsub.receive'],
        userId: 'user@example.com',
        groups: ['presence', 'notifications'],
      });
      expect(result).toBe(expectedToken);
    });

    it('should throw error when token generation fails', async () => {
      const userId = 'user@example.com';
      const groups = ['presence'];
      const error = new Error('Token generation failed');

      mockClient.getClientAccessToken.mockRejectedValue(error);

      await expect(service.generateToken(userId, groups)).rejects.toThrow();
    });
  });

  describe('broadcastPresence', () => {
    it('should broadcast presence successfully', async () => {
      const payload = {
        email: 'user@example.com',
        fullName: 'John Doe',
        status: 'online' as const,
        lastSeenAt: '2023-01-01T00:00:00Z',
      };

      await service.broadcastPresence(payload);

      expect(mockClient.group).toHaveBeenCalledWith(WebPubSubGroups.PRESENCE);
      expect(mockGroup.sendToAll).toHaveBeenCalledWith(
        JSON.stringify({ type: 'presence', user: payload })
      );
    });

    it('should throw error when broadcast fails', async () => {
      const payload = {
        email: 'user@example.com',
        fullName: 'John Doe',
        status: 'offline' as const,
        lastSeenAt: '2023-01-01T00:00:00Z',
      };
      const error = new Error('Broadcast failed');

      mockGroup.sendToAll.mockRejectedValue(error);

      await expect(service.broadcastPresence(payload)).rejects.toThrow();
    });
  });

  describe('broadcastMessage', () => {
    it('should broadcast message to group successfully', async () => {
      const group = 'notifications';
      const message = { type: 'test', data: 'value' };

      await service.broadcastMessage(group, message);

      expect(mockClient.group).toHaveBeenCalledWith(group);
      expect(mockGroup.sendToAll).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should throw error when broadcast fails', async () => {
      const group = 'notifications';
      const message = { type: 'test' };
      const error = new Error('Broadcast failed');

      mockGroup.sendToAll.mockRejectedValue(error);

      await expect(service.broadcastMessage(group, message)).rejects.toThrow();
    });
  });

  describe('listAllGroupsAndUsers', () => {
    it('should list all groups and users', async () => {
      const listConnectionsInGroupSpy = jest.spyOn(service, 'listConnectionsInGroup' as any);
      listConnectionsInGroupSpy.mockResolvedValue(undefined);

      await service.listAllGroupsAndUsers();

      expect(listConnectionsInGroupSpy).toHaveBeenCalledWith(WebPubSubGroups.PRESENCE);
      expect(listConnectionsInGroupSpy).toHaveBeenCalledWith('livekit_agent_azure_pubsub');
      expect(listConnectionsInGroupSpy).toHaveBeenCalledWith('notifications');
      expect(listConnectionsInGroupSpy).toHaveBeenCalledWith('streaming');
    });

    it('should handle errors gracefully', async () => {
      const listConnectionsInGroupSpy = jest.spyOn(service, 'listConnectionsInGroup' as any);
      listConnectionsInGroupSpy.mockRejectedValue(new Error('Failed'));

      await expect(service.listAllGroupsAndUsers()).resolves.not.toThrow();
    });
  });
});

