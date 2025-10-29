import { SendSnapshotDomainService } from '../../../../shared/domain/services/SendSnapshotDomainService';
import { SendSnapshotRequest } from '../../../../shared/domain/value-objects/SendSnapshotRequest';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { IBlobStorageService } from '../../../../shared/domain/interfaces/IBlobStorageService';
import { ISnapshotRepository } from '../../../../shared/domain/interfaces/ISnapshotRepository';
import { UserNotFoundError } from '../../../../shared/domain/errors/UserErrors';

describe('SendSnapshotDomainService', () => {
  let service: SendSnapshotDomainService;
  let userRepository: jest.Mocked<IUserRepository>;
  let blobStorageService: jest.Mocked<IBlobStorageService>;
  let snapshotRepository: jest.Mocked<ISnapshotRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = { findByAzureAdObjectId: jest.fn(), findByEmail: jest.fn() } as any;
    blobStorageService = { uploadImage: jest.fn() } as any;
    snapshotRepository = { create: jest.fn() } as any;
    service = new SendSnapshotDomainService(userRepository, blobStorageService, snapshotRepository);
  });

  describe('sendSnapshot', () => {
    it('should send snapshot successfully', async () => {
      const mockSupervisor = { id: 'sup-123', deletedAt: null };
      const mockPso = { id: 'pso-123', email: 'pso@example.com', deletedAt: null };
      const mockSnapshot = { id: 'snap-123' };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockSupervisor as any);
      userRepository.findByEmail.mockResolvedValue(mockPso as any);
      blobStorageService.uploadImage.mockResolvedValue('https://example.com/image.jpg');
      snapshotRepository.create.mockResolvedValue(mockSnapshot as any);
      const request = new SendSnapshotRequest('caller-123', 'pso@example.com', 'base64data', 'Test reason');
      const result = await service.sendSnapshot(request, 'Supervisor Name', 'token');
      expect(result.snapshotId).toBe('snap-123');
    });

    it('should throw UserNotFoundError when supervisor not found', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue(null);
      const request = new SendSnapshotRequest('caller-123', 'pso@example.com', 'base64data', 'Test reason');
      await expect(service.sendSnapshot(request, 'Supervisor Name', 'token')).rejects.toThrow(UserNotFoundError);
    });

    it('should throw UserNotFoundError when PSO not found', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: 'sup-123', deletedAt: null } as any);
      userRepository.findByEmail.mockResolvedValue(null);
      const request = new SendSnapshotRequest('caller-123', 'pso@example.com', 'base64data', 'Test reason');
      await expect(service.sendSnapshot(request, 'Supervisor Name', 'token')).rejects.toThrow(UserNotFoundError);
    });
  });
});