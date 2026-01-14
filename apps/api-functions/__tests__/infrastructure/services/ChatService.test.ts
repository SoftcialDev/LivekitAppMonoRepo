import { ChatService } from '../../../src/infrastructure/services/ChatService';
import { ChatNoParticipantsError, ChatInvalidParticipantsError } from '../../../src/domain/errors/InfrastructureErrors';
import { UserRole } from '../../../src/domain/enums/UserRole';
import prisma from '../../../src/infrastructure/database/PrismaClientService';
import { config } from '../../../src/config';
import { createMockPrismaClient } from '../../shared/mocks';
import { Client } from '@microsoft/microsoft-graph-client';

jest.mock('../../../src/infrastructure/database/PrismaClientService');
jest.mock('../../../src/config', () => ({
  config: {
    azureTenantId: 'tenant-id',
    azureClientId: 'client-id',
    azureClientSecret: 'client-secret',
  },
}));

jest.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    initWithMiddleware: jest.fn(),
  },
}));

jest.mock('@azure/identity', () => ({
  ClientSecretCredential: jest.fn(),
  OnBehalfOfCredential: jest.fn(),
}));

jest.mock('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials', () => ({
  TokenCredentialAuthenticationProvider: jest.fn(),
}));

const mockPrismaClient = createMockPrismaClient();
(prisma as any) = mockPrismaClient;

// Ensure chat methods are available
if (!mockPrismaClient.chat) {
  mockPrismaClient.chat = {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  };
}

// Ensure chatParticipant methods are available
if (!mockPrismaClient.chatParticipant) {
  mockPrismaClient.chatParticipant = {
    deleteMany: jest.fn(),
    upsert: jest.fn(),
  };
}

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChatService();
  });

  describe('getOrSyncChat', () => {
    it('should return contact managers chat when participants and topic are not provided', async () => {
      const token = 'test-token';
      const chatId = 'chat-123';

      (mockPrismaClient.chat.findFirst as jest.Mock).mockResolvedValue({
        id: chatId,
        topic: 'InContactApp – Contact Managers',
      });

      // Mock the internal methods
      const getContactManagersChatIdSpy = jest.spyOn(service, 'getContactManagersChatId' as any);
      getContactManagersChatIdSpy.mockResolvedValue(chatId);

      const result = await service.getOrSyncChat(token);

      expect(result).toBe(chatId);
    });

    it('should create specific chat when participants length is 2', async () => {
      const token = 'test-token';
      const participants = [
        { userId: 'user-1', azureAdObjectId: 'azure-1' },
        { userId: 'user-2', azureAdObjectId: 'azure-2' },
      ];
      const topic = 'Test Topic';
      const chatId = 'chat-123';

      const createSpecificChatSpy = jest.spyOn(service, 'createSpecificChat' as any);
      createSpecificChatSpy.mockResolvedValue(chatId);

      const result = await (service as any).getOrSyncChat(token, participants, topic);

      expect(createSpecificChatSpy).toHaveBeenCalledWith(token, participants, topic);
      expect(result).toBe(chatId);
    });

    it('should create graph chat when participants length is not 2', async () => {
      const token = 'test-token';
      const participants = [
        { userId: 'user-1', azureAdObjectId: 'azure-1' },
        { userId: 'user-2', azureAdObjectId: 'azure-2' },
        { userId: 'user-3', azureAdObjectId: 'azure-3' },
      ];
      const topic = 'Test Topic';
      const chatId = 'chat-123';

      const createGraphChatSpy = jest.spyOn(service, 'createGraphChat' as any);
      createGraphChatSpy.mockResolvedValue(chatId);
      const ensureChatRecordAndMembersSpy = jest.spyOn(service, 'ensureChatRecordAndMembers' as any);
      ensureChatRecordAndMembersSpy.mockResolvedValue(undefined);

      const result = await (service as any).getOrSyncChat(token, participants, topic);

      expect(createGraphChatSpy).toHaveBeenCalled();
      expect(ensureChatRecordAndMembersSpy).toHaveBeenCalled();
      expect(result).toBe(chatId);
    });
  });

  describe('getContactManagersChatId', () => {
    it('should return contact managers chat ID', async () => {
      const chatId = 'chat-123';

      const ensureManagedChatSpy = jest.spyOn(service, 'ensureManagedChat' as any);
      ensureManagedChatSpy.mockResolvedValue(chatId);

      const result = await service.getContactManagersChatId();

      expect(ensureManagedChatSpy).toHaveBeenCalled();
      expect(result).toBe(chatId);
    });
  });

  describe('getSnapshotReportsChatId', () => {
    it('should return snapshot reports chat ID', async () => {
      const chatId = 'chat-456';

      const ensureManagedChatSpy = jest.spyOn(service, 'ensureManagedChat' as any);
      ensureManagedChatSpy.mockResolvedValue(chatId);

      const result = await service.getSnapshotReportsChatId();

      expect(ensureManagedChatSpy).toHaveBeenCalled();
      expect(result).toBe(chatId);
    });
  });

  describe('ensureManagedChat', () => {
    it('should throw ChatNoParticipantsError when no participants are resolved', async () => {
      const chatTopic = 'Test Topic';
      const context = 'Test Context';
      const participantsFactory = jest.fn().mockResolvedValue([]);

      await expect(
        (service as any).ensureManagedChat(chatTopic, context, participantsFactory)
      ).rejects.toThrow(ChatNoParticipantsError);
      await expect(
        (service as any).ensureManagedChat(chatTopic, context, participantsFactory)
      ).rejects.toThrow('No participants resolved');
    });

    it('should sync existing chat when record is found', async () => {
      const chatTopic = 'Test Topic';
      const context = 'Test Context';
      const participants = [
        { userId: 'user-1', oid: 'azure-1' },
      ];
      const chatId = 'chat-123';

      (mockPrismaClient.chat.findFirst as jest.Mock).mockResolvedValue({
        id: chatId,
        topic: chatTopic,
      });

      const participantsFactory = jest.fn().mockResolvedValue(participants);
      const syncChatMembersWithClientSpy = jest.spyOn(service, 'syncChatMembersWithClient' as any);
      syncChatMembersWithClientSpy.mockResolvedValue(undefined);
      const ensureChatRecordAndMembersSpy = jest.spyOn(service, 'ensureChatRecordAndMembers' as any);
      ensureChatRecordAndMembersSpy.mockResolvedValue(undefined);

      const initGraphClientAsAppSpy = jest.spyOn(service, 'initGraphClientAsApp' as any);
      initGraphClientAsAppSpy.mockReturnValue({});

      const result = await (service as any).ensureManagedChat(chatTopic, context, participantsFactory);

      expect(result).toBe(chatId);
      expect(syncChatMembersWithClientSpy).toHaveBeenCalled();
    });

    it('should create new chat when record is not found', async () => {
      const chatTopic = 'Test Topic';
      const context = 'Test Context';
      const participants = [
        { userId: 'user-1', oid: 'azure-1' },
      ];
      const chatId = 'chat-123';

      (mockPrismaClient.chat.findFirst as jest.Mock).mockResolvedValue(null);

      const participantsFactory = jest.fn().mockResolvedValue(participants);
      const createGraphChatWithClientSpy = jest.spyOn(service, 'createGraphChatWithClient' as any);
      createGraphChatWithClientSpy.mockResolvedValue(chatId);
      const ensureChatRecordAndMembersSpy = jest.spyOn(service, 'ensureChatRecordAndMembers' as any);
      ensureChatRecordAndMembersSpy.mockResolvedValue(undefined);

      const initGraphClientAsAppSpy = jest.spyOn(service, 'initGraphClientAsApp' as any);
      initGraphClientAsAppSpy.mockReturnValue({});

      const result = await (service as any).ensureManagedChat(chatTopic, context, participantsFactory);

      expect(result).toBe(chatId);
      expect(createGraphChatWithClientSpy).toHaveBeenCalled();
    });
  });

  describe('getOrSyncChat error handling', () => {
    it('should throw wrapped error when getOrSyncChat fails', async () => {
      const token = 'test-token';
      const participants = [
        { userId: 'user-1', azureAdObjectId: 'azure-1' },
        { userId: 'user-2', azureAdObjectId: 'azure-2' },
        { userId: 'user-3', azureAdObjectId: 'azure-3' },
      ];
      const topic = 'Test Topic';

      const createGraphChatSpy = jest.spyOn(service, 'createGraphChat' as any);
      createGraphChatSpy.mockRejectedValue(new Error('Graph API error'));

      await expect((service as any).getOrSyncChat(token, participants, topic)).rejects.toThrow();
    });
  });

  describe('buildParticipantsForRoles', () => {
    it('should build participants from users with roles', async () => {
      const context = 'Test Context';
      const roles = [UserRole.SuperAdmin, UserRole.Admin];

      (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-1', azureAdObjectId: 'AZURE-1' },
        { id: 'user-2', azureAdObjectId: 'azure-2' },
      ]);

      const result = await (service as any).buildParticipantsForRoles(context, roles);

      expect(result).toEqual([
        { userId: 'user-1', oid: 'azure-1' },
        { userId: 'user-2', oid: 'azure-2' },
      ]);
    });

    it('should throw ChatNoParticipantsError when no users found', async () => {
      const context = 'Test Context';
      const roles = [UserRole.SuperAdmin];

      (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        (service as any).buildParticipantsForRoles(context, roles)
      ).rejects.toThrow(ChatNoParticipantsError);
    });

    it('should filter out users without azureAdObjectId', async () => {
      const context = 'Test Context';
      const roles = [UserRole.SuperAdmin];

      (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-1', azureAdObjectId: 'azure-1' },
        { id: 'user-2', azureAdObjectId: null },
        { id: 'user-3', azureAdObjectId: undefined },
      ]);

      const result = await (service as any).buildParticipantsForRoles(context, roles);

      expect(result).toEqual([
        { userId: 'user-1', oid: 'azure-1' },
      ]);
    });
  });

  describe('getContactManagersChatId', () => {
    it('should call buildParticipantsForRoles with correct roles', async () => {
      const chatId = 'chat-123';
      const participants = [
        { userId: 'user-1', oid: 'azure-1' },
      ];

      (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-1', azureAdObjectId: 'azure-1' },
      ]);

      const ensureManagedChatSpy = jest.spyOn(service, 'ensureManagedChat' as any);
      ensureManagedChatSpy.mockResolvedValue(chatId);

      const result = await service.getContactManagersChatId();

      expect(ensureManagedChatSpy).toHaveBeenCalledWith(
        'InContactApp – Contact Managers',
        'Contact Managers',
        expect.any(Function)
      );
      expect(result).toBe(chatId);
    });
  });

  describe('getSnapshotReportsChatId', () => {
    it('should call buildParticipantsForRoles with correct roles', async () => {
      const chatId = 'chat-456';
      const participants = [
        { userId: 'user-1', oid: 'azure-1' },
      ];

      (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-1', azureAdObjectId: 'azure-1' },
      ]);

      const ensureManagedChatSpy = jest.spyOn(service, 'ensureManagedChat' as any);
      ensureManagedChatSpy.mockResolvedValue(chatId);

      const result = await service.getSnapshotReportsChatId();

      expect(ensureManagedChatSpy).toHaveBeenCalledWith(
        'InContactApp – Snapshot Reports',
        'Snapshot Reports',
        expect.any(Function)
      );
      expect(result).toBe(chatId);
    });
  });

  describe('sendMessageAsApp', () => {
    it('should send message using app credentials', async () => {
      const chatId = 'chat-123';
      const message = { type: 'test', subject: 'Test Subject' };
      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          post: jest.fn().mockResolvedValue(undefined),
        }),
      };

      const initGraphClientAsAppSpy = jest.spyOn(service, 'initGraphClientAsApp' as any);
      initGraphClientAsAppSpy.mockReturnValue(mockGraphClient);

      await service.sendMessageAsApp(chatId, message);

      expect(initGraphClientAsAppSpy).toHaveBeenCalled();
      expect(mockGraphClient.api).toHaveBeenCalledWith(`/chats/${chatId}/messages`);
    });
  });

  describe('sendMessageToChat', () => {
    it('should send adaptive card message', async () => {
      const chatId = 'chat-123';
      const message = {
        type: 'snapshotReport',
        subject: 'Test Subject',
        psoName: 'Test PSO',
        psoEmail: 'pso@test.com',
        capturedAt: '2023-01-01',
        capturedBy: 'User',
        reason: 'Test Reason',
        imageUrl: 'https://example.com/image.jpg',
      };
      const mockPost = jest.fn().mockResolvedValue(undefined);
      const mockApi = jest.fn().mockReturnValue({ post: mockPost });
      const mockGraphClient = { api: mockApi };

      await (service as any).sendMessageToChat(mockGraphClient, chatId, message);

      expect(mockApi).toHaveBeenCalledWith(`/chats/${chatId}/messages`);
      expect(mockPost).toHaveBeenCalled();
      const payload = mockPost.mock.calls[0][0];
      expect(payload.body.contentType).toBe('html');
      expect(payload.attachments).toHaveLength(1);
      expect(payload.attachments[0].contentType).toBe('application/vnd.microsoft.card.adaptive');
    });

    it('should handle message without subject', async () => {
      const chatId = 'chat-123';
      const message = { type: 'contactManagerForm', senderName: 'Test User' };
      const mockPost = jest.fn().mockResolvedValue(undefined);
      const mockApi = jest.fn().mockReturnValue({ post: mockPost });
      const mockGraphClient = { api: mockApi };

      await (service as any).sendMessageToChat(mockGraphClient, chatId, message);

      expect(mockPost).toHaveBeenCalled();
    });

    it('should throw error when sending message fails', async () => {
      const chatId = 'chat-123';
      const message = { type: 'test' };
      const error = new Error('Graph API error');
      const mockPost = jest.fn().mockRejectedValue(error);
      const mockApi = jest.fn().mockReturnValue({ post: mockPost });
      const mockGraphClient = { api: mockApi };

      await expect(
        (service as any).sendMessageToChat(mockGraphClient, chatId, message)
      ).rejects.toThrow();
    });
  });

  describe('buildAdaptiveCardBody', () => {
    it('should build card body for snapshot report', () => {
      const message = {
        type: 'snapshotReport',
        psoName: 'Test PSO',
        psoEmail: 'pso@test.com',
        capturedAt: '2023-01-01',
        capturedBy: 'User',
        reason: 'Test Reason',
        imageUrl: 'https://example.com/image.jpg',
      };
      const subjectText = 'Test Subject';

      const result = (service as any).buildAdaptiveCardBody(message, subjectText);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].text).toBe(subjectText);
    });

    it('should build card body for contact manager form', () => {
      const message = {
        type: 'contactManagerForm',
        senderName: 'Test User',
        senderEmail: 'user@test.com',
        formType: 'DISCONNECTIONS',
        data: { field1: 'value1', field2: 'value2' },
        imageUrl: 'https://example.com/image.jpg',
      };
      const subjectText = 'Test Subject';

      const result = (service as any).buildAdaptiveCardBody(message, subjectText);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle psoName as string', () => {
      const message = {
        type: 'snapshotReport',
        psoName: 'Test PSO',
      };
      const subjectText = 'Test Subject';

      const result = (service as any).buildAdaptiveCardBody(message, subjectText);

      expect(result).toBeInstanceOf(Array);
    });

    it('should handle psoName as null', () => {
      const message = {
        type: 'snapshotReport',
        psoName: null,
      };
      const subjectText = 'Test Subject';

      const result = (service as any).buildAdaptiveCardBody(message, subjectText);

      expect(result).toBeInstanceOf(Array);
    });

    it('should handle psoName as number', () => {
      const message = {
        type: 'snapshotReport',
        psoName: 123,
      };
      const subjectText = 'Test Subject';

      const result = (service as any).buildAdaptiveCardBody(message, subjectText);

      expect(result).toBeInstanceOf(Array);
    });

    it('should handle psoName as object', () => {
      const message = {
        type: 'snapshotReport',
        psoName: { name: 'Test' },
      };
      const subjectText = 'Test Subject';

      const result = (service as any).buildAdaptiveCardBody(message, subjectText);

      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('buildSnapshotReportCardBody', () => {
    it('should build snapshot report card body with all fields', () => {
      const message = {
        psoEmail: 'pso@test.com',
        capturedAt: '2023-01-01',
        capturedBy: 'User',
        reason: 'Test Reason',
        imageUrl: 'https://example.com/image.jpg',
      };

      const result = (service as any).buildSnapshotReportCardBody(message);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should build snapshot report card body without imageUrl', () => {
      const message = {
        psoEmail: 'pso@test.com',
        capturedAt: '2023-01-01',
      };

      const result = (service as any).buildSnapshotReportCardBody(message);

      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('buildFormReportCardBody', () => {
    it('should build form report card body with all fields', () => {
      const message = {
        senderEmail: 'user@test.com',
        formType: 'DISCONNECTIONS',
        data: { field1: 'value1', field2: 'value2' },
        imageUrl: 'https://example.com/image.jpg',
      };

      const result = (service as any).buildFormReportCardBody(message);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should build form report card body without data', () => {
      const message = {
        senderEmail: 'user@test.com',
        formType: 'ADMISSIONS',
      };

      const result = (service as any).buildFormReportCardBody(message);

      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('createImageCardElement', () => {
    it('should create image card element', () => {
      const imageUrl = 'https://example.com/image.jpg';

      const result = (service as any).createImageCardElement(imageUrl);

      expect(result).toEqual({
        type: 'Image',
        url: imageUrl,
        size: 'Large',
        style: 'Default',
        width: '100%',
        height: 'auto',
        selectAction: {
          type: 'Action.OpenUrl',
          url: imageUrl,
        },
      });
    });
  });

  describe('valueToString', () => {
    it('should convert string to string', () => {
      const result = (service as any).valueToString('test');
      expect(result).toBe('test');
    });

    it('should convert object to JSON string', () => {
      const obj = { key: 'value' };
      const result = (service as any).valueToString(obj);
      expect(result).toBe(JSON.stringify(obj));
    });

    it('should convert number to string', () => {
      const result = (service as any).valueToString(123);
      expect(result).toBe('123');
    });

    it('should convert null to string', () => {
      const result = (service as any).valueToString(null);
      expect(result).toBe('null');
    });
  });

  describe('createTextBlock', () => {
    it('should create text block with value', () => {
      const result = (service as any).createTextBlock('Label', 'Value');
      expect(result).toEqual({
        type: 'TextBlock',
        text: '**Label:** Value',
        wrap: true,
      });
    });

    it('should return null for falsy value', () => {
      const result = (service as any).createTextBlock('Label', null);
      expect(result).toBeNull();
    });
  });

  describe('humanizeKey', () => {
    it('should humanize camelCase key', () => {
      const result = (service as any).humanizeKey('camelCaseKey');
      expect(result).toBe('Camel Case Key');
    });

    it('should humanize snake_case key', () => {
      const result = (service as any).humanizeKey('snake_case_key');
      expect(result).toBe('Snake_case_key');
    });
  });

  describe('humanizeFormType', () => {
    it('should humanize DISCONNECTIONS', () => {
      const result = (service as any).humanizeFormType('DISCONNECTIONS');
      expect(result).toBe('Disconnections');
    });

    it('should humanize ADMISSIONS', () => {
      const result = (service as any).humanizeFormType('ADMISSIONS');
      expect(result).toBe('Admissions');
    });

    it('should humanize ASSISTANCE', () => {
      const result = (service as any).humanizeFormType('ASSISTANCE');
      expect(result).toBe('Acute Assessment');
    });

    it('should humanize unknown form type', () => {
      const result = (service as any).humanizeFormType('UNKNOWN_TYPE');
      expect(result).toBe('Unknown Type');
    });

    it('should return Unknown for undefined', () => {
      const result = (service as any).humanizeFormType(undefined);
      expect(result).toBe('Unknown');
    });
  });

  describe('createGraphChat', () => {
    it('should create graph chat with token', async () => {
      const token = 'test-token';
      const participants = [
        { userId: 'user-1', oid: 'azure-1' },
      ];
      const topic = 'Test Topic';
      const chatId = 'chat-123';

      const initGraphClientSpy = jest.spyOn(service, 'initGraphClient' as any);
      const mockGraphClient = {};
      initGraphClientSpy.mockReturnValue(mockGraphClient);

      const createGraphChatWithClientSpy = jest.spyOn(service, 'createGraphChatWithClient' as any);
      createGraphChatWithClientSpy.mockResolvedValue(chatId);

      const result = await (service as any).createGraphChat(token, participants, topic);

      expect(initGraphClientSpy).toHaveBeenCalledWith(token);
      expect(createGraphChatWithClientSpy).toHaveBeenCalledWith(mockGraphClient, participants, topic);
      expect(result).toBe(chatId);
    });
  });

  describe('createGraphChatWithClient', () => {
    it('should create new chat when no existing chat found', async () => {
      const participants = [
        { userId: 'user-1', oid: 'azure-1' },
      ];
      const topic = 'Test Topic';
      const chatId = 'chat-123';

      const mockPost = jest.fn().mockResolvedValue({ id: chatId });
      const mockFilter = jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ value: [] }) });
      const mockApi = jest.fn().mockReturnValue({ filter: mockFilter, post: mockPost });
      const mockGraphClient = { api: mockApi };

      const syncChatMembersWithClientSpy = jest.spyOn(service, 'syncChatMembersWithClient' as any);
      syncChatMembersWithClientSpy.mockResolvedValue(undefined);

      const result = await (service as any).createGraphChatWithClient(mockGraphClient, participants, topic);

      expect(mockPost).toHaveBeenCalled();
      expect(result).toBe(chatId);
    });

    it('should return existing chat when found', async () => {
      const participants = [
        { userId: 'user-1', oid: 'azure-1' },
      ];
      const topic = 'Test Topic';
      const existingChatId = 'existing-chat-123';

      const mockGet = jest.fn().mockResolvedValue({ value: [{ id: existingChatId }] });
      const mockFilter = jest.fn().mockReturnValue({ get: mockGet });
      const mockApi = jest.fn().mockReturnValue({ filter: mockFilter });
      const mockGraphClient = { api: mockApi };

      const syncChatMembersWithClientSpy = jest.spyOn(service, 'syncChatMembersWithClient' as any);
      syncChatMembersWithClientSpy.mockResolvedValue(undefined);

      const result = await (service as any).createGraphChatWithClient(mockGraphClient, participants, topic);

      expect(result).toBe(existingChatId);
      expect(syncChatMembersWithClientSpy).toHaveBeenCalled();
    });

    it('should handle error when creating chat', async () => {
      const participants = [
        { userId: 'user-1', oid: 'azure-1' },
      ];
      const topic = 'Test Topic';

      const mockPost = jest.fn().mockRejectedValue(new Error('Graph API error'));
      const mockFilter = jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ value: [] }) });
      const mockApi = jest.fn().mockReturnValue({ filter: mockFilter, post: mockPost });
      const mockGraphClient = { api: mockApi };

      await expect(
        (service as any).createGraphChatWithClient(mockGraphClient, participants, topic)
      ).rejects.toThrow();
    });

    it('should add participants in batches when exceeding MAX_INITIAL_MEMBERS', async () => {
      const participants = Array.from({ length: 150 }, (_, i) => ({
        userId: `user-${i}`,
        oid: `azure-${i}`,
      }));
      const topic = 'Test Topic';
      const chatId = 'chat-123';

      const mockPost = jest.fn().mockResolvedValue({ id: chatId });
      const mockFilter = jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ value: [] }) });
      const mockApi = jest.fn().mockReturnValue({ filter: mockFilter, post: mockPost });
      const mockGraphClient = { api: mockApi };

      const addParticipantsInBatchesWithClientSpy = jest.spyOn(service, 'addParticipantsInBatchesWithClient' as any);
      addParticipantsInBatchesWithClientSpy.mockResolvedValue(undefined);
      const syncChatMembersWithClientSpy = jest.spyOn(service, 'syncChatMembersWithClient' as any);
      syncChatMembersWithClientSpy.mockResolvedValue(undefined);

      const result = await (service as any).createGraphChatWithClient(mockGraphClient, participants, topic);

      expect(addParticipantsInBatchesWithClientSpy).toHaveBeenCalled();
      expect(result).toBe(chatId);
    });
  });

  describe('addParticipantsInBatchesWithClient', () => {
    it('should add participants in batches', async () => {
      const chatId = 'chat-123';
      const participants = Array.from({ length: 25 }, (_, i) => ({
        userId: `user-${i}`,
        oid: `azure-${i}`,
      }));

      const mockPost = jest.fn().mockResolvedValue(undefined);
      const mockApi = jest.fn().mockReturnValue({ post: mockPost });
      const mockGraphClient = { api: mockApi };

      jest.useFakeTimers();
      const promise = (service as any).addParticipantsInBatchesWithClient(mockGraphClient, chatId, participants);
      await jest.runAllTimersAsync();
      await promise;
      jest.useRealTimers();

      expect(mockPost).toHaveBeenCalled();
    });

    it('should handle errors when adding participants', async () => {
      const chatId = 'chat-123';
      const participants = [
        { userId: 'user-1', oid: 'azure-1' },
      ];

      const mockPost = jest.fn().mockRejectedValue(new Error('Failed to add'));
      const mockApi = jest.fn().mockReturnValue({ post: mockPost });
      const mockGraphClient = { api: mockApi };

      await (service as any).addParticipantsInBatchesWithClient(mockGraphClient, chatId, participants);

      expect(mockPost).toHaveBeenCalled();
    });
  });

  describe('syncChatMembersWithClient', () => {
    it('should sync chat members', async () => {
      const chatId = 'chat-123';
      const desired = [
        { userId: 'user-1', oid: 'azure-1' },
        { userId: 'user-2', oid: 'azure-2' },
      ];

      const mockGet = jest.fn().mockResolvedValue({
        value: [
          { id: 'member-1', user: { id: 'azure-1' } },
          { id: 'member-2', user: { id: 'azure-3' } },
        ],
      });
      const mockDelete = jest.fn().mockResolvedValue(undefined);
      const mockApi = jest.fn((path: string) => {
        if (path.includes('/members/')) {
          return { delete: mockDelete };
        }
        return { get: mockGet };
      });
      const mockGraphClient = { api: mockApi };

      (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue([]);

      const addParticipantsInBatchesWithClientSpy = jest.spyOn(service, 'addParticipantsInBatchesWithClient' as any);
      addParticipantsInBatchesWithClientSpy.mockResolvedValue(undefined);

      await (service as any).syncChatMembersWithClient(mockGraphClient, chatId, desired);

      expect(mockGet).toHaveBeenCalled();
    });

    it('should handle errors when syncing members', async () => {
      const chatId = 'chat-123';
      const desired = [
        { userId: 'user-1', oid: 'azure-1' },
      ];

      const mockGet = jest.fn().mockRejectedValue(new Error('Graph API error'));
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      const mockGraphClient = { api: mockApi };

      await (service as any).syncChatMembersWithClient(mockGraphClient, chatId, desired);

      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('syncChatParticipantsInDb', () => {
    it('should sync chat participants in database', async () => {
      const chatId = 'chat-123';
      const participants = [
        { userId: 'user-1', oid: 'azure-1' },
        { userId: 'user-2', oid: 'azure-2' },
      ];

      if (!mockPrismaClient.chatParticipant) {
        mockPrismaClient.chatParticipant = {
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          upsert: jest.fn().mockResolvedValue({}),
        };
      }

      await (service as any).syncChatParticipantsInDb(chatId, participants);

      expect(mockPrismaClient.chatParticipant.deleteMany).toHaveBeenCalled();
      expect(mockPrismaClient.chatParticipant.upsert).toHaveBeenCalled();
    });
  });

  describe('ensureChatRecordAndMembers', () => {
    it('should return early when chat exists', async () => {
      const chatId = 'chat-123';
      const topic = 'Test Topic';
      const participants = [
        { userId: 'user-1', oid: 'azure-1' },
      ];

      (mockPrismaClient.chat.findUnique as jest.Mock).mockResolvedValue({
        id: chatId,
        topic,
      });

      await (service as any).ensureChatRecordAndMembers(chatId, topic, participants);

      expect(mockPrismaClient.chat.findUnique).toHaveBeenCalled();
    });

    it('should create chat record when not exists', async () => {
      const chatId = 'chat-123';
      const topic = 'Test Topic';
      const participants = [
        { userId: 'user-1', oid: 'azure-1' },
      ];

      (mockPrismaClient.chat.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrismaClient.chat.create as jest.Mock).mockResolvedValue({ id: chatId });

      const syncChatParticipantsInDbSpy = jest.spyOn(service, 'syncChatParticipantsInDb' as any);
      syncChatParticipantsInDbSpy.mockResolvedValue(undefined);

      await (service as any).ensureChatRecordAndMembers(chatId, topic, participants);

      expect(mockPrismaClient.chat.create).toHaveBeenCalled();
      expect(syncChatParticipantsInDbSpy).toHaveBeenCalled();
    });
  });

  describe('createSpecificChat', () => {
    it('should throw error when participants count is not 2', async () => {
      const token = 'test-token';
      const participants = [
        { userId: 'user-1', azureAdObjectId: 'azure-1' },
      ];
      const topic = 'Test Topic';

      await expect(
        (service as any).createSpecificChat(token, participants, topic)
      ).rejects.toThrow(ChatInvalidParticipantsError);
    });

    it('should return existing chat when found', async () => {
      const token = 'test-token';
      const participants = [
        { userId: 'user-1', azureAdObjectId: 'azure-1' },
        { userId: 'user-2', azureAdObjectId: 'azure-2' },
      ];
      const topic = 'Test Topic';
      const existingChatId = 'existing-chat-123';

      (mockPrismaClient.chat.findFirst as jest.Mock).mockResolvedValue({
        id: existingChatId,
        members: [
          { userId: 'user-1' },
          { userId: 'user-2' },
        ],
      });

      const result = await (service as any).createSpecificChat(token, participants, topic);

      expect(result).toBe(existingChatId);
    });

    it('should create new one-on-one chat', async () => {
      const token = 'test-token';
      const participants = [
        { userId: 'user-1', azureAdObjectId: 'azure-1' },
        { userId: 'user-2', azureAdObjectId: 'azure-2' },
      ];
      const topic = 'Test Topic';
      const chatId = 'chat-123';

      (mockPrismaClient.chat.findFirst as jest.Mock).mockResolvedValue(null);

      const createGraphOneOnOneChatSpy = jest.spyOn(service, 'createGraphOneOnOneChat' as any);
      createGraphOneOnOneChatSpy.mockResolvedValue(chatId);

      const result = await (service as any).createSpecificChat(token, participants, topic);

      expect(result).toBe(chatId);
      expect(createGraphOneOnOneChatSpy).toHaveBeenCalled();
    });
  });

  describe('createGraphOneOnOneChat', () => {
    it('should create one-on-one chat', async () => {
      const token = 'test-token';
      const participants = [
        { userId: 'user-1', azureAdObjectId: 'azure-1' },
        { userId: 'user-2', azureAdObjectId: 'azure-2' },
      ];
      const topic = 'Test Topic';
      const chatId = 'chat-123';

      const mockGet = jest.fn().mockResolvedValue({ userType: 'Member' });
      const mockPost = jest.fn().mockResolvedValue({ id: chatId });
      const mockSelect = jest.fn().mockReturnValue({ get: mockGet });
      const mockApi = jest.fn((path: string) => {
        if (path.includes('/users/')) {
          return { select: mockSelect };
        }
        return { post: mockPost };
      });
      const mockGraphClient = { api: mockApi };

      const initGraphClientSpy = jest.spyOn(service, 'initGraphClient' as any);
      initGraphClientSpy.mockReturnValue(mockGraphClient);

      (mockPrismaClient.chat.create as jest.Mock).mockResolvedValue({ id: chatId });

      const result = await (service as any).createGraphOneOnOneChat(token, participants, topic);

      expect(result).toBe(chatId);
      expect(mockPost).toHaveBeenCalled();
      expect(mockPrismaClient.chat.create).toHaveBeenCalled();
    });

    it('should handle guest user type', async () => {
      const token = 'test-token';
      const participants = [
        { userId: 'user-1', azureAdObjectId: 'azure-1' },
        { userId: 'user-2', azureAdObjectId: 'azure-2' },
      ];
      const topic = 'Test Topic';
      const chatId = 'chat-123';

      const mockGet = jest.fn().mockResolvedValue({ userType: 'Guest' });
      const mockPost = jest.fn().mockResolvedValue({ id: chatId });
      const mockSelect = jest.fn().mockReturnValue({ get: mockGet });
      const mockApi = jest.fn((path: string) => {
        if (path.includes('/users/')) {
          return { select: mockSelect };
        }
        return { post: mockPost };
      });
      const mockGraphClient = { api: mockApi };

      const initGraphClientSpy = jest.spyOn(service, 'initGraphClient' as any);
      initGraphClientSpy.mockReturnValue(mockGraphClient);

      (mockPrismaClient.chat.create as jest.Mock).mockResolvedValue({ id: chatId });

      const result = await (service as any).createGraphOneOnOneChat(token, participants, topic);

      expect(result).toBe(chatId);
    });
  });
});

