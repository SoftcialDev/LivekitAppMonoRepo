import { DeleteSnapshotDomainService } from '../../../src/domain/services/DeleteSnapshotDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IBlobStorageService } from '../../../src/domain/interfaces/IBlobStorageService';
import { ISnapshotRepository } from '../../../src/domain/interfaces/ISnapshotRepository';
import { DeleteSnapshotRequest } from '../../../src/domain/value-objects/DeleteSnapshotRequest';
import { DeleteSnapshotResponse } from '../../../src/domain/value-objects/DeleteSnapshotResponse';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { SnapshotNotFoundError } from '../../../src/domain/errors/SnapshotErrors';
import { createMockUserRepository, createMockBlobStorageService, createMockSnapshotRepository, createMockUser } from './domainServiceTestSetup';

describe('DeleteSnapshotDomainService', () => {
  let service: DeleteSnapshotDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockBlobStorageService: jest.Mocked<IBlobStorageService>;
  let mockSnapshotRepository: jest.Mocked<ISnapshotRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockBlobStorageService = createMockBlobStorageService();
    mockSnapshotRepository = createMockSnapshotRepository();
    service = new DeleteSnapshotDomainService(
      mockUserRepository,
      mockBlobStorageService,
      mockSnapshotRepository
    );
  });

  describe('deleteSnapshot', () => {
    it('should delete snapshot successfully', async () => {
      const request = new DeleteSnapshotRequest('caller-id', 'snapshot-id');
      const caller = createMockUser({
        id: 'caller-id',
        azureAdObjectId: 'caller-id',
      });
      const snapshot = {
        id: 'snapshot-id',
        imageUrl: 'https://storage.example.com/container/blob-name.jpg',
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockSnapshotRepository.findById.mockResolvedValue(snapshot);
      mockBlobStorageService.deleteImage.mockResolvedValue(undefined);
      mockSnapshotRepository.deleteById.mockResolvedValue(undefined);

      const result = await service.deleteSnapshot(request);

      expect(mockSnapshotRepository.findById).toHaveBeenCalledWith('snapshot-id');
      expect(mockBlobStorageService.deleteImage).toHaveBeenCalledWith('blob-name.jpg');
      expect(mockSnapshotRepository.deleteById).toHaveBeenCalledWith('snapshot-id');
      expect(result.deletedId).toBe('snapshot-id');
      expect(result.message).toContain('deleted successfully');
    });

    it('should throw error when caller not found', async () => {
      const request = new DeleteSnapshotRequest('caller-id', 'snapshot-id');

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.deleteSnapshot(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw error when caller is deleted', async () => {
      const request = new DeleteSnapshotRequest('caller-id', 'snapshot-id');
      const caller = createMockUser({
        id: 'caller-id',
        azureAdObjectId: 'caller-id',
        deletedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(service.deleteSnapshot(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw error when snapshot not found', async () => {
      const request = new DeleteSnapshotRequest('caller-id', 'snapshot-id');
      const caller = createMockUser({
        id: 'caller-id',
        azureAdObjectId: 'caller-id',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockSnapshotRepository.findById.mockResolvedValue(null);

      await expect(service.deleteSnapshot(request)).rejects.toThrow(SnapshotNotFoundError);
    });

    it('should continue deletion even if blob deletion fails', async () => {
      const request = new DeleteSnapshotRequest('caller-id', 'snapshot-id');
      const caller = createMockUser({
        id: 'caller-id',
        azureAdObjectId: 'caller-id',
      });
      const snapshot = {
        id: 'snapshot-id',
        imageUrl: 'https://storage.example.com/container/blob-name.jpg',
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockSnapshotRepository.findById.mockResolvedValue(snapshot);
      mockBlobStorageService.deleteImage.mockRejectedValue(new Error('Blob not found'));
      mockSnapshotRepository.deleteById.mockResolvedValue(undefined);

      const result = await service.deleteSnapshot(request);

      expect(mockSnapshotRepository.deleteById).toHaveBeenCalled();
      expect(result.deletedId).toBe('snapshot-id');
    });
  });
});

