import { ChatService } from '../../../src/infrastructure/services/ChatService';
import { ChatNoParticipantsError, ChatInvalidParticipantsError } from '../../../src/domain/errors/InfrastructureErrors';
import { UserRole } from '../../../src/domain/enums/UserRole';
import prisma from '../../../src/infrastructure/database/PrismaClientService';
import { config } from '../../../src/config';
import { createMockPrismaClient } from '../../shared/mocks';

jest.mock('../../../src/infrastructure/database/PrismaClientService');
jest.mock('../../../src/config', () => ({
  config: {
    azureTenantId: 'tenant-id',
    azureClientId: 'client-id',
    azureClientSecret: 'client-secret',
  },
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
});

