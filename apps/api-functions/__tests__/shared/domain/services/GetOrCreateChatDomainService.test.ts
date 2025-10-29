import { GetOrCreateChatDomainService } from '../../../../shared/domain/services/GetOrCreateChatDomainService';
import { GetOrCreateChatRequest } from '../../../../shared/domain/value-objects/GetOrCreateChatRequest';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { IChatService } from '../../../../shared/domain/interfaces/IChatService';
import { UserNotFoundError } from '../../../../shared/domain/errors/UserErrors';

describe('GetOrCreateChatDomainService', () => {
  let service: GetOrCreateChatDomainService;
  let userRepository: jest.Mocked<IUserRepository>;
  let chatService: jest.Mocked<IChatService>;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = { findByAzureAdObjectId: jest.fn(), findByEmail: jest.fn() } as any;
    chatService = { getOrSyncChat: jest.fn() } as any;
    service = new GetOrCreateChatDomainService(userRepository, chatService);
  });

  describe('getOrCreateChat', () => {
    it('should create chat successfully', async () => {
      const mockCaller = { id: 'caller-123', azureAdObjectId: 'azure-caller', email: 'caller@example.com', fullName: 'Caller Name', deletedAt: null };
      const mockPso = { id: 'pso-123', azureAdObjectId: 'azure-pso', email: 'pso@example.com', fullName: 'PSO Name', deletedAt: null };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
      userRepository.findByEmail.mockResolvedValue(mockPso as any);
      chatService.getOrSyncChat.mockResolvedValue('chat-123');
      const request = new GetOrCreateChatRequest('caller-123', 'pso@example.com');
      const result = await service.getOrCreateChat(request, 'token');
      expect(result.chatId).toBe('chat-123');
    });

    it('should throw UserNotFoundError when caller not found', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue(null);
      const request = new GetOrCreateChatRequest('caller-123', 'pso@example.com');
      await expect(service.getOrCreateChat(request, 'token')).rejects.toThrow(UserNotFoundError);
    });

    it('should throw UserNotFoundError when PSO not found', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: 'caller-123', deletedAt: null } as any);
      userRepository.findByEmail.mockResolvedValue(null);
      const request = new GetOrCreateChatRequest('caller-123', 'pso@example.com');
      await expect(service.getOrCreateChat(request, 'token')).rejects.toThrow(UserNotFoundError);
    });
  });
});