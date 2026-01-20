import { GetOrCreateChatDomainService } from '../../../src/domain/services/GetOrCreateChatDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IChatService } from '../../../src/domain/interfaces/IChatService';
import { GetOrCreateChatRequest } from '../../../src/domain/value-objects/GetOrCreateChatRequest';
import { GetOrCreateChatResponse } from '../../../src/domain/value-objects/GetOrCreateChatResponse';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { createMockUserRepository, createMockChatService, createMockUser } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';

describe('GetOrCreateChatDomainService', () => {
  let service: GetOrCreateChatDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockChatService: jest.Mocked<IChatService>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockChatService = createMockChatService();
    service = new GetOrCreateChatDomainService(mockUserRepository, mockChatService);
  });

  describe('getOrCreateChat', () => {
    const token = 'test-token';

    it('should successfully create or get chat', async () => {
      const request = new GetOrCreateChatRequest('caller-id', 'pso@example.com');
      const caller = createMockUser({
        id: 'caller-id',
        azureAdObjectId: 'caller-azure-id',
        email: 'caller@example.com',
        fullName: 'Caller User',
        role: UserRole.Supervisor,
      });
      const pso = createMockUser({
        id: 'pso-id',
        azureAdObjectId: 'pso-azure-id',
        email: 'pso@example.com',
        fullName: 'PSO User',
        role: UserRole.PSO,
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockUserRepository.findByEmail.mockResolvedValue(pso);
      mockChatService.getOrSyncChat.mockResolvedValue('chat-id-123');

      const result = await service.getOrCreateChat(request, token);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith('caller-id');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('pso@example.com');
      expect(mockChatService.getOrSyncChat).toHaveBeenCalledWith(
        token,
        [
          { userId: 'caller-id', azureAdObjectId: 'caller-azure-id' },
          { userId: 'pso-id', azureAdObjectId: 'pso-azure-id' },
        ],
        'InContactApp – Caller User & PSO User'
      );
      expect(result.chatId).toBe('chat-id-123');
    });

    it('should throw error when caller not found', async () => {
      const request = new GetOrCreateChatRequest('caller-id', 'pso@example.com');

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.getOrCreateChat(request, token)).rejects.toThrow(UserNotFoundError);
      expect(mockChatService.getOrSyncChat).not.toHaveBeenCalled();
    });

    it('should throw error when caller is deleted', async () => {
      const request = new GetOrCreateChatRequest('caller-id', 'pso@example.com');
      const caller = createMockUser({
        id: 'caller-id',
        deletedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(service.getOrCreateChat(request, token)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw error when PSO not found', async () => {
      const request = new GetOrCreateChatRequest('caller-id', 'pso@example.com');
      const caller = createMockUser({
        id: 'caller-id',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.getOrCreateChat(request, token)).rejects.toThrow(UserNotFoundError);
      expect(mockChatService.getOrSyncChat).not.toHaveBeenCalled();
    });

    it('should throw error when PSO is deleted', async () => {
      const request = new GetOrCreateChatRequest('caller-id', 'pso@example.com');
      const caller = createMockUser({
        id: 'caller-id',
      });
      const pso = createMockUser({
        id: 'pso-id',
        email: 'pso@example.com',
        deletedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockUserRepository.findByEmail.mockResolvedValue(pso);

      await expect(service.getOrCreateChat(request, token)).rejects.toThrow(UserNotFoundError);
    });

    it('should normalize PSO email to lowercase', async () => {
      const request = new GetOrCreateChatRequest('caller-id', 'PSO@EXAMPLE.COM');
      const caller = createMockUser({
        id: 'caller-id',
        azureAdObjectId: 'caller-azure-id',
        fullName: 'Caller',
      });
      const pso = createMockUser({
        id: 'pso-id',
        azureAdObjectId: 'pso-azure-id',
        email: 'pso@example.com',
        fullName: 'PSO',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockUserRepository.findByEmail.mockResolvedValue(pso);
      mockChatService.getOrSyncChat.mockResolvedValue('chat-id');

      await service.getOrCreateChat(request, token);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('pso@example.com');
    });
  });
});





