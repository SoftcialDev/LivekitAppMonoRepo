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
    initWithMiddleware: jest.fn(),
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

  const mockToken = 'mock-token';
  const mockChatId = 'mock-chat-id';
  const mockCurrentUser = { id: 'current-user-id', displayName: 'Current User', userPrincipalName: 'current@example.com' };

  beforeAll(() => {
    process.env.AZURE_TENANT_ID = 'mock-tenant-id';
    process.env.AZURE_CLIENT_ID = 'mock-client-id';
    process.env.AZURE_CLIENT_SECRET = 'mock-client-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    const mockGraphClient = {
      api: jest.fn().mockReturnThis(),
      post: jest.fn(),
      get: jest.fn(),
      patch: jest.fn(),
    };
    (require('@microsoft/microsoft-graph-client').Client.initWithMiddleware as jest.Mock).mockReturnValue(mockGraphClient);

    chatService = new ChatService();
    
    // Get mocked prisma instance
    mockPrisma = require('../../../../shared/infrastructure/database/PrismaClientService').default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrSyncChat', () => {
    it('should create a new chat if no record exists for Contact Managers', async () => {
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user1', azureAdObjectId: 'oid1', role: 'Admin' },
        { id: 'user2', azureAdObjectId: 'oid2', role: 'ContactManager' },
      ]);
      (mockPrisma.chat.findFirst as jest.Mock).mockResolvedValue(null);
      
      const mockGraphClient = {
        api: jest.fn().mockReturnThis(),
        post: jest.fn().mockResolvedValue({ id: mockChatId }),
      };
      (require('@microsoft/microsoft-graph-client').Client.initWithMiddleware as jest.Mock).mockReturnValue(mockGraphClient);

      const result = await chatService.getOrSyncChat(mockToken);

      expect(result).toBe(mockChatId);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: { in: ['Admin', 'ContactManager', 'SuperAdmin'] } },
      });
      expect(mockPrisma.chat.findFirst).toHaveBeenCalledWith({
        where: { topic: 'InContactApp – Contact Managers' },
        include: { members: true },
      });
      expect(mockGraphClient.api).toHaveBeenCalledWith('/chats');
      expect(mockGraphClient.post).toHaveBeenCalledWith(expect.objectContaining({
        chatType: 'group',
        topic: 'InContactApp – Contact Managers',
        members: expect.arrayContaining([
          expect.objectContaining({ '@odata.type': '#microsoft.graph.aadUserConversationMember', 'roles': ['owner'], 'user@odata.bind': 'https://graph.microsoft.com/v1.0/users(\'oid1\')' }),
          expect.objectContaining({ '@odata.type': '#microsoft.graph.aadUserConversationMember', 'roles': ['owner'], 'user@odata.bind': 'https://graph.microsoft.com/v1.0/users(\'oid2\')' }),
        ]),
      }));
      expect(mockPrisma.chat.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          id: mockChatId,
          topic: 'InContactApp – Contact Managers',
        }),
      }));
    });

    it('should return existing chat ID if record exists for Contact Managers', async () => {
      (mockPrisma.chat.findFirst as jest.Mock).mockResolvedValue({ id: mockChatId, topic: 'InContactApp – Contact Managers', members: [] });

      const result = await chatService.getOrSyncChat(mockToken);

      expect(result).toBe(mockChatId);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: { in: ['Admin', 'ContactManager', 'SuperAdmin'] } },
      });
      expect(mockPrisma.chat.create).not.toHaveBeenCalled(); // Should not create new chat record
    });

    it('should throw an error if chat creation fails', async () => {
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.chat.findFirst as jest.Mock).mockResolvedValue(null);
      
      const mockGraphClient = {
        api: jest.fn().mockReturnThis(),
        post: jest.fn().mockRejectedValue(new Error('Graph API error')),
      };
      (require('@microsoft/microsoft-graph-client').Client.initWithMiddleware as jest.Mock).mockReturnValue(mockGraphClient);

      await expect(chatService.getOrSyncChat(mockToken)).rejects.toThrow('Failed to get or sync chat: Graph API error');
    });
  });

  describe('sendMessage', () => {
    const mockMessage = { subject: 'Test', senderName: 'Sender', formType: 'DISCONNECTIONS', data: {} };

    it('should send a message to the chat', async () => {
      const mockGraphClient = {
        api: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockCurrentUser), // For /me endpoint
        post: jest.fn().mockResolvedValue({}), // For adding member and sending message
      };
      (require('@microsoft/microsoft-graph-client').Client.initWithMiddleware as jest.Mock).mockReturnValue(mockGraphClient);

      await chatService.sendMessage(mockToken, mockChatId, mockMessage);

      expect(mockGraphClient.api).toHaveBeenCalledWith('/me');
      expect(mockGraphClient.get).toHaveBeenCalledTimes(2); // Once for /me, once for /chats/{chatId}/members
      expect(mockGraphClient.api).toHaveBeenCalledWith(`/chats/${mockChatId}/members`);
      expect(mockGraphClient.post).toHaveBeenCalledWith(expect.objectContaining({
        '@odata.type': '#microsoft.graph.aadUserConversationMember',
        'roles': ['owner'],
        'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${mockCurrentUser.id}')`,
      }));
      expect(mockGraphClient.api).toHaveBeenCalledWith(`/chats/${mockChatId}/messages`);
      expect(mockGraphClient.post).toHaveBeenCalledWith(expect.objectContaining({
        body: {
          contentType: 'html',
          content: expect.stringContaining('<attachment id="card-'),
        },
        attachments: expect.arrayContaining([
          expect.objectContaining({
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: expect.stringContaining('AdaptiveCard'),
          }),
        ]),
      }));
    });

    it('should throw an error if sending message fails', async () => {
      const mockGraphClient = {
        api: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockCurrentUser),
        post: jest.fn().mockRejectedValue(new Error('Message send error')),
      };
      (require('@microsoft/microsoft-graph-client').Client.initWithMiddleware as jest.Mock).mockReturnValue(mockGraphClient);

      await expect(chatService.sendMessage(mockToken, mockChatId, mockMessage)).rejects.toThrow('Failed to send message: Message send error');
    });

    it('should handle message with image URL', async () => {
      const messageWithImage = { ...mockMessage, imageUrl: 'http://example.com/image.jpg' };
      const mockGraphClient = {
        api: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockCurrentUser),
        post: jest.fn().mockResolvedValue({}),
      };
      (require('@microsoft/microsoft-graph-client').Client.initWithMiddleware as jest.Mock).mockReturnValue(mockGraphClient);

      await chatService.sendMessage(mockToken, mockChatId, messageWithImage);

      expect(mockGraphClient.api).toHaveBeenCalledWith(`/chats/${mockChatId}/messages`);
      expect(mockGraphClient.post).toHaveBeenCalledWith(expect.objectContaining({
        body: {
          contentType: 'html',
          content: expect.stringContaining('<attachment id="card-'),
        },
        attachments: expect.arrayContaining([
          expect.objectContaining({
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: expect.stringContaining(messageWithImage.imageUrl),
          }),
        ]),
      }));
    });
  });
});
