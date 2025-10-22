/**
 * @fileoverview Tests for WebPubSubService
 * @description Tests for WebPubSub operations using Azure WebPubSub SDK
 */

import { WebPubSubService } from '../../../../shared/infrastructure/services/WebPubSubService';

// Mock dependencies
jest.mock('@azure/web-pubsub', () => ({
  WebPubSubServiceClient: jest.fn().mockImplementation(() => ({
    getClientAccessToken: jest.fn(),
    sendToAll: jest.fn(),
    sendToGroup: jest.fn(),
    sendToUser: jest.fn(),
    addUserToGroup: jest.fn(),
    removeUserFromGroup: jest.fn(),
  })),
}));

jest.mock('@azure/core-auth', () => ({
  AzureKeyCredential: jest.fn().mockImplementation(() => ({
    key: 'test-access-key',
  })),
}));

jest.mock('../../../../shared/config', () => ({
  config: {
    webPubSubEndpoint: 'https://test-webpubsub.example.com',
    webPubSubKey: 'test-access-key',
    webPubSubHubName: 'test-hub',
  },
}));

jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn().mockReturnValue(new Date('2025-01-15T10:30:00Z')),
}));

jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  __esModule: true,
  default: {
    user: {
      findById: jest.fn(),
      findByEmail: jest.fn(),
    },
  },
}));

describe('WebPubSubService', () => {
  let webPubSubService: WebPubSubService;
  let mockClient: any;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    webPubSubService = new WebPubSubService();
    
    // Get mocked instances
    const { WebPubSubServiceClient } = require('@azure/web-pubsub');
    mockClient = new WebPubSubServiceClient();
    mockPrisma = require('../../../../shared/infrastructure/database/PrismaClientService').default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create WebPubSubService with config', () => {
      expect(webPubSubService).toBeInstanceOf(WebPubSubService);
    });

    it('should initialize WebPubSubServiceClient with correct parameters', () => {
      const { WebPubSubServiceClient } = require('@azure/web-pubsub');
      const { AzureKeyCredential } = require('@azure/core-auth');
      
      expect(WebPubSubServiceClient).toHaveBeenCalledWith(
        'https://test-webpubsub.example.com',
        expect.any(AzureKeyCredential),
        'test-hub'
      );
    });
  });

  describe('generateToken', () => {
    const mockUserId = 'test@example.com';
    const mockGroups = ['presence', 'notifications'];

    it('should generate token successfully', async () => {
      const mockTokenResponse = {
        token: 'test-jwt-token',
      };

      mockClient.getClientAccessToken.mockResolvedValue(mockTokenResponse);

      const result = await webPubSubService.generateToken(mockUserId, mockGroups);

      expect(result).toBe('test-jwt-token');
      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        userId: 'test@example.com',
        groups: ['presence', 'notifications'],
      });
    });

    it('should normalize user ID and groups', async () => {
      const mockTokenResponse = {
        token: 'test-jwt-token',
      };

      mockClient.getClientAccessToken.mockResolvedValue(mockTokenResponse);

      await webPubSubService.generateToken('  TEST@EXAMPLE.COM  ', ['  PRESENCE  ', '  NOTIFICATIONS  ']);

      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        userId: 'test@example.com',
        groups: ['presence', 'notifications'],
      });
    });

    it('should handle empty groups array', async () => {
      const mockTokenResponse = {
        token: 'test-jwt-token',
      };

      mockClient.getClientAccessToken.mockResolvedValue(mockTokenResponse);

      const result = await webPubSubService.generateToken(mockUserId, []);

      expect(result).toBe('test-jwt-token');
      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        userId: 'test@example.com',
        groups: [],
      });
    });

    it('should handle token generation errors', async () => {
      const tokenError = new Error('Token generation failed');
      mockClient.getClientAccessToken.mockRejectedValue(tokenError);

      await expect(webPubSubService.generateToken(mockUserId, mockGroups))
        .rejects.toThrow('Token generation failed');
    });

    it('should handle different user IDs', async () => {
      const userIds = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ];

      const mockTokenResponse = {
        token: 'test-jwt-token',
      };

      mockClient.getClientAccessToken.mockResolvedValue(mockTokenResponse);

      for (const userId of userIds) {
        await webPubSubService.generateToken(userId, mockGroups);
        expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
          userId: userId.toLowerCase(),
          groups: ['presence', 'notifications'],
        });
      }
    });

    it('should handle different group names', async () => {
      const groupSets = [
        ['presence'],
        ['notifications'],
        ['presence', 'notifications'],
        ['group1', 'group2', 'group3'],
      ];

      const mockTokenResponse = {
        token: 'test-jwt-token',
      };

      mockClient.getClientAccessToken.mockResolvedValue(mockTokenResponse);

      for (const groups of groupSets) {
        await webPubSubService.generateToken(mockUserId, groups);
        expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
          userId: 'test@example.com',
          groups: groups.map(g => g.toLowerCase()),
        });
      }
    });
  });

  describe('publishMessage', () => {
    const mockGroupName = 'test-group';
    const mockMessage = {
      type: 'notification',
      data: { message: 'test message' },
    };

    it('should publish message successfully', async () => {
      mockClient.sendToGroup.mockResolvedValue(undefined);

      await webPubSubService.publishMessage(mockGroupName, mockMessage);

      expect(mockClient.sendToGroup).toHaveBeenCalledWith(mockGroupName, mockMessage);
    });

    it('should handle different message types', async () => {
      const messages = [
        { type: 'notification', data: { message: 'test' } },
        { type: 'command', data: { command: 'start' } },
        { type: 'status', data: { status: 'online' } },
        { type: 'error', data: { error: 'test error' } },
      ];

      mockClient.sendToGroup.mockResolvedValue(undefined);

      for (const message of messages) {
        await webPubSubService.publishMessage(mockGroupName, message);
        expect(mockClient.sendToGroup).toHaveBeenCalledWith(mockGroupName, message);
      }
    });

    it('should handle different group names', async () => {
      const groupNames = [
        'group1',
        'group2',
        'group-with-dashes',
        'group_with_underscores',
        'group.with.dots',
        'group with spaces',
      ];

      const mockMessage = { type: 'test', data: {} };
      mockClient.sendToGroup.mockResolvedValue(undefined);

      for (const groupName of groupNames) {
        await webPubSubService.publishMessage(groupName, mockMessage);
        expect(mockClient.sendToGroup).toHaveBeenCalledWith(groupName, mockMessage);
      }
    });

    it('should handle publish errors', async () => {
      const publishError = new Error('Publish failed');
      mockClient.sendToGroup.mockRejectedValue(publishError);

      await expect(webPubSubService.publishMessage(mockGroupName, mockMessage))
        .rejects.toThrow('Publish failed');
    });
  });

  describe('subscribeToGroup', () => {
    const mockUserId = 'test@example.com';
    const mockGroupName = 'test-group';

    it('should subscribe user to group successfully', async () => {
      mockClient.addUserToGroup.mockResolvedValue(undefined);

      await webPubSubService.subscribeToGroup(mockUserId, mockGroupName);

      expect(mockClient.addUserToGroup).toHaveBeenCalledWith(mockGroupName, mockUserId);
    });

    it('should handle different user IDs', async () => {
      const userIds = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ];

      mockClient.addUserToGroup.mockResolvedValue(undefined);

      for (const userId of userIds) {
        await webPubSubService.subscribeToGroup(userId, mockGroupName);
        expect(mockClient.addUserToGroup).toHaveBeenCalledWith(mockGroupName, userId);
      }
    });

    it('should handle different group names', async () => {
      const groupNames = [
        'group1',
        'group2',
        'group-with-dashes',
        'group_with_underscores',
        'group.with.dots',
        'group with spaces',
      ];

      mockClient.addUserToGroup.mockResolvedValue(undefined);

      for (const groupName of groupNames) {
        await webPubSubService.subscribeToGroup(mockUserId, groupName);
        expect(mockClient.addUserToGroup).toHaveBeenCalledWith(groupName, mockUserId);
      }
    });

    it('should handle subscribe errors', async () => {
      const subscribeError = new Error('Subscribe failed');
      mockClient.addUserToGroup.mockRejectedValue(subscribeError);

      await expect(webPubSubService.subscribeToGroup(mockUserId, mockGroupName))
        .rejects.toThrow('Subscribe failed');
    });
  });

  describe('unsubscribeFromGroup', () => {
    const mockUserId = 'test@example.com';
    const mockGroupName = 'test-group';

    it('should unsubscribe user from group successfully', async () => {
      mockClient.removeUserFromGroup.mockResolvedValue(undefined);

      await webPubSubService.unsubscribeFromGroup(mockUserId, mockGroupName);

      expect(mockClient.removeUserFromGroup).toHaveBeenCalledWith(mockGroupName, mockUserId);
    });

    it('should handle different user IDs', async () => {
      const userIds = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ];

      mockClient.removeUserFromGroup.mockResolvedValue(undefined);

      for (const userId of userIds) {
        await webPubSubService.unsubscribeFromGroup(userId, mockGroupName);
        expect(mockClient.removeUserFromGroup).toHaveBeenCalledWith(mockGroupName, userId);
      }
    });

    it('should handle different group names', async () => {
      const groupNames = [
        'group1',
        'group2',
        'group-with-dashes',
        'group_with_underscores',
        'group.with.dots',
        'group with spaces',
      ];

      mockClient.removeUserFromGroup.mockResolvedValue(undefined);

      for (const groupName of groupNames) {
        await webPubSubService.unsubscribeFromGroup(mockUserId, groupName);
        expect(mockClient.removeUserFromGroup).toHaveBeenCalledWith(groupName, mockUserId);
      }
    });

    it('should handle unsubscribe errors', async () => {
      const unsubscribeError = new Error('Unsubscribe failed');
      mockClient.removeUserFromGroup.mockRejectedValue(unsubscribeError);

      await expect(webPubSubService.unsubscribeFromGroup(mockUserId, mockGroupName))
        .rejects.toThrow('Unsubscribe failed');
    });
  });

  describe('sendToGroup', () => {
    const mockGroupName = 'test-group';
    const mockMessage = {
      type: 'notification',
      data: { message: 'test message' },
    };

    it('should send message to group successfully', async () => {
      mockClient.sendToGroup.mockResolvedValue(undefined);

      await webPubSubService.sendToGroup(mockGroupName, mockMessage);

      expect(mockClient.sendToGroup).toHaveBeenCalledWith(mockGroupName, mockMessage);
    });

    it('should handle different message types', async () => {
      const messages = [
        { type: 'notification', data: { message: 'test' } },
        { type: 'command', data: { command: 'start' } },
        { type: 'status', data: { status: 'online' } },
        { type: 'error', data: { error: 'test error' } },
      ];

      mockClient.sendToGroup.mockResolvedValue(undefined);

      for (const message of messages) {
        await webPubSubService.sendToGroup(mockGroupName, message);
        expect(mockClient.sendToGroup).toHaveBeenCalledWith(mockGroupName, message);
      }
    });

    it('should handle different group names', async () => {
      const groupNames = [
        'group1',
        'group2',
        'group-with-dashes',
        'group_with_underscores',
        'group.with.dots',
        'group with spaces',
      ];

      const mockMessage = { type: 'test', data: {} };
      mockClient.sendToGroup.mockResolvedValue(undefined);

      for (const groupName of groupNames) {
        await webPubSubService.sendToGroup(groupName, mockMessage);
        expect(mockClient.sendToGroup).toHaveBeenCalledWith(groupName, mockMessage);
      }
    });

    it('should handle send errors', async () => {
      const sendError = new Error('Send failed');
      mockClient.sendToGroup.mockRejectedValue(sendError);

      await expect(webPubSubService.sendToGroup(mockGroupName, mockMessage))
        .rejects.toThrow('Send failed');
    });
  });

  describe('sendToUser', () => {
    const mockUserId = 'test@example.com';
    const mockMessage = {
      type: 'notification',
      data: { message: 'test message' },
    };

    it('should send message to user successfully', async () => {
      mockClient.sendToUser.mockResolvedValue(undefined);

      await webPubSubService.sendToUser(mockUserId, mockMessage);

      expect(mockClient.sendToUser).toHaveBeenCalledWith(mockUserId, mockMessage);
    });

    it('should handle different user IDs', async () => {
      const userIds = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ];

      mockClient.sendToUser.mockResolvedValue(undefined);

      for (const userId of userIds) {
        await webPubSubService.sendToUser(userId, mockMessage);
        expect(mockClient.sendToUser).toHaveBeenCalledWith(userId, mockMessage);
      }
    });

    it('should handle different message types', async () => {
      const messages = [
        { type: 'notification', data: { message: 'test' } },
        { type: 'command', data: { command: 'start' } },
        { type: 'status', data: { status: 'online' } },
        { type: 'error', data: { error: 'test error' } },
      ];

      mockClient.sendToUser.mockResolvedValue(undefined);

      for (const message of messages) {
        await webPubSubService.sendToUser(mockUserId, message);
        expect(mockClient.sendToUser).toHaveBeenCalledWith(mockUserId, message);
      }
    });

    it('should handle send errors', async () => {
      const sendError = new Error('Send failed');
      mockClient.sendToUser.mockRejectedValue(sendError);

      await expect(webPubSubService.sendToUser(mockUserId, mockMessage))
        .rejects.toThrow('Send failed');
    });
  });

  describe('edge cases', () => {
    it('should handle very long user IDs', async () => {
      const longUserId = 'a'.repeat(1000) + '@example.com';
      const mockTokenResponse = {
        token: 'test-jwt-token',
      };

      mockClient.getClientAccessToken.mockResolvedValue(mockTokenResponse);

      const result = await webPubSubService.generateToken(longUserId, ['group']);

      expect(result).toBe('test-jwt-token');
      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        userId: longUserId.toLowerCase(),
        groups: ['group'],
      });
    });

    it('should handle special characters in user IDs', async () => {
      const specialUserId = 'user+special@example-domain.com';
      const mockTokenResponse = {
        token: 'test-jwt-token',
      };

      mockClient.getClientAccessToken.mockResolvedValue(mockTokenResponse);

      const result = await webPubSubService.generateToken(specialUserId, ['group']);

      expect(result).toBe('test-jwt-token');
      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        userId: specialUserId.toLowerCase(),
        groups: ['group'],
      });
    });

    it('should handle unicode characters in user IDs', async () => {
      const unicodeUserId = '用户@example.com';
      const mockTokenResponse = {
        token: 'test-jwt-token',
      };

      mockClient.getClientAccessToken.mockResolvedValue(mockTokenResponse);

      const result = await webPubSubService.generateToken(unicodeUserId, ['group']);

      expect(result).toBe('test-jwt-token');
      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        userId: unicodeUserId.toLowerCase(),
        groups: ['group'],
      });
    });

    it('should handle empty user IDs', async () => {
      const emptyUserId = '';
      const mockTokenResponse = {
        token: 'test-jwt-token',
      };

      mockClient.getClientAccessToken.mockResolvedValue(mockTokenResponse);

      const result = await webPubSubService.generateToken(emptyUserId, ['group']);

      expect(result).toBe('test-jwt-token');
      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        userId: '',
        groups: ['group'],
      });
    });

    it('should handle null user IDs', async () => {
      const nullUserId = null as any;
      const mockTokenResponse = {
        token: 'test-jwt-token',
      };

      mockClient.getClientAccessToken.mockResolvedValue(mockTokenResponse);

      const result = await webPubSubService.generateToken(nullUserId, ['group']);

      expect(result).toBe('test-jwt-token');
      expect(mockClient.getClientAccessToken).toHaveBeenCalledWith({
        userId: '',
        groups: ['group'],
      });
    });

    it('should handle very large messages', async () => {
      const largeMessage = {
        type: 'large-data',
        data: {
          content: 'A'.repeat(10000),
          metadata: {
            size: 'large',
            timestamp: '2025-01-15T10:30:00Z',
          },
        },
      };

      mockClient.sendToGroup.mockResolvedValue(undefined);

      await webPubSubService.sendToGroup('test-group', largeMessage);

      expect(mockClient.sendToGroup).toHaveBeenCalledWith('test-group', largeMessage);
    });

    it('should handle complex nested messages', async () => {
      const complexMessage = {
        type: 'complex-data',
        data: {
          user: {
            id: 'user-123',
            profile: {
              name: 'Test User',
              preferences: {
                notifications: true,
                theme: 'dark',
              },
            },
          },
          action: {
            type: 'update',
            timestamp: '2025-01-15T10:30:00Z',
            metadata: {
              source: 'web',
              version: '1.0.0',
            },
          },
        },
      };

      mockClient.sendToGroup.mockResolvedValue(undefined);

      await webPubSubService.sendToGroup('test-group', complexMessage);

      expect(mockClient.sendToGroup).toHaveBeenCalledWith('test-group', complexMessage);
    });
  });

  describe('validation scenarios', () => {
    it('should handle PSO presence update scenario', async () => {
      const psoUserId = 'pso@example.com';
      const presenceMessage = {
        type: 'presence-update',
        data: {
          userId: psoUserId,
          status: 'online',
          timestamp: '2025-01-15T10:30:00Z',
        },
      };

      mockClient.sendToGroup.mockResolvedValue(undefined);

      await webPubSubService.sendToGroup('presence-group', presenceMessage);

      expect(mockClient.sendToGroup).toHaveBeenCalledWith('presence-group', presenceMessage);
    });

    it('should handle supervisor notification scenario', async () => {
      const supervisorUserId = 'supervisor@example.com';
      const notificationMessage = {
        type: 'notification',
        data: {
          title: 'New Alert',
          message: 'PSO requires attention',
          priority: 'high',
          timestamp: '2025-01-15T10:30:00Z',
        },
      };

      mockClient.sendToUser.mockResolvedValue(undefined);

      await webPubSubService.sendToUser(supervisorUserId, notificationMessage);

      expect(mockClient.sendToUser).toHaveBeenCalledWith(supervisorUserId, notificationMessage);
    });

    it('should handle admin broadcast scenario', async () => {
      const broadcastMessage = {
        type: 'broadcast',
        data: {
          message: 'System maintenance scheduled',
          scheduledTime: '2025-01-15T22:00:00Z',
          duration: '2 hours',
        },
      };

      mockClient.sendToGroup.mockResolvedValue(undefined);

      await webPubSubService.sendToGroup('all-users', broadcastMessage);

      expect(mockClient.sendToGroup).toHaveBeenCalledWith('all-users', broadcastMessage);
    });

    it('should handle command messaging scenario', async () => {
      const commandMessage = {
        type: 'command',
        data: {
          command: 'START',
          target: 'pso@example.com',
          timestamp: '2025-01-15T10:30:00Z',
        },
      };

      mockClient.sendToGroup.mockResolvedValue(undefined);

      await webPubSubService.sendToGroup('command-group', commandMessage);

      expect(mockClient.sendToGroup).toHaveBeenCalledWith('command-group', commandMessage);
    });

    it('should handle user subscription scenario', async () => {
      const userId = 'user@example.com';
      const groupName = 'notifications';

      mockClient.addUserToGroup.mockResolvedValue(undefined);

      await webPubSubService.subscribeToGroup(userId, groupName);

      expect(mockClient.addUserToGroup).toHaveBeenCalledWith(groupName, userId);
    });

    it('should handle user unsubscription scenario', async () => {
      const userId = 'user@example.com';
      const groupName = 'notifications';

      mockClient.removeUserFromGroup.mockResolvedValue(undefined);

      await webPubSubService.unsubscribeFromGroup(userId, groupName);

      expect(mockClient.removeUserFromGroup).toHaveBeenCalledWith(groupName, userId);
    });

    it('should handle bulk operations scenario', async () => {
      const operations = [
        { type: 'subscribe', userId: 'user1@example.com', groupName: 'group1' },
        { type: 'subscribe', userId: 'user2@example.com', groupName: 'group1' },
        { type: 'unsubscribe', userId: 'user3@example.com', groupName: 'group2' },
        { type: 'send', groupName: 'group1', message: { type: 'test', data: {} } },
      ];

      mockClient.addUserToGroup.mockResolvedValue(undefined);
      mockClient.removeUserFromGroup.mockResolvedValue(undefined);
      mockClient.sendToGroup.mockResolvedValue(undefined);

      for (const operation of operations) {
        if (operation.type === 'subscribe') {
          await webPubSubService.subscribeToGroup(operation.userId!, operation.groupName);
        } else if (operation.type === 'unsubscribe') {
          await webPubSubService.unsubscribeFromGroup(operation.userId!, operation.groupName);
        } else if (operation.type === 'send') {
          await webPubSubService.sendToGroup(operation.groupName, operation.message!);
        }
      }

      expect(mockClient.addUserToGroup).toHaveBeenCalledTimes(2);
      expect(mockClient.removeUserFromGroup).toHaveBeenCalledTimes(1);
      expect(mockClient.sendToGroup).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent operations scenario', async () => {
      const mockTokenResponse = {
        token: 'test-jwt-token',
      };

      mockClient.getClientAccessToken.mockResolvedValue(mockTokenResponse);
      mockClient.sendToGroup.mockResolvedValue(undefined);
      mockClient.addUserToGroup.mockResolvedValue(undefined);

      const promises = [
        webPubSubService.generateToken('user@example.com', ['group']),
        webPubSubService.sendToGroup('group', { type: 'test', data: {} }),
        webPubSubService.subscribeToGroup('user@example.com', 'group'),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toBe('test-jwt-token');
      expect(results[1]).toBeUndefined();
      expect(results[2]).toBeUndefined();
    });
  });
});
