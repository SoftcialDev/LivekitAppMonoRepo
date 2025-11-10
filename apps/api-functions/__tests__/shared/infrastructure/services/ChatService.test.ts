/**
 * @fileoverview Tests for ChatService
 * @description Tests for chat operations using Microsoft Graph API
 */

import { ChatService } from '../../../../shared/infrastructure/services/ChatService';
import { ClientSecretCredential, OnBehalfOfCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import prisma from '../../../../shared/infrastructure/database/PrismaClientService';
import { ServiceAccountManager } from '../../../../shared/infrastructure/services/ServiceAccountManager';

// Mock Azure Identity
jest.mock('@azure/identity', () => ({
  OnBehalfOfCredential: jest.fn().mockImplementation(() => ({
    getToken: jest.fn().mockResolvedValue({ token: 'mock-token' })
  })),
  ClientSecretCredential: jest.fn().mockImplementation(() => ({
    getToken: jest.fn().mockResolvedValue({ token: 'mock-app-token' })
  }))
}));

// Mock Microsoft Graph Client
jest.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    initWithMiddleware: jest.fn(),
    init: jest.fn()
  }
}));

// Mock TokenCredentialAuthenticationProvider
jest.mock('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials', () => ({
  TokenCredentialAuthenticationProvider: jest.fn()
}));

// Mock Prisma
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  user: {
    findMany: jest.fn()
  },
  chat: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  chatParticipant: {
    deleteMany: jest.fn(),
    upsert: jest.fn()
  }
}));

// Mock dateUtils
jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn().mockReturnValue(new Date('2023-01-01T10:00:00Z'))
}));

describe('ChatService', () => {
  let chatService: ChatService;
  let mockGraphClient: any;
  let mockCredential: any;
  let mockAppCredential: any;
  let mockAuthProvider: any;
  let mockServiceAccountManager: jest.Mocked<ServiceAccountManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment variables
    process.env.AZURE_TENANT_ID = 'test-tenant-id';
    process.env.AZURE_CLIENT_ID = 'test-client-id';
    process.env.AZURE_CLIENT_SECRET = 'test-client-secret';

    // Mock Graph client
    mockGraphClient = {
      api: jest.fn().mockReturnThis(),
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn()
    };

    // Mock credential
    mockCredential = {
      getToken: jest.fn().mockResolvedValue({ token: 'mock-token' })
    };
    mockAppCredential = {
      getToken: jest.fn().mockResolvedValue({ token: 'mock-app-token' })
    };

    // Mock auth provider
    mockAuthProvider = {};

    // Setup mocks
    (OnBehalfOfCredential as jest.Mock).mockImplementation(() => mockCredential);
    (ClientSecretCredential as jest.Mock).mockImplementation(() => mockAppCredential);
    (TokenCredentialAuthenticationProvider as jest.Mock).mockImplementation(() => mockAuthProvider);
    (Client.initWithMiddleware as jest.Mock).mockReturnValue(mockGraphClient);
    (Client.init as jest.Mock).mockReturnValue(mockGraphClient);

    mockServiceAccountManager = {
      ensureServiceAccount: jest.fn().mockResolvedValue({
        azureAdObjectId: 'SERVICE-OID',
        userPrincipalName: 'service.account@test.local',
        displayName: 'Service Notifications',
        password: 'P@ssword123!'
      }),
      getDelegatedToken: jest.fn().mockResolvedValue('delegated-token')
    } as any;

    chatService = new ChatService(mockServiceAccountManager);
  });

  describe('getContactManagersChatId', () => {
    it('should create chat when no record exists', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-super', azureAdObjectId: 'SUPER-OID' }
      ]);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'service-user-id',
        azureAdObjectId: 'SERVICE-OID'
      });
      (prisma.chat.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.chat.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.chat.create as jest.Mock).mockResolvedValue({ id: 'new-chat-id' });
      (prisma.chatParticipant.deleteMany as jest.Mock).mockResolvedValue(undefined);
      (prisma.chatParticipant.upsert as jest.Mock).mockResolvedValue(undefined);

      mockGraphClient.get
        .mockResolvedValueOnce({ value: [] }) // search by topic
        .mockResolvedValueOnce({ value: [] }); // fetch members
      mockGraphClient.post.mockResolvedValue({ id: 'new-chat-id' });

      const result = await chatService.getContactManagersChatId();

      expect(result).toBe('new-chat-id');
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: { in: ['SuperAdmin', 'Admin', 'ContactManager'] } }
      });
    expect(mockServiceAccountManager.ensureServiceAccount).toHaveBeenCalled();
    });

    it('should throw when there are no SuperAdmins configured', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      await expect(chatService.getContactManagersChatId()).rejects.toThrow(
        'No users with roles [SuperAdmin, Admin, ContactManager] found to compose the Contact Managers chat'
      );
    expect(mockServiceAccountManager.ensureServiceAccount).toHaveBeenCalled();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create ChatService with environment variables', () => {
      expect(chatService).toBeInstanceOf(ChatService);
    });

    it('should create ChatService even if tenant ID is missing', () => {
      const originalTenantId = process.env.AZURE_TENANT_ID;
      delete process.env.AZURE_TENANT_ID;
      
      const service = new ChatService(mockServiceAccountManager);
      expect(service).toBeInstanceOf(ChatService);
      
      // Restore original value
      process.env.AZURE_TENANT_ID = originalTenantId;
    });

    it('should create ChatService even if client ID is missing', () => {
      const originalClientId = process.env.AZURE_CLIENT_ID;
      delete process.env.AZURE_CLIENT_ID;
      
      const service = new ChatService(mockServiceAccountManager);
      expect(service).toBeInstanceOf(ChatService);
      
      // Restore original value
      process.env.AZURE_CLIENT_ID = originalClientId;
    });

    it('should create ChatService even if client secret is missing', () => {
      const originalClientSecret = process.env.AZURE_CLIENT_SECRET;
      delete process.env.AZURE_CLIENT_SECRET;
      
      const service = new ChatService(mockServiceAccountManager);
      expect(service).toBeInstanceOf(ChatService);
      
      // Restore original value
      process.env.AZURE_CLIENT_SECRET = originalClientSecret;
    });
  });

  describe('getOrSyncChat', () => {
    const mockToken = 'test-token';

    it('should delegate to getContactManagersChatId when participants are not provided', async () => {
      const spy = jest
        .spyOn(chatService, 'getContactManagersChatId')
        .mockResolvedValue('contact-chat-id');

      const result = await chatService.getOrSyncChat(mockToken);

      expect(result).toBe('contact-chat-id');
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });

    it('should create specific chat when exactly two participants provided', async () => {
      const participants = [
        { userId: 'user1', azureAdObjectId: 'oid1' },
        { userId: 'user2', azureAdObjectId: 'oid2' }
      ];
      const topic = 'Test Chat';

      const createSpecificChatSpy = jest
        .spyOn(chatService as any, 'createSpecificChat')
        .mockResolvedValue('specific-chat-id');

      const result = await (chatService as any).getOrSyncChat(mockToken, participants, topic);

      expect(result).toBe('specific-chat-id');
      expect(createSpecificChatSpy).toHaveBeenCalledWith(mockToken, participants, topic);

      createSpecificChatSpy.mockRestore();
    });

    it('should create group chat for more than two participants', async () => {
      const participants = [
        { userId: 'user1', azureAdObjectId: 'oid1' },
        { userId: 'user2', azureAdObjectId: 'oid2' },
        { userId: 'user3', azureAdObjectId: 'oid3' }
      ];
      const topic = 'Group Chat';

      const createGraphChatSpy = jest
        .spyOn(chatService as any, 'createGraphChat')
        .mockResolvedValue('group-chat-id');
      const ensureSpy = jest
        .spyOn(chatService as any, 'ensureChatRecordAndMembers')
        .mockResolvedValue(undefined);

      const result = await (chatService as any).getOrSyncChat(mockToken, participants, topic);

      expect(result).toBe('group-chat-id');
      expect(createGraphChatSpy).toHaveBeenCalled();
      expect(ensureSpy).toHaveBeenCalled();

      createGraphChatSpy.mockRestore();
      ensureSpy.mockRestore();
    });

    it('should surface errors from getContactManagersChatId', async () => {
      const spy = jest
        .spyOn(chatService, 'getContactManagersChatId')
        .mockRejectedValue(new Error('failure'));

      await expect(chatService.getOrSyncChat(mockToken))
        .rejects.toThrow('Failed to get or sync chat: failure');

      spy.mockRestore();
    });
  });

  describe('sendMessageAsServiceAccount', () => {
    const mockChatId = 'chat-456';
    const mockMessage = { subject: 'Subject', data: {} };

    beforeEach(() => {
      mockGraphClient.post.mockResolvedValue({});
    });

    it('should obtain delegated token and post message', async () => {
      await chatService.sendMessageAsServiceAccount(mockChatId, mockMessage);

      expect(mockServiceAccountManager.getDelegatedToken).toHaveBeenCalledWith([
        'https://graph.microsoft.com/Chat.ReadWrite',
        'https://graph.microsoft.com/ChatMessage.Send'
      ]);
      expect(Client.init).toHaveBeenCalled();
      expect(mockGraphClient.api).toHaveBeenCalledWith(`/chats/${mockChatId}/messages`);
    });
  });

  describe('private methods', () => {
    const mockToken = 'test-token';

    describe('initGraphClient', () => {
      it('should initialize Graph client with correct scopes', () => {
        // Access private method through any cast
        const initGraphClient = (chatService as any).initGraphClient.bind(chatService);
        
        const client = initGraphClient(mockToken);

        expect(OnBehalfOfCredential).toHaveBeenCalledWith({
          tenantId: 'test-tenant-id',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          userAssertionToken: mockToken
        });
        expect(TokenCredentialAuthenticationProvider).toHaveBeenCalledWith(
          mockCredential,
          {
            scopes: [
              'https://graph.microsoft.com/Chat.ReadWrite',
              'https://graph.microsoft.com/ChatMember.ReadWrite',
              'https://graph.microsoft.com/User.Read'
            ]
          }
        );
        expect(Client.initWithMiddleware).toHaveBeenCalledWith({ authProvider: mockAuthProvider });
        expect(client).toBe(mockGraphClient);
      });
    });

    describe('humanizeKey', () => {
      it('should humanize camelCase keys', () => {
        const humanizeKey = (chatService as any).humanizeKey.bind(chatService);
        
        expect(humanizeKey('firstName')).toBe('First Name');
        expect(humanizeKey('lastName')).toBe('Last Name');
        expect(humanizeKey('emailAddress')).toBe('Email Address');
        expect(humanizeKey('phoneNumber')).toBe('Phone Number');
      });

      it('should handle single word keys', () => {
        const humanizeKey = (chatService as any).humanizeKey.bind(chatService);
        
        expect(humanizeKey('name')).toBe('Name');
        expect(humanizeKey('email')).toBe('Email');
      });

      it('should handle empty string', () => {
        const humanizeKey = (chatService as any).humanizeKey.bind(chatService);
        
        expect(humanizeKey('')).toBe('');
      });
    });
  });

  describe('createSpecificChat', () => {
    const mockToken = 'test-token';
    const mockParticipants = [
      { userId: 'user1', azureAdObjectId: 'oid1' },
      { userId: 'user2', azureAdObjectId: 'oid2' }
    ];
    const mockTopic = 'Test Chat';

    it('should throw error for non-2 participants', async () => {
      const createSpecificChat = (chatService as any).createSpecificChat.bind(chatService);
      
      await expect(createSpecificChat(mockToken, [mockParticipants[0]], mockTopic))
        .rejects.toThrow('createSpecificChat requires exactly 2 participants');
    });

    it('should return existing chat if found', async () => {
      const existingChat = { id: 'existing-chat-id' };
      (prisma.chat.findFirst as jest.Mock).mockResolvedValue(existingChat);

      const createSpecificChat = (chatService as any).createSpecificChat.bind(chatService);
      
      const result = await createSpecificChat(mockToken, mockParticipants, mockTopic);

      expect(result).toBe('existing-chat-id');
    });

    it('should create new chat if not found', async () => {
      (prisma.chat.findFirst as jest.Mock).mockResolvedValue(null);
      
      // Mock the Graph API chain properly
      const mockApiChain = {
        select: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ userType: 'Member' }),
        post: jest.fn().mockResolvedValue({ id: 'new-chat-id' })
      };
      mockGraphClient.api.mockReturnValue(mockApiChain);
      (prisma.chat.create as jest.Mock).mockResolvedValue({ id: 'new-chat-id' });

      const createSpecificChat = (chatService as any).createSpecificChat.bind(chatService);
      
      const result = await createSpecificChat(mockToken, mockParticipants, mockTopic);

      expect(result).toBe('new-chat-id');
    });
  });

  describe('createGraphOneOnOneChat', () => {
    const mockToken = 'test-token';
    const mockParticipants = [
      { userId: 'user1', azureAdObjectId: 'oid1' },
      { userId: 'user2', azureAdObjectId: 'oid2' }
    ];
    const mockTopic = 'Test Chat';

    it('should create one-on-one chat successfully', async () => {
      // Mock the Graph API chain properly
      const mockApiChain = {
        select: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ userType: 'Member' }),
        post: jest.fn().mockResolvedValue({ id: 'one-on-one-chat-id' })
      };
      mockGraphClient.api.mockReturnValue(mockApiChain);
      (prisma.chat.create as jest.Mock).mockResolvedValue({ id: 'one-on-one-chat-id' });

      const createGraphOneOnOneChat = (chatService as any).createGraphOneOnOneChat.bind(chatService);
      
      const result = await createGraphOneOnOneChat(mockToken, mockParticipants, mockTopic);

      expect(result).toBe('one-on-one-chat-id');
      expect(mockGraphClient.api).toHaveBeenCalledWith('/chats');
      expect(prisma.chat.create).toHaveBeenCalled();
    });

    it('should handle guest users', async () => {
      // Mock the Graph API chain properly
      const mockApiChain = {
        select: jest.fn().mockReturnThis(),
        get: jest.fn()
          .mockResolvedValueOnce({ userType: 'Guest' })
          .mockResolvedValueOnce({ userType: 'Member' }),
        post: jest.fn().mockResolvedValue({ id: 'guest-chat-id' })
      };
      mockGraphClient.api.mockReturnValue(mockApiChain);
      (prisma.chat.create as jest.Mock).mockResolvedValue({ id: 'guest-chat-id' });

      const createGraphOneOnOneChat = (chatService as any).createGraphOneOnOneChat.bind(chatService);
      
      const result = await createGraphOneOnOneChat(mockToken, mockParticipants, mockTopic);

      expect(result).toBe('guest-chat-id');
    });
  });

  describe('createGraphChat', () => {
    const mockToken = 'test-token';
    const mockParticipants = [
      { userId: 'user1', oid: 'oid1' },
      { userId: 'user2', oid: 'oid2' }
    ];
    const mockTopic = 'Test Chat';

    it('should create new chat successfully', async () => {
      // Mock the Graph API chain properly
      const mockApiChain = {
        post: jest.fn().mockResolvedValue({ id: 'new-chat-id' })
      };
      mockGraphClient.api.mockReturnValue(mockApiChain);

      const createGraphChat = (chatService as any).createGraphChat.bind(chatService);
      
      const result = await createGraphChat(mockToken, mockParticipants, mockTopic);

      expect(result).toBe('new-chat-id');
    });

    it('should create new chat if not found', async () => {
      // Mock the Graph API chain properly
      const mockApiChain = {
        get: jest.fn().mockResolvedValue({ value: [] }),
        post: jest.fn().mockResolvedValue({ id: 'new-chat-id' })
      };
      mockGraphClient.api.mockReturnValue(mockApiChain);

      const createGraphChat = (chatService as any).createGraphChat.bind(chatService);
      
      const result = await createGraphChat(mockToken, mockParticipants, mockTopic);

      expect(result).toBe('new-chat-id');
    });

    it('should handle large participant lists', async () => {
      const largeParticipants = Array.from({ length: 25 }, (_, i) => ({
        userId: `user${i}`,
        oid: `oid${i}`
      }));

      // Mock the Graph API chain properly
      const mockApiChain = {
        get: jest.fn().mockResolvedValue({ value: [] }),
        post: jest.fn().mockResolvedValue({ id: 'large-chat-id' })
      };
      mockGraphClient.api.mockReturnValue(mockApiChain);

      const createGraphChat = (chatService as any).createGraphChat.bind(chatService);
      
      const result = await createGraphChat(mockToken, largeParticipants, mockTopic);

      expect(result).toBe('large-chat-id');
    });
  });

  describe('addParticipantsInBatches', () => {
    const mockToken = 'test-token';
    const mockChatId = 'test-chat-id';
    const mockParticipants = Array.from({ length: 15 }, (_, i) => ({
      userId: `user${i}`,
      oid: `oid${i}`
    }));

    it('should add participants in batches', async () => {
      mockGraphClient.post.mockResolvedValue({});

      const addParticipantsInBatches = (chatService as any).addParticipantsInBatches.bind(chatService);
      
      await addParticipantsInBatches(mockToken, mockChatId, mockParticipants);

      expect(mockGraphClient.post).toHaveBeenCalledTimes(15);
    });

    it('should handle batch errors gracefully', async () => {
      mockGraphClient.post.mockRejectedValue(new Error('Batch error'));

      const addParticipantsInBatches = (chatService as any).addParticipantsInBatches.bind(chatService);
      
      // Should not throw error
      await expect(addParticipantsInBatches(mockToken, mockChatId, mockParticipants))
        .resolves.not.toThrow();
    });
  });

  describe('syncGraphMembers', () => {
    const mockToken = 'test-token';
    const mockChatId = 'test-chat-id';
    const mockCurrentParticipants = [
      { userId: 'user1', chatId: 'chat1' },
      { userId: 'user2', chatId: 'chat2' }
    ];
    const mockDesired = [
      { userId: 'user1', oid: 'oid1' },
      { userId: 'user3', oid: 'oid3' }
    ];

    it('should sync members correctly', async () => {
      const mockMembers = {
        value: [
          { id: 'member1', user: { id: 'oid1' } },
          { id: 'member2', user: { id: 'oid2' } }
        ]
      };

      mockGraphClient.get.mockResolvedValue(mockMembers);
      mockGraphClient.post.mockResolvedValue({});
      mockGraphClient.delete.mockResolvedValue({});

      const syncGraphMembers = (chatService as any).syncGraphMembers.bind(chatService);
      
      await syncGraphMembers(mockToken, mockCurrentParticipants, mockDesired, mockChatId);

      expect(mockGraphClient.post).toHaveBeenCalled();
      expect(mockGraphClient.delete).toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      mockGraphClient.get.mockRejectedValue(new Error('Sync error'));

      const syncGraphMembers = (chatService as any).syncGraphMembers.bind(chatService);
      
      // Should throw error since the method doesn't catch errors internally
      await expect(syncGraphMembers(mockToken, mockCurrentParticipants, mockDesired, mockChatId))
        .rejects.toThrow('Sync error');
    });
  });

  describe('syncChatMembers', () => {
    const mockToken = 'test-token';
    const mockChatId = 'test-chat-id';
    const mockNewParticipants = [
      { userId: 'user1', oid: 'oid1' },
      { userId: 'user2', oid: 'oid2' }
    ];

    it('should sync chat members correctly', async () => {
      const mockCurrentMembers = {
        value: [
          { id: 'member1', userId: 'oid1' },
          { id: 'member2', userId: 'oid3' }
        ]
      };

      mockGraphClient.get.mockResolvedValue(mockCurrentMembers);
      mockGraphClient.post.mockResolvedValue({});
      mockGraphClient.delete.mockResolvedValue({});

      const syncChatMembers = (chatService as any).syncChatMembers.bind(chatService);
      
      await syncChatMembers(mockToken, mockChatId, mockNewParticipants);

      expect(mockGraphClient.post).toHaveBeenCalled();
      expect(mockGraphClient.delete).toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      mockGraphClient.get.mockRejectedValue(new Error('Sync error'));

      const syncChatMembers = (chatService as any).syncChatMembers.bind(chatService);
      
      // Should not throw error
      await expect(syncChatMembers(mockToken, mockChatId, mockNewParticipants))
        .resolves.not.toThrow();
    });
  });

  describe('removeUserFromChat', () => {
    const mockToken = 'test-token';
    const mockChatId = 'test-chat-id';
    const mockUserId = 'test-user-id';

    it('should remove user from chat successfully', async () => {
      const mockMembers = {
        value: [
          { id: 'member1', userId: mockUserId },
          { id: 'member2', userId: 'other-user' }
        ]
      };

      mockGraphClient.get.mockResolvedValue(mockMembers);
      mockGraphClient.delete.mockResolvedValue({});

      const removeUserFromChat = (chatService as any).removeUserFromChat.bind(chatService);
      
      await removeUserFromChat(mockToken, mockChatId, mockUserId);

      expect(mockGraphClient.api).toHaveBeenCalledWith(`/chats/${mockChatId}/members`);
      expect(mockGraphClient.api).toHaveBeenCalledWith(`/chats/${mockChatId}/members/member1`);
      expect(mockGraphClient.delete).toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      const mockMembers = {
        value: [
          { id: 'member1', userId: 'other-user' }
        ]
      };

      mockGraphClient.get.mockResolvedValue(mockMembers);

      const removeUserFromChat = (chatService as any).removeUserFromChat.bind(chatService);
      
      // Should not throw error
      await expect(removeUserFromChat(mockToken, mockChatId, mockUserId))
        .resolves.not.toThrow();
    });

    it('should handle removal errors gracefully', async () => {
      mockGraphClient.get.mockRejectedValue(new Error('Removal error'));

      const removeUserFromChat = (chatService as any).removeUserFromChat.bind(chatService);
      
      // Should not throw error
      await expect(removeUserFromChat(mockToken, mockChatId, mockUserId))
        .resolves.not.toThrow();
    });
  });

  describe('sendMessageToChat', () => {
      const mockGraphClient = {
        api: jest.fn().mockReturnThis(),
      post: jest.fn()
    };
    const mockChatId = 'test-chat-id';
    const mockMessage = {
      subject: 'Test Subject',
      senderName: 'Test Sender',
      formType: 'Test Form',
      data: { field1: 'value1', field2: 'value2' },
      imageUrl: 'https://example.com/image.jpg'
    };

    it('should send message with adaptive card', async () => {
      mockGraphClient.post.mockResolvedValue({});

      const sendMessageToChat = (chatService as any).sendMessageToChat.bind(chatService);
      
      await sendMessageToChat(mockGraphClient, mockChatId, mockMessage);

      expect(mockGraphClient.api).toHaveBeenCalledWith(`/chats/${mockChatId}/messages`);
      expect(mockGraphClient.post).toHaveBeenCalled();
    });

    it('should handle message sending errors', async () => {
      mockGraphClient.post.mockRejectedValue(new Error('Send error'));

      const sendMessageToChat = (chatService as any).sendMessageToChat.bind(chatService);
      
      await expect(sendMessageToChat(mockGraphClient, mockChatId, mockMessage))
        .rejects.toThrow('Failed to send message: Send error');
    });

    it('should handle message without image', async () => {
      const messageWithoutImage = { ...mockMessage };
      (messageWithoutImage as any).imageUrl = undefined;

      mockGraphClient.post.mockResolvedValue({});

      const sendMessageToChat = (chatService as any).sendMessageToChat.bind(chatService);
      
      await sendMessageToChat(mockGraphClient, mockChatId, messageWithoutImage);

      expect(mockGraphClient.post).toHaveBeenCalled();
    });
  });
});