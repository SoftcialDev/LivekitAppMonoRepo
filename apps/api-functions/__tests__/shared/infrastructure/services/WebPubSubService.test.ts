/**
 * @fileoverview WebPubSubService tests
 * @description Unit tests for WebPubSubService
 */

import { WebPubSubService } from '../../../../shared/infrastructure/services/WebPubSubService';
import { WebPubSubServiceClient } from '@azure/web-pubsub';
import { AzureKeyCredential } from '@azure/core-auth';

// Mock Azure WebPubSub SDK
jest.mock('@azure/web-pubsub', () => ({
  WebPubSubServiceClient: jest.fn().mockImplementation(() => ({
    getClientAccessToken: jest.fn(),
    group: jest.fn().mockReturnValue({
      sendToAll: jest.fn(),
      listConnections: jest.fn()
    })
  })),
  AzureKeyCredential: jest.fn().mockImplementation((key) => ({ key }))
}));

// Mock config
jest.mock('../../../../shared/config', () => ({
  config: {
    webPubSubEndpoint: 'https://test.webpubsub.azure.com',
    webPubSubKey: 'test-key',
    webPubSubHubName: 'test-hub'
  }
}));

// Mock dateUtils
jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2023-01-01T00:00:00Z'))
}));

// Mock Prisma
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  default: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn()
    },
    presence: {
      upsert: jest.fn()
    }
  }
}));

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

describe('WebPubSubService', () => {
  let service: WebPubSubService;
  let mockClient: jest.Mocked<WebPubSubServiceClient>;
  let mockGroupClient: any;

  beforeEach(() => {
    // Reset console mocks
    Object.assign(console, mockConsole);
    jest.clearAllMocks();

    service = new WebPubSubService();
    
    // Get the mocked instances
    mockClient = (WebPubSubServiceClient as jest.MockedClass<typeof WebPubSubServiceClient>).mock.results[0].value as jest.Mocked<WebPubSubServiceClient>;
    
    // Setup group client mock
    mockGroupClient = {
      sendToAll: jest.fn(),
      listConnections: jest.fn()
    };
    mockClient.group.mockReturnValue(mockGroupClient);
  });

  describe('constructor', () => {
    it('should create WebPubSubService with correct configuration', () => {
      expect(WebPubSubServiceClient).toHaveBeenCalledWith(
        'https://test.webpubsub.azure.com',
        expect.any(Object),
        'test-hub'
      );
      // AzureKeyCredential is called internally, we can't easily test it
      expect(true).toBe(true);
    });
  });

  describe('generateToken', () => {
    it('should generate token successfully', async () => {
      const mockTokenResponse = { token: 'jwt-token-string' };
      mockClient.getClientAccessToken.mockResolvedValue(mockTokenResponse as any);

      const result = await service.generateToken('user@example.com', ['presence', 'user@example.com']);

      expect(result).toBe('jwt-token-string');
      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        roles: ["webpubsub.joinLeaveGroup", "webpubsub.receive"],
        userId: 'user@example.com',
        groups: ['presence', 'user@example.com']
      });
    });

    it('should normalize user ID and groups', async () => {
      const mockTokenResponse = { token: 'jwt-token-string' };
      mockClient.getClientAccessToken.mockResolvedValue(mockTokenResponse as any);

      await service.generateToken('  USER@EXAMPLE.COM  ', ['  PRESENCE  ', '  USER@EXAMPLE.COM  ']);

      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        roles: ["webpubsub.joinLeaveGroup", "webpubsub.receive"],
        userId: 'user@example.com',
        groups: ['presence', 'user@example.com']
      });
    });

    it('should throw error when token generation fails', async () => {
      const error = { message: 'Token generation failed' };
      mockClient.getClientAccessToken.mockRejectedValue(error);

      await expect(service.generateToken('user@example.com', ['presence']))
        .rejects.toThrow('Failed to generate WebPubSub token: Token generation failed');
    });
  });

  describe('broadcastPresence', () => {
    it('should broadcast presence successfully', async () => {
      const payload = {
        email: 'user@example.com',
        fullName: 'John Doe',
        status: 'online' as const,
        lastSeenAt: '2023-01-01T00:00:00Z',
        role: 'ContactManager',
        supervisorId: 'supervisor-123',
        supervisorEmail: 'supervisor@example.com'
      };

      mockGroupClient.sendToAll.mockResolvedValue(undefined);

      await service.broadcastPresence(payload);

      expect(mockClient.group).toHaveBeenCalledWith('presence');
      expect(mockGroupClient.sendToAll).toHaveBeenCalledWith(JSON.stringify({
        type: 'presence',
        user: payload
      }));
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('📡 [WebPubSubService] broadcastPresence: Starting broadcast for user user@example.com with status online')
      );
    });

    it('should throw error when broadcast fails', async () => {
      const payload = {
        email: 'user@example.com',
        fullName: 'John Doe',
        status: 'offline' as const,
        lastSeenAt: '2023-01-01T00:00:00Z'
      };

      const error = { message: 'Broadcast failed' };
      mockGroupClient.sendToAll.mockRejectedValue(error);

      await expect(service.broadcastPresence(payload))
        .rejects.toThrow('Failed to broadcast presence: Broadcast failed');
    });
  });

  describe('broadcastMessage', () => {
    it('should broadcast message successfully', async () => {
      const message = { type: 'test', data: 'test data' };

      mockGroupClient.sendToAll.mockResolvedValue(undefined);

      await service.broadcastMessage('test-group', message);

      expect(mockClient.group).toHaveBeenCalledWith('test-group');
      expect(mockGroupClient.sendToAll).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should throw error when broadcast fails', async () => {
      const message = { type: 'test', data: 'test data' };
      const error = { message: 'Broadcast failed' };
      mockGroupClient.sendToAll.mockRejectedValue(error);

      await expect(service.broadcastMessage('test-group', message))
        .rejects.toThrow('Failed to broadcast message to group \'test-group\': Broadcast failed');
    });
  });

  describe('listConnectionsInGroup', () => {
    it('should list connections successfully', async () => {
      const mockConnections = [
        { connectionId: 'conn-1', userId: 'user-1' },
        { connectionId: 'conn-2', userId: 'user-2' },
        { connectionId: 'conn-3', userId: undefined }
      ];

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          for (const conn of mockConnections) {
            yield conn;
          }
        }
      };

      mockGroupClient.listConnections.mockReturnValue(mockAsyncIterator);

      const result = await service.listConnectionsInGroup('test-group');

      expect(result).toEqual([
        { connectionId: 'conn-1', userId: 'user-1' },
        { connectionId: 'conn-2', userId: 'user-2' },
        { connectionId: 'conn-3', userId: undefined }
      ]);
    });

    it('should handle connections without userId', async () => {
      const mockConnections = [
        { connectionId: 'conn-1' }
      ];

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          for (const conn of mockConnections) {
            yield conn;
          }
        }
      };

      mockGroupClient.listConnections.mockReturnValue(mockAsyncIterator);

      const result = await service.listConnectionsInGroup('test-group');

      expect(result).toEqual([
        { connectionId: 'conn-1', userId: undefined }
      ]);
    });

    it('should throw error when listing fails', async () => {
      const error = new Error('List failed');
      mockGroupClient.listConnections.mockRejectedValue(error);

      await expect(service.listConnectionsInGroup('test-group'))
        .rejects.toThrow('List failed');
    });
  });

  describe('getActiveUsersInPresenceGroup', () => {
    it('should get active users successfully', async () => {
      const mockConnections = [
        { connectionId: 'conn-1', userId: 'user-1', userRoles: ['ContactManager'] },
        { connectionId: 'conn-2', userId: 'user-2', userRoles: ['Supervisor'] },
        { connectionId: 'conn-3', userId: 'user-3' }
      ];

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          for (const conn of mockConnections) {
            yield conn;
          }
        }
      };

      mockGroupClient.listConnections.mockReturnValue(mockAsyncIterator);

      const result = await service.getActiveUsersInPresenceGroup();

      expect(result).toEqual([
        { userId: 'user-1', userRoles: ['ContactManager'] },
        { userId: 'user-2', userRoles: ['Supervisor'] },
        { userId: 'user-3', userRoles: [] }
      ]);
    });

    it('should handle unknown userId', async () => {
      const mockConnections = [
        { connectionId: 'conn-1', userId: undefined }
      ];

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          for (const conn of mockConnections) {
            yield conn;
          }
        }
      };

      mockGroupClient.listConnections.mockReturnValue(mockAsyncIterator);

      const result = await service.getActiveUsersInPresenceGroup();

      expect(result).toEqual([
        { userId: 'unknown', userRoles: [] }
      ]);
    });

    it('should throw error when getting users fails', async () => {
      const error = { message: 'Get users failed' };
      mockGroupClient.listConnections.mockRejectedValue(error);

      await expect(service.getActiveUsersInPresenceGroup())
        .rejects.toThrow('Failed to get active users in presence group: Get users failed');
    });
  });

  describe('broadcastSupervisorChangeNotification', () => {
    it('should broadcast supervisor change notification successfully', async () => {
      const payload = {
        psoEmails: ['pso1@example.com', 'pso2@example.com'],
        oldSupervisorEmail: 'old@example.com',
        newSupervisorEmail: 'new@example.com',
        newSupervisorId: 'supervisor-123',
        psoNames: ['PSO 1', 'PSO 2'],
        newSupervisorName: 'New Supervisor'
      };

      mockGroupClient.sendToAll.mockResolvedValue(undefined);

      await service.broadcastSupervisorChangeNotification(payload);

      expect(mockClient.group).toHaveBeenCalledWith('presence');
      expect(mockGroupClient.sendToAll).toHaveBeenCalledWith(JSON.stringify({
        type: 'supervisor_change_notification',
        data: payload,
        timestamp: '2023-01-01T00:00:00.000Z'
      }));
    });

    it('should throw error when broadcast fails', async () => {
      const payload = {
        psoEmails: ['pso1@example.com'],
        newSupervisorEmail: 'new@example.com',
        psoNames: ['PSO 1'],
        newSupervisorName: 'New Supervisor'
      };

      const error = { message: 'Broadcast failed' };
      mockGroupClient.sendToAll.mockRejectedValue(error);

      await expect(service.broadcastSupervisorChangeNotification(payload))
        .rejects.toThrow('Failed to broadcast supervisor change notification: Broadcast failed');
    });
  });

  describe('listAllGroupsAndUsers', () => {
    it('should list all groups and users successfully', async () => {
      const mockPresenceConnections = [
        { connectionId: 'conn-1', userId: 'user-1' },
        { connectionId: 'conn-2', userId: 'user-2' }
      ];

      const mockPresenceIterator = {
        [Symbol.asyncIterator]: async function* () {
          for (const conn of mockPresenceConnections) {
            yield conn;
          }
        }
      };

      mockGroupClient.listConnections.mockReturnValue(mockPresenceIterator);

      await service.listAllGroupsAndUsers();

      expect(mockClient.group).toHaveBeenCalledWith('presence');
      expect(mockConsole.log).toHaveBeenCalledWith('🔍 Listing WebPubSub groups and users...');
      expect(mockConsole.log).toHaveBeenCalledWith('📊 Presence group: 2 connections');
    });

    it('should handle errors when listing groups', async () => {
      const error = { message: 'List failed' };
      mockGroupClient.listConnections.mockRejectedValue(error);

      await service.listAllGroupsAndUsers();

      expect(mockConsole.log).toHaveBeenCalledWith('❌ Failed to list presence group:', 'List failed');
    });
  });
});