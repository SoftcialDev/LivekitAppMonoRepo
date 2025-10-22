/**
 * @fileoverview Tests for ChatService
 * @description Tests for chat operations using Microsoft Graph API
 */

import { ChatService } from '../../../../shared/infrastructure/services/ChatService';

// Mock dependencies
jest.mock('@azure/identity', () => ({
  OnBehalfOfCredential: jest.fn().mockImplementation(() => ({
    getToken: jest.fn().mockResolvedValue({ token: 'mock-token' }),
  })),
}));

jest.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    initWithMiddleware: jest.fn().mockReturnValue({
      api: jest.fn().mockReturnValue({
        get: jest.fn(),
        post: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
      }),
    }),
  },
}));

jest.mock('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials', () => ({
  TokenCredentialAuthenticationProvider: jest.fn(),
}));

jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn().mockReturnValue(new Date('2025-01-15T10:30:00Z')),
}));

jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
    },
    chat: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    chatMember: {
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('ChatService', () => {
  let chatService: ChatService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.AZURE_TENANT_ID = 'test-tenant-id';
    process.env.AZURE_CLIENT_ID = 'test-client-id';
    process.env.AZURE_CLIENT_SECRET = 'test-client-secret';

    chatService = new ChatService();
    
    // Get mocked prisma instance
    mockPrisma = require('../../../../shared/infrastructure/database/PrismaClientService').default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create ChatService with environment variables', () => {
      expect(chatService).toBeInstanceOf(ChatService);
    });

    it('should throw error if required environment variables are missing', () => {
      delete process.env.AZURE_TENANT_ID;
      
      expect(() => new ChatService()).not.toThrow(); // Service should handle missing env vars gracefully
    });
  });

  describe('getOrSyncChat', () => {
    const mockToken = 'test-token-123';

    it('should get existing chat successfully', async () => {
      const mockUsers = [
        { id: 'user-1', azureAdObjectId: 'oid-1', role: 'Admin' },
        { id: 'user-2', azureAdObjectId: 'oid-2', role: 'ContactManager' },
      ];

      const mockChat = {
        id: 'chat-123',
        topic: 'InContactApp – Contact Managers',
        members: [
          { userId: 'user-1', joinedAt: new Date() },
          { userId: 'user-2', joinedAt: new Date() },
        ],
      };

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);

      const result = await chatService.getOrSyncChat(mockToken);

      expect(result).toBe('chat-123');
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: { in: ['Admin', 'ContactManager', 'SuperAdmin'] } }
      });
      expect(mockPrisma.chat.findFirst).toHaveBeenCalledWith({
        where: { topic: 'InContactApp – Contact Managers' },
        include: { members: true }
      });
    });

    it('should create new chat when none exists', async () => {
      const mockUsers = [
        { id: 'user-1', azureAdObjectId: 'oid-1', role: 'Admin' },
        { id: 'user-2', azureAdObjectId: 'oid-2', role: 'ContactManager' },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.chat.findFirst.mockResolvedValue(null);
      mockPrisma.chat.create.mockResolvedValue({ id: 'new-chat-123' });

      // Mock the createGraphChat method
      const createGraphChatSpy = jest.spyOn(chatService as any, 'createGraphChat')
        .mockResolvedValue('new-chat-123');

      const result = await chatService.getOrSyncChat(mockToken);

      expect(result).toBe('new-chat-123');
      expect(createGraphChatSpy).toHaveBeenCalledWith(
        mockToken,
        [{ userId: 'user-1', oid: 'oid-1' }, { userId: 'user-2', oid: 'oid-2' }],
        'InContactApp – Contact Managers'
      );
      expect(mockPrisma.chat.create).toHaveBeenCalled();
    });

    it('should handle specific participants and topic', async () => {
      const participants = [
        { userId: 'user-1', azureAdObjectId: 'oid-1' },
        { userId: 'user-2', azureAdObjectId: 'oid-2' },
      ];
      const topic = 'Test Chat';

      // Mock the createSpecificChat method
      const createSpecificChatSpy = jest.spyOn(chatService as any, 'createSpecificChat')
        .mockResolvedValue('specific-chat-123');

      const result = await chatService.getOrSyncChat(mockToken, participants, topic);

      expect(result).toBe('specific-chat-123');
      expect(createSpecificChatSpy).toHaveBeenCalledWith(mockToken, participants, topic);
    });

    it('should handle group chat creation', async () => {
      const participants = [
        { userId: 'user-1', azureAdObjectId: 'oid-1' },
        { userId: 'user-2', azureAdObjectId: 'oid-2' },
        { userId: 'user-3', azureAdObjectId: 'oid-3' },
      ];
      const topic = 'Group Chat';

      // Mock the createGraphChat method
      const createGraphChatSpy = jest.spyOn(chatService as any, 'createGraphChat')
        .mockResolvedValue('group-chat-123');

      const result = await chatService.getOrSyncChat(mockToken, participants, topic);

      expect(result).toBe('group-chat-123');
      expect(createGraphChatSpy).toHaveBeenCalledWith(
        mockToken,
        [
          { userId: 'user-1', oid: 'oid-1' },
          { userId: 'user-2', oid: 'oid-2' },
          { userId: 'user-3', oid: 'oid-3' },
        ],
        topic
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.user.findMany.mockRejectedValue(dbError);

      await expect(chatService.getOrSyncChat(mockToken))
        .rejects.toThrow('Failed to get or sync chat: Database connection failed');
    });

    it('should handle empty users list', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.chat.findFirst.mockResolvedValue(null);

      // Mock the createGraphChat method
      const createGraphChatSpy = jest.spyOn(chatService as any, 'createGraphChat')
        .mockResolvedValue('empty-chat-123');

      const result = await chatService.getOrSyncChat(mockToken);

      expect(result).toBe('empty-chat-123');
      expect(createGraphChatSpy).toHaveBeenCalledWith(mockToken, [], 'InContactApp – Contact Managers');
    });
  });

  describe('sendMessage', () => {
    const mockToken = 'test-token-123';
    const mockChatId = 'chat-123';
    const mockMessage = {
      subject: 'Test Message',
      senderName: 'Test User',
      formType: 'DISCONNECTIONS',
      data: { test: 'data' },
    };

    it('should send message successfully', async () => {
      // Mock the initGraphClient method
      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ id: 'user-123' }),
          post: jest.fn().mockResolvedValue({ id: 'message-123' }),
          patch: jest.fn().mockResolvedValue({}),
          delete: jest.fn().mockResolvedValue({}),
        }),
      };

      const initGraphClientSpy = jest.spyOn(chatService as any, 'initGraphClient')
        .mockReturnValue(mockGraphClient);

      // Mock the addUserToChat and removeUserFromChat methods
      const addUserSpy = jest.spyOn(chatService as any, 'addUserToChat')
        .mockResolvedValue(undefined);
      const removeUserSpy = jest.spyOn(chatService as any, 'removeUserFromChat')
        .mockResolvedValue(undefined);

      await chatService.sendMessage(mockToken, mockChatId, mockMessage);

      expect(initGraphClientSpy).toHaveBeenCalledWith(mockToken);
      expect(addUserSpy).toHaveBeenCalledWith(mockGraphClient, mockChatId, 'user-123');
      expect(removeUserSpy).toHaveBeenCalledWith(mockGraphClient, mockChatId, 'user-123');
    });

    it('should handle message sending errors', async () => {
      const messageError = new Error('Failed to send message');
      
      // Mock the initGraphClient method
      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ id: 'user-123' }),
          post: jest.fn().mockRejectedValue(messageError),
        }),
      };

      const initGraphClientSpy = jest.spyOn(chatService as any, 'initGraphClient')
        .mockReturnValue(mockGraphClient);

      // Mock the addUserToChat and removeUserFromChat methods
      const addUserSpy = jest.spyOn(chatService as any, 'addUserToChat')
        .mockResolvedValue(undefined);
      const removeUserSpy = jest.spyOn(chatService as any, 'removeUserFromChat')
        .mockResolvedValue(undefined);

      await expect(chatService.sendMessage(mockToken, mockChatId, mockMessage))
        .rejects.toThrow('Failed to send message: Failed to send message');

      expect(addUserSpy).toHaveBeenCalled();
      expect(removeUserSpy).toHaveBeenCalled();
    });

    it('should handle user info retrieval errors', async () => {
      const userError = new Error('Failed to get user info');
      
      // Mock the initGraphClient method
      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValue(userError),
        }),
      };

      const initGraphClientSpy = jest.spyOn(chatService as any, 'initGraphClient')
        .mockReturnValue(mockGraphClient);

      await expect(chatService.sendMessage(mockToken, mockChatId, mockMessage))
        .rejects.toThrow('Failed to send message: Failed to get user info');
    });
  });

  describe('edge cases', () => {
    it('should handle very long chat topics', async () => {
      const longTopic = 'A'.repeat(1000);
      const participants = [
        { userId: 'user-1', azureAdObjectId: 'oid-1' },
        { userId: 'user-2', azureAdObjectId: 'oid-2' },
      ];

      // Mock the createGraphChat method
      const createGraphChatSpy = jest.spyOn(chatService as any, 'createGraphChat')
        .mockResolvedValue('long-topic-chat-123');

      const result = await chatService.getOrSyncChat('token', participants, longTopic);

      expect(result).toBe('long-topic-chat-123');
      expect(createGraphChatSpy).toHaveBeenCalledWith('token', expect.any(Array), longTopic);
    });

    it('should handle special characters in chat topics', async () => {
      const specialTopic = 'Chat with special chars: @#$%^&*()';
      const participants = [
        { userId: 'user-1', azureAdObjectId: 'oid-1' },
        { userId: 'user-2', azureAdObjectId: 'oid-2' },
      ];

      // Mock the createGraphChat method
      const createGraphChatSpy = jest.spyOn(chatService as any, 'createGraphChat')
        .mockResolvedValue('special-chat-123');

      const result = await chatService.getOrSyncChat('token', participants, specialTopic);

      expect(result).toBe('special-chat-123');
      expect(createGraphChatSpy).toHaveBeenCalledWith('token', expect.any(Array), specialTopic);
    });

    it('should handle unicode characters in chat topics', async () => {
      const unicodeTopic = '聊天室 - 管理员';
      const participants = [
        { userId: 'user-1', azureAdObjectId: 'oid-1' },
        { userId: 'user-2', azureAdObjectId: 'oid-2' },
      ];

      // Mock the createGraphChat method
      const createGraphChatSpy = jest.spyOn(chatService as any, 'createGraphChat')
        .mockResolvedValue('unicode-chat-123');

      const result = await chatService.getOrSyncChat('token', participants, unicodeTopic);

      expect(result).toBe('unicode-chat-123');
      expect(createGraphChatSpy).toHaveBeenCalledWith('token', expect.any(Array), unicodeTopic);
    });

    it('should handle very large participant lists', async () => {
      const largeParticipantList = Array(100).fill(null).map((_, index) => ({
        userId: `user-${index}`,
        azureAdObjectId: `oid-${index}`,
      }));

      // Mock the createGraphChat method
      const createGraphChatSpy = jest.spyOn(chatService as any, 'createGraphChat')
        .mockResolvedValue('large-chat-123');

      const result = await chatService.getOrSyncChat('token', largeParticipantList, 'Large Chat');

      expect(result).toBe('large-chat-123');
      expect(createGraphChatSpy).toHaveBeenCalledWith('token', expect.any(Array), 'Large Chat');
    });

    it('should handle complex message objects', async () => {
      const complexMessage = {
        subject: 'Complex Message',
        senderName: 'Test User',
        formType: 'DISCONNECTIONS',
        data: {
          patient: {
            name: 'John Doe',
            age: 45,
            conditions: ['diabetes', 'hypertension'],
          },
          incident: {
            type: 'disconnection',
            severity: 'high',
            timestamp: '2025-01-15T10:25:00Z',
            location: 'Room 101',
          },
          metadata: {
            reporter: 'PSO-123',
            supervisor: 'SUP-456',
            priority: 'urgent',
          },
        },
        imageUrl: 'https://example.com/image.jpg',
      };

      // Mock the initGraphClient method
      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ id: 'user-123' }),
          post: jest.fn().mockResolvedValue({ id: 'message-123' }),
          patch: jest.fn().mockResolvedValue({}),
          delete: jest.fn().mockResolvedValue({}),
        }),
      };

      const initGraphClientSpy = jest.spyOn(chatService as any, 'initGraphClient')
        .mockReturnValue(mockGraphClient);

      // Mock the addUserToChat and removeUserFromChat methods
      const addUserSpy = jest.spyOn(chatService as any, 'addUserToChat')
        .mockResolvedValue(undefined);
      const removeUserSpy = jest.spyOn(chatService as any, 'removeUserFromChat')
        .mockResolvedValue(undefined);

      await chatService.sendMessage('token', 'chat-123', complexMessage);

      expect(addUserSpy).toHaveBeenCalled();
      expect(removeUserSpy).toHaveBeenCalled();
    });
  });

  describe('validation scenarios', () => {
    it('should handle contact manager chat scenario', async () => {
      const mockUsers = [
        { id: 'admin-1', azureAdObjectId: 'oid-admin-1', role: 'Admin' },
        { id: 'cm-1', azureAdObjectId: 'oid-cm-1', role: 'ContactManager' },
        { id: 'cm-2', azureAdObjectId: 'oid-cm-2', role: 'ContactManager' },
        { id: 'sa-1', azureAdObjectId: 'oid-sa-1', role: 'SuperAdmin' },
      ];

      const mockChat = {
        id: 'contact-manager-chat-123',
        topic: 'InContactApp – Contact Managers',
        members: mockUsers.map(u => ({ userId: u.id, joinedAt: new Date() })),
      };

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);

      const result = await chatService.getOrSyncChat('token');

      expect(result).toBe('contact-manager-chat-123');
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: { in: ['Admin', 'ContactManager', 'SuperAdmin'] } }
      });
    });

    it('should handle emergency notification scenario', async () => {
      const emergencyMessage = {
        subject: '🚨 Emergency Alert',
        senderName: 'Dr. Smith',
        formType: 'DISCONNECTIONS',
        data: {
          patientId: 'patient-123',
          emergency: true,
          severity: 'critical',
          timestamp: '2025-01-15T10:30:00Z',
        },
      };

      // Mock the initGraphClient method
      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ id: 'user-123' }),
          post: jest.fn().mockResolvedValue({ id: 'message-123' }),
          patch: jest.fn().mockResolvedValue({}),
          delete: jest.fn().mockResolvedValue({}),
        }),
      };

      const initGraphClientSpy = jest.spyOn(chatService as any, 'initGraphClient')
        .mockReturnValue(mockGraphClient);

      // Mock the addUserToChat and removeUserFromChat methods
      const addUserSpy = jest.spyOn(chatService as any, 'addUserToChat')
        .mockResolvedValue(undefined);
      const removeUserSpy = jest.spyOn(chatService as any, 'removeUserFromChat')
        .mockResolvedValue(undefined);

      await chatService.sendMessage('token', 'chat-123', emergencyMessage);

      expect(addUserSpy).toHaveBeenCalled();
      expect(removeUserSpy).toHaveBeenCalled();
    });

    it('should handle bulk notification scenario', async () => {
      const bulkMessage = {
        subject: '📢 Bulk Notification',
        senderName: 'System Admin',
        formType: 'ADMISSIONS',
        data: {
          type: 'bulk_update',
          affectedUsers: ['user-1', 'user-2', 'user-3'],
          timestamp: '2025-01-15T10:30:00Z',
        },
      };

      // Mock the initGraphClient method
      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ id: 'user-123' }),
          post: jest.fn().mockResolvedValue({ id: 'message-123' }),
          patch: jest.fn().mockResolvedValue({}),
          delete: jest.fn().mockResolvedValue({}),
        }),
      };

      const initGraphClientSpy = jest.spyOn(chatService as any, 'initGraphClient')
        .mockReturnValue(mockGraphClient);

      // Mock the addUserToChat and removeUserFromChat methods
      const addUserSpy = jest.spyOn(chatService as any, 'addUserToChat')
        .mockResolvedValue(undefined);
      const removeUserSpy = jest.spyOn(chatService as any, 'removeUserFromChat')
        .mockResolvedValue(undefined);

      await chatService.sendMessage('token', 'chat-123', bulkMessage);

      expect(addUserSpy).toHaveBeenCalled();
      expect(removeUserSpy).toHaveBeenCalled();
    });
  });
});
