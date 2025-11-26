import { SendSnapshotDomainService } from '../../../../shared/domain/services/SendSnapshotDomainService';
import { SendSnapshotRequest } from '../../../../shared/domain/value-objects/SendSnapshotRequest';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { IBlobStorageService } from '../../../../shared/domain/interfaces/IBlobStorageService';
import { ISnapshotRepository } from '../../../../shared/domain/interfaces/ISnapshotRepository';
import { IChatService } from '../../../../shared/domain/interfaces/IChatService';
import { UserNotFoundError } from '../../../../shared/domain/errors/UserErrors';

describe('SendSnapshotDomainService', () => {
  let service: SendSnapshotDomainService;
  let userRepository: jest.Mocked<IUserRepository>;
  let blobStorageService: jest.Mocked<IBlobStorageService>;
  let snapshotRepository: jest.Mocked<ISnapshotRepository>;
  let chatService: jest.Mocked<IChatService>;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = { findByAzureAdObjectId: jest.fn(), findByEmail: jest.fn() } as any;
    blobStorageService = { uploadImage: jest.fn() } as any;
    snapshotRepository = { create: jest.fn() } as any;
    chatService = {
      getSnapshotReportsChatId: jest.fn().mockResolvedValue('chat-123'),
      sendMessageAsServiceAccount: jest.fn()
    } as any;
    const errorLogService = {
      logError: jest.fn(),
      logChatServiceError: jest.fn()
    } as any;
    service = new SendSnapshotDomainService(
      userRepository,
      blobStorageService,
      snapshotRepository,
      chatService,
      errorLogService
    );
  });

  describe('sendSnapshot', () => {
    it('should send snapshot successfully', async () => {
      const mockSupervisor = { id: 'sup-123', fullName: 'Supervisor Name', deletedAt: null };
      const mockPso = { id: 'pso-123', email: 'pso@example.com', fullName: 'PSO Test', deletedAt: null };
      const mockSnapshot = { id: 'snap-123' };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockSupervisor as any);
      userRepository.findByEmail.mockResolvedValue(mockPso as any);
      blobStorageService.uploadImage.mockResolvedValue('https://example.com/image.jpg');
      snapshotRepository.create.mockResolvedValue(mockSnapshot as any);
      const request = new SendSnapshotRequest('caller-123', 'pso@example.com', 'Test reason', 'base64data');
      const result = await service.sendSnapshot(request);
      expect(result.snapshotId).toBe('snap-123');
      expect(chatService.getSnapshotReportsChatId).toHaveBeenCalled();
      expect(chatService.sendMessageAsServiceAccount).toHaveBeenCalledWith(
        'chat-123',
        expect.objectContaining({
          type: 'snapshotReport',
          psoEmail: 'pso@example.com',
          imageUrl: 'https://example.com/image.jpg'
        })
      );
    });

    it('should throw UserNotFoundError when supervisor not found', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue(null);
      const request = new SendSnapshotRequest('caller-123', 'pso@example.com', 'Test reason', 'base64data');
      await expect(service.sendSnapshot(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw UserNotFoundError when PSO not found', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: 'sup-123', deletedAt: null } as any);
      userRepository.findByEmail.mockResolvedValue(null);
      const request = new SendSnapshotRequest('caller-123', 'pso@example.com', 'Test reason', 'base64data');
      await expect(service.sendSnapshot(request)).rejects.toThrow(UserNotFoundError);
    });
  });
});