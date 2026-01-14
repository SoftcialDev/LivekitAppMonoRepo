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
const mockPrismaClient = createMockPrismaClient();
(prisma as any) = mockPrismaClient;

// Ensure presence methods are available
if (!mockPrismaClient.presence) {
  mockPrismaClient.presence = {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  };
}

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

  describe('listConnectionsInGroup', () => {
    it('should list connections in group', async () => {
      const groupName = 'presence';
      const mockConnections = [
        { connectionId: 'conn-1', userId: 'user-1' },
        { connectionId: 'conn-2', userId: 'user-2' },
        { connectionId: 'conn-3', userId: undefined },
      ];

      const mockListConnections = jest.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          for (const conn of mockConnections) {
            yield conn;
          }
        },
      });

      mockGroup.listConnections = mockListConnections;

      const result = await service.listConnectionsInGroup(groupName);

      expect(mockClient.group).toHaveBeenCalledWith(groupName);
      expect(result).toEqual([
        { connectionId: 'conn-1', userId: 'user-1' },
        { connectionId: 'conn-2', userId: 'user-2' },
        { connectionId: 'conn-3', userId: undefined },
      ]);
    });

    it('should handle missing connectionId', async () => {
      const groupName = 'presence';
      const mockConnections = [
        { userId: 'user-1' },
      ];

      const mockListConnections = jest.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          for (const conn of mockConnections) {
            yield conn;
          }
        },
      });

      mockGroup.listConnections = mockListConnections;

      const result = await service.listConnectionsInGroup(groupName);

      expect(result[0].connectionId).toBe('unknown');
    });

    it('should throw error when listing fails', async () => {
      const groupName = 'presence';
      const error = new Error('List failed');

      mockGroup.listConnections = jest.fn().mockRejectedValue(error);

      await expect(service.listConnectionsInGroup(groupName)).rejects.toThrow();
    });
  });

  describe('getActiveUsersInPresenceGroup', () => {
    it('should get active users in presence group', async () => {
      const mockConnections = [
        { userId: 'user-1', userRoles: ['admin'] },
        { userId: 'user-2', userRoles: ['user'] },
        { userId: undefined, userRoles: undefined },
      ];

      const mockListConnections = jest.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          for (const conn of mockConnections) {
            yield conn;
          }
        },
      });

      mockGroup.listConnections = mockListConnections;

      const result = await service.getActiveUsersInPresenceGroup();

      expect(result).toEqual([
        { userId: 'user-1', userRoles: ['admin'] },
        { userId: 'user-2', userRoles: ['user'] },
        { userId: 'unknown', userRoles: [] },
      ]);
    });

    it('should throw error when getting active users fails', async () => {
      const error = new Error('Failed to get active users');

      mockGroup.listConnections = jest.fn().mockRejectedValue(error);

      await expect(service.getActiveUsersInPresenceGroup()).rejects.toThrow();
    });
  });

  describe('syncAllUsersWithDatabase', () => {
    it('should sync users with database', async () => {
      const mockConnections = [
        { connectionId: 'conn-1', userId: 'user-1@test.com' },
        { connectionId: 'conn-2', userId: 'user-2@test.com' },
      ];

      const mockListConnections = jest.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          for (const conn of mockConnections) {
            yield conn;
          }
        },
      });

      mockGroup.listConnections = mockListConnections;

      const listConnectionsInGroupSpy = jest.spyOn(service, 'listConnectionsInGroup');
      listConnectionsInGroupSpy.mockResolvedValue(mockConnections);

      (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'user-1',
          email: 'user-1@test.com',
          presence: { status: 'offline' },
        },
        {
          id: 'user-2',
          email: 'user-2@test.com',
          presence: { status: 'online' },
        },
        {
          id: 'user-3',
          email: 'user-3@test.com',
          presence: { status: 'online' },
        },
      ]);

      if (!mockPrismaClient.presence) {
        mockPrismaClient.presence = {
          upsert: jest.fn().mockResolvedValue({}),
        };
      }

      const result = await service.syncAllUsersWithDatabase();

      expect(result.corrected).toBeGreaterThan(0);
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
    });

    it('should handle WebPubSub connection errors', async () => {
      const listConnectionsInGroupSpy = jest.spyOn(service, 'listConnectionsInGroup');
      listConnectionsInGroupSpy.mockRejectedValue(new Error('Failed'));

      (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'user-1',
          email: 'user-1@test.com',
          presence: { status: 'offline' },
        },
      ]);

      const result = await service.syncAllUsersWithDatabase();

      expect(result.corrected).toBe(0);
    });

    it('should mark users online when in WebPubSub but offline in DB', async () => {
      const mockConnections = [
        { connectionId: 'conn-1', userId: 'user-1@test.com' },
      ];

      const listConnectionsInGroupSpy = jest.spyOn(service, 'listConnectionsInGroup');
      listConnectionsInGroupSpy.mockResolvedValue(mockConnections);

      (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'user-1',
          email: 'user-1@test.com',
          presence: { status: 'offline' },
        },
      ]);

      if (!mockPrismaClient.presence) {
        mockPrismaClient.presence = {
          upsert: jest.fn().mockResolvedValue({}),
        };
      }

      const result = await service.syncAllUsersWithDatabase();

      expect(result.corrected).toBe(1);
      expect(mockPrismaClient.presence.upsert).toHaveBeenCalled();
    });

    it('should mark users offline when not in WebPubSub but online in DB', async () => {
      const mockConnections: any[] = [];

      const listConnectionsInGroupSpy = jest.spyOn(service, 'listConnectionsInGroup');
      listConnectionsInGroupSpy.mockResolvedValue(mockConnections);

      (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'user-1',
          email: 'user-1@test.com',
          presence: { status: 'online' },
        },
      ]);

      if (!mockPrismaClient.presence) {
        mockPrismaClient.presence = {
          upsert: jest.fn().mockResolvedValue({}),
        };
      }

      const result = await service.syncAllUsersWithDatabase();

      expect(result.corrected).toBe(1);
      expect(mockPrismaClient.presence.upsert).toHaveBeenCalled();
    });

    it('should throw error when sync fails', async () => {
      const listConnectionsInGroupSpy = jest.spyOn(service, 'listConnectionsInGroup');
      listConnectionsInGroupSpy.mockRejectedValue(new Error('Sync failed'));

      (mockPrismaClient.user.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.syncAllUsersWithDatabase()).rejects.toThrow();
    });
  });

  describe('debugSync', () => {
    it('should return debug sync information', async () => {
      const mockConnections = [
        { connectionId: 'conn-1', userId: 'user-1@test.com' },
      ];

      const listConnectionsInGroupSpy = jest.spyOn(service, 'listConnectionsInGroup');
      listConnectionsInGroupSpy.mockResolvedValue(mockConnections);

      const syncAllUsersWithDatabaseSpy = jest.spyOn(service, 'syncAllUsersWithDatabase');
      syncAllUsersWithDatabaseSpy.mockResolvedValue({
        corrected: 1,
        warnings: [],
        errors: [],
      });

      (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'user-1',
          email: 'user-1@test.com',
          presence: { status: 'offline' },
        },
      ]);

      const result = await service.debugSync();

      expect(result.corrected).toBe(1);
      expect(result.webPubSubUsers).toBeInstanceOf(Array);
      expect(result.dbUsers).toBeInstanceOf(Array);
    });

    it('should handle errors when getting WebPubSub users for debug', async () => {
      const listConnectionsInGroupSpy = jest.spyOn(service, 'listConnectionsInGroup');
      listConnectionsInGroupSpy.mockRejectedValue(new Error('Failed'));

      const syncAllUsersWithDatabaseSpy = jest.spyOn(service, 'syncAllUsersWithDatabase');
      syncAllUsersWithDatabaseSpy.mockResolvedValue({
        corrected: 0,
        warnings: [],
        errors: [],
      });

      (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.debugSync();

      expect(result.webPubSubUsers).toEqual([]);
    });
  });

  describe('broadcastSupervisorListChanged', () => {
    it('should broadcast supervisor list changed', async () => {
      const payload = {
        email: 'supervisor@test.com',
        fullName: 'Test Supervisor',
        action: 'added' as const,
        azureAdObjectId: 'azure-123',
      };

      await service.broadcastSupervisorListChanged(payload);

      expect(mockClient.group).toHaveBeenCalledWith(WebPubSubGroups.PRESENCE);
      expect(mockGroup.sendToAll).toHaveBeenCalled();
      const message = JSON.parse(mockGroup.sendToAll.mock.calls[0][0]);
      expect(message.type).toBe('supervisor_list_changed');
      expect(message.data).toEqual(payload);
    });

    it('should throw error when broadcast fails', async () => {
      const payload = {
        email: 'supervisor@test.com',
        fullName: 'Test Supervisor',
        action: 'removed' as const,
      };
      const error = new Error('Broadcast failed');

      mockGroup.sendToAll.mockRejectedValue(error);

      await expect(service.broadcastSupervisorListChanged(payload)).rejects.toThrow();
    });
  });

  describe('broadcastSupervisorChangeNotification', () => {
    it('should broadcast supervisor change notification', async () => {
      const payload = {
        psoEmails: ['pso1@test.com', 'pso2@test.com'],
        newSupervisorEmail: 'supervisor@test.com',
        newSupervisorId: 'supervisor-id',
        psoNames: ['PSO One', 'PSO Two'],
        newSupervisorName: 'Test Supervisor',
      };

      await service.broadcastSupervisorChangeNotification(payload);

      expect(mockClient.group).toHaveBeenCalledWith(WebPubSubGroups.PRESENCE);
      expect(mockGroup.sendToAll).toHaveBeenCalled();
      const message = JSON.parse(mockGroup.sendToAll.mock.calls[0][0]);
      expect(message.type).toBe('supervisor_change_notification');
      expect(message.data).toEqual(payload);
    });

    it('should throw error when broadcast fails', async () => {
      const payload = {
        psoEmails: ['pso1@test.com'],
        newSupervisorEmail: 'supervisor@test.com',
        psoNames: ['PSO One'],
        newSupervisorName: 'Test Supervisor',
      };
      const error = new Error('Broadcast failed');

      mockGroup.sendToAll.mockRejectedValue(error);

      await expect(service.broadcastSupervisorChangeNotification(payload)).rejects.toThrow();
    });
  });

  describe('logActiveUsersInPresenceGroup', () => {
    it('should log active users', async () => {
      const getActiveUsersInPresenceGroupSpy = jest.spyOn(service, 'getActiveUsersInPresenceGroup');
      getActiveUsersInPresenceGroupSpy.mockResolvedValue([
        { userId: 'user-1', userRoles: ['admin'] },
      ]);

      await service.logActiveUsersInPresenceGroup();

      expect(getActiveUsersInPresenceGroupSpy).toHaveBeenCalled();
    });

    it('should throw error when logging fails', async () => {
      const getActiveUsersInPresenceGroupSpy = jest.spyOn(service, 'getActiveUsersInPresenceGroup');
      getActiveUsersInPresenceGroupSpy.mockRejectedValue(new Error('Failed'));

      await expect(service.logActiveUsersInPresenceGroup()).rejects.toThrow();
    });
  });
});

