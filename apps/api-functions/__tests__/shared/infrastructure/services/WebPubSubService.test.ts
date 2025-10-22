import { WebPubSubService } from '../../../../shared/infrastructure/services/WebPubSubService';
import { config } from '../../../../shared/config';
import { getCentralAmericaTime } from '../../../../shared/utils/dateUtils';
import prisma from '../../../../shared/infrastructure/database/PrismaClientService';

// Mock dependencies
jest.mock('../../../../shared/config');
jest.mock('../../../../shared/utils/dateUtils');
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  presence: {
    upsert: jest.fn(),
  },
}));
jest.mock('@azure/web-pubsub', () => ({
  WebPubSubServiceClient: jest.fn().mockImplementation(() => ({
    getClientAccessToken: jest.fn(),
    sendToAll: jest.fn(),
    sendToGroup: jest.fn(),
    sendToUser: jest.fn(),
    removeUserFromAllGroups: jest.fn(),
    addUserToGroup: jest.fn(),
    removeUserFromGroup: jest.fn(),
    listConnectionsInGroup: jest.fn(),
    group: jest.fn().mockReturnValue({
      listConnections: jest.fn(),
      sendToAll: jest.fn(),
    }),
  })),
  AzureKeyCredential: jest.fn(),
}));

const mockConfig = config as jest.Mocked<typeof config>;
const mockGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;
const mockPrisma = prisma as any;

describe('WebPubSubService', () => {
  let webPubSubService: WebPubSubService;
  let mockClient: any;

  beforeEach(() => {
    // Mock config values
    mockConfig.webPubSubEndpoint = 'https://test.webpubsub.azure.com';
    mockConfig.webPubSubKey = 'test-key';
    mockConfig.webPubSubHubName = 'test-hub';

    // Mock date utils
    mockGetCentralAmericaTime.mockReturnValue(new Date('2023-01-01T00:00:00.000Z'));

    // Mock prisma
    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        email: 'user1@example.com',
        presence: null,
      },
      {
        id: 'user-2', 
        email: 'user2@example.com',
        presence: null,
      },
    ]);
    
    mockPrisma.presence.upsert.mockResolvedValue({
      id: 'presence-1',
      userId: 'user-1',
      status: 'online',
      lastSeenAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create service instance
    webPubSubService = new WebPubSubService();

    // Get mocked client
    const { WebPubSubServiceClient } = require('@azure/web-pubsub');
    mockClient = new WebPubSubServiceClient();
    
    // Configure mock client methods
    mockClient.getClientAccessToken.mockResolvedValue({
      token: 'mock-token',
      url: 'wss://mock-endpoint',
    });
    
    // Create a mock group object
    const mockGroup = {
      listConnections: jest.fn(),
      sendToAll: jest.fn(),
    };
    
    mockClient.group.mockReturnValue(mockGroup);
    
    // Mock listConnectionsInGroup to return an async iterator
    mockClient.listConnectionsInGroup.mockResolvedValue([]);
    
    // Assign the mock client to the service's private client property
    (webPubSubService as any).client = mockClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create WebPubSubService instance', () => {
      expect(webPubSubService).toBeInstanceOf(WebPubSubService);
    });

    it('should initialize WebPubSubServiceClient with correct parameters', () => {
      const { WebPubSubServiceClient } = require('@azure/web-pubsub');
      expect(WebPubSubServiceClient).toHaveBeenCalledWith(
        'https://test.webpubsub.azure.com',
        expect.any(Object),
        'test-hub'
      );
    });
  });

  describe('generateToken', () => {
    it('should generate token successfully', async () => {
      const result = await webPubSubService.generateToken('user@example.com', ['group1', 'group2']);

      expect(result).toBe('mock-token');
      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        userId: 'user@example.com',
        groups: ['group1', 'group2'],
        roles: ['webpubsub.joinLeaveGroup', 'webpubsub.receive'],
      });
    });

    it('should normalize user ID and groups', async () => {
      await webPubSubService.generateToken('  USER@EXAMPLE.COM  ', ['  GROUP1  ', '  GROUP2  ']);

      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        userId: 'user@example.com',
        groups: ['group1', 'group2'],
        roles: ['webpubsub.joinLeaveGroup', 'webpubsub.receive'],
      });
    });

    it('should handle token generation errors', async () => {
      mockClient.getClientAccessToken.mockRejectedValue(new Error('Token generation failed'));

      await expect(webPubSubService.generateToken('user@example.com', ['group1']))
        .rejects.toThrow('Failed to generate WebPubSub token: Token generation failed');
    });
  });

  describe('broadcastPresence', () => {
    it('should broadcast presence successfully', async () => {
      const mockGroup = mockClient.group();
      mockGroup.sendToAll.mockResolvedValue(undefined);

      const payload = {
        email: 'user@example.com',
        fullName: 'Test User',
        status: 'online' as const,
        lastSeenAt: '2023-01-01T00:00:00.000Z',
        role: 'Employee',
        supervisorId: null,
        supervisorEmail: null,
      };

      await webPubSubService.broadcastPresence(payload);

      expect(mockClient.group).toHaveBeenCalledWith('presence');
      expect(mockGroup.sendToAll).toHaveBeenCalledWith(JSON.stringify({
        type: 'presence',
        user: payload,
      }));
    });

    it('should handle broadcast errors', async () => {
      const mockGroup = mockClient.group();
      mockGroup.sendToAll.mockRejectedValue(new Error('Broadcast failed'));

      const payload = {
        email: 'user@example.com',
        fullName: 'Test User',
        status: 'online' as const,
        lastSeenAt: '2023-01-01T00:00:00.000Z',
        role: 'Employee',
        supervisorId: null,
        supervisorEmail: null,
      };

      await expect(webPubSubService.broadcastPresence(payload))
        .rejects.toThrow('Failed to broadcast presence: Broadcast failed');
    });
  });

  describe('broadcastMessage', () => {
    it('should broadcast message to group successfully', async () => {
      const mockGroup = mockClient.group();
      mockGroup.sendToAll.mockResolvedValue(undefined);

      const message = { type: 'test', data: 'test-data' };
      await webPubSubService.broadcastMessage('test-group', message);

      expect(mockClient.group).toHaveBeenCalledWith('test-group');
      expect(mockGroup.sendToAll).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should handle broadcast message errors', async () => {
      const mockGroup = mockClient.group();
      mockGroup.sendToAll.mockRejectedValue(new Error('Send failed'));

      const message = { type: 'test', data: 'test-data' };
      await expect(webPubSubService.broadcastMessage('test-group', message))
        .rejects.toThrow('Failed to broadcast message to group \'test-group\': Send failed');
    });
  });

  describe('listAllGroupsAndUsers', () => {
    it('should list groups and users successfully', async () => {
      const mockGroup = mockClient.group();
      mockGroup.listConnections.mockResolvedValue([
        { connectionId: 'conn1', userId: 'user1' },
        { connectionId: 'conn2', userId: 'user2' },
      ]);

      await webPubSubService.listAllGroupsAndUsers();

      expect(mockClient.group).toHaveBeenCalledWith('presence');
      expect(mockGroup.listConnections).toHaveBeenCalled();
    });

    it('should handle list errors gracefully', async () => {
      const mockGroup = mockClient.group();
      mockGroup.listConnections.mockRejectedValue(new Error('List failed'));

      // This method handles errors internally and doesn't throw
      await expect(webPubSubService.listAllGroupsAndUsers()).resolves.toBeUndefined();
    });
  });

  describe('listConnectionsInGroup', () => {
    it('should list connections in group successfully', async () => {
      const mockConnections = [
        { connectionId: 'conn1', userId: 'user1' },
        { connectionId: 'conn2', userId: 'user2' },
      ];
      const mockGroup = mockClient.group();
      mockGroup.listConnections.mockResolvedValue(mockConnections);

      const result = await webPubSubService.listConnectionsInGroup('test-group');

      expect(result).toEqual(mockConnections);
      expect(mockClient.group).toHaveBeenCalledWith('test-group');
      expect(mockGroup.listConnections).toHaveBeenCalled();
    });

    it('should handle empty group', async () => {
      const mockGroup = mockClient.group();
      mockGroup.listConnections.mockResolvedValue([]);

      const result = await webPubSubService.listConnectionsInGroup('empty-group');

      expect(result).toEqual([]);
    });
  });

  describe('getActiveUsersInPresenceGroup', () => {
    it('should get active users successfully', async () => {
      const mockConnections = [
        { connectionId: 'conn1', userId: 'user1@example.com', userRoles: ['Employee'] },
        { connectionId: 'conn2', userId: 'user2@example.com', userRoles: ['Supervisor'] },
      ];
      const mockGroup = mockClient.group();
      mockGroup.listConnections.mockResolvedValue(mockConnections);

      const mockUsers = [
        { id: 'user1', email: 'user1@example.com', fullName: 'User One', role: 'Employee' },
        { id: 'user2', email: 'user2@example.com', fullName: 'User Two', role: 'Supervisor' },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await webPubSubService.getActiveUsersInPresenceGroup();

      expect(result).toEqual([
        { userId: 'user1@example.com', userRoles: ['Employee'] },
        { userId: 'user2@example.com', userRoles: ['Supervisor'] },
      ]);
    });

    it('should handle no active users', async () => {
      const mockGroup = mockClient.group();
      mockGroup.listConnections.mockResolvedValue([]);

      const result = await webPubSubService.getActiveUsersInPresenceGroup();

      expect(result).toEqual([]);
    });
  });

  describe('syncAllUsersWithDatabase', () => {
    it('should sync users successfully', async () => {
      const mockConnections = [
        { connectionId: 'conn1', userId: 'user1@example.com' },
        { connectionId: 'conn2', userId: 'user2@example.com' },
      ];
      const mockGroup = mockClient.group();
      mockGroup.listConnections.mockResolvedValue(mockConnections);

      const mockUsers = [
        { id: 'user1', email: 'user1@example.com', fullName: 'User One', role: 'Employee' },
        { id: 'user2', email: 'user2@example.com', fullName: 'User Two', role: 'Supervisor' },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await webPubSubService.syncAllUsersWithDatabase();

      expect(result).toEqual({
        corrected: 2,
        errors: [],
        warnings: [],
      });
    });

    it('should handle sync errors', async () => {
      const mockGroup = mockClient.group();
      mockGroup.listConnections.mockRejectedValue(new Error('WebPubSub error'));
      mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

      await expect(webPubSubService.syncAllUsersWithDatabase())
        .rejects.toThrow('Failed to sync users with database: Database error');
    });
  });

  describe('debugSync', () => {
    it('should perform debug sync successfully', async () => {
      const mockConnections = [
        { connectionId: 'conn1', userId: 'user1@example.com' },
      ];
      const mockGroup = mockClient.group();
      mockGroup.listConnections.mockResolvedValue(mockConnections);

      const mockUsers = [
        { id: 'user1', email: 'user1@example.com', roles: ['PSO'] },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await webPubSubService.debugSync();

      expect(result).toEqual({
        corrected: 1,
        dbUsers: [{ email: 'user1@example.com', status: 'no_presence' }],
        errors: [],
        warnings: [],
        webPubSubUsers: ['user1@example.com'],
      });
    });
  });

  describe('broadcastSupervisorChangeNotification', () => {
    it('should broadcast supervisor change notification successfully', async () => {
      const mockGroup = mockClient.group();
      mockGroup.sendToAll.mockResolvedValue(undefined);

      const payload = {
        psoEmails: ['pso1@example.com', 'pso2@example.com'],
        psoNames: ['PSO One', 'PSO Two'],
        newSupervisorEmail: 'supervisor@example.com',
        newSupervisorName: 'Supervisor Name',
        newSupervisorId: 'supervisor-123',
        oldSupervisorEmail: 'old-supervisor@example.com',
      };

      await webPubSubService.broadcastSupervisorChangeNotification(payload);

      expect(mockClient.group).toHaveBeenCalledWith('presence');
      expect(mockGroup.sendToAll).toHaveBeenCalledWith(JSON.stringify({
        type: 'supervisor_change_notification',
        data: payload,
        timestamp: '2023-01-01T00:00:00.000Z',
      }));
    });
  });

  describe('logActiveUsersInPresenceGroup', () => {
    it('should log active users successfully', async () => {
      const mockConnections = [
        { connectionId: 'conn1', userId: 'user1@example.com' },
      ];
      const mockGroup = mockClient.group();
      mockGroup.listConnections.mockResolvedValue(mockConnections);

      const mockUsers = [
        { id: 'user1', email: 'user1@example.com', roles: ['PSO'] },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      // This method doesn't return anything, just logs
      await expect(webPubSubService.logActiveUsersInPresenceGroup()).resolves.toBeUndefined();
    });
  });
});
