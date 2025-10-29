/**
 * @fileoverview Tests for DeleteSnapshotDomainService
 * @description Tests for delete snapshot domain service
 */

import { DeleteSnapshotDomainService } from '../../../../shared/domain/services/DeleteSnapshotDomainService';
import { DeleteSnapshotRequest } from '../../../../shared/domain/value-objects/DeleteSnapshotRequest';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { IBlobStorageService } from '../../../../shared/domain/interfaces/IBlobStorageService';
import { ISnapshotRepository } from '../../../../shared/domain/interfaces/ISnapshotRepository';
import { UserNotFoundError } from '../../../../shared/domain/errors/UserErrors';

describe('DeleteSnapshotDomainService', () => {
  let service: DeleteSnapshotDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockBlobStorageService: jest.Mocked<IBlobStorageService>;
  let mockSnapshotRepository: jest.Mocked<ISnapshotRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
    } as any;

    mockBlobStorageService = {
      deleteImage: jest.fn(),
    } as any;

    mockSnapshotRepository = {
      findById: jest.fn(),
      deleteById: jest.fn(),
    } as any;

    service = new DeleteSnapshotDomainService(
      mockUserRepository,
      mockBlobStorageService,
      mockSnapshotRepository
    );
  });

  describe('constructor', () => {
    it('should create service instance', () => {
      expect(service).toBeInstanceOf(DeleteSnapshotDomainService);
    });
  });

  describe('deleteSnapshot', () => {
    const mockCallerId = 'caller-123';
    const mockSnapshotId = 'snapshot-456';
    const mockImageUrl = 'https://example.com/snapshots/123.jpg';
    const mockBlobName = '123.jpg';

    const mockCaller = {
      id: 'user-123',
      azureAdObjectId: mockCallerId,
      email: 'caller@example.com',
      deletedAt: null,
    };

    const mockSnapshot = {
      id: mockSnapshotId,
      imageUrl: mockImageUrl,
      reason: 'test reason',
      takenAt: new Date(),
    };

    it('should delete snapshot successfully', async () => {
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
      mockSnapshotRepository.findById.mockResolvedValue(mockSnapshot as any);
      mockBlobStorageService.deleteImage.mockResolvedValue(true);
      mockSnapshotRepository.deleteById.mockResolvedValue(undefined);

      const request = new DeleteSnapshotRequest(mockCallerId, mockSnapshotId);
      const result = await service.deleteSnapshot(request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(mockCallerId);
      expect(mockSnapshotRepository.findById).toHaveBeenCalledWith(mockSnapshotId);
      expect(mockBlobStorageService.deleteImage).toHaveBeenCalled();
      expect(mockSnapshotRepository.deleteById).toHaveBeenCalledWith(mockSnapshotId);
      expect(result.deletedId).toBe(mockSnapshotId);
      expect(result.message).toContain('deleted successfully');
    });

    it('should throw error when caller is not found', async () => {
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      const request = new DeleteSnapshotRequest(mockCallerId, mockSnapshotId);

      await expect(service.deleteSnapshot(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw error when caller is deleted', async () => {
      const mockDeletedUser = { ...mockCaller, deletedAt: new Date() };
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockDeletedUser as any);

      const request = new DeleteSnapshotRequest(mockCallerId, mockSnapshotId);

      await expect(service.deleteSnapshot(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw error when snapshot is not found', async () => {
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
      mockSnapshotRepository.findById.mockResolvedValue(null);

      const request = new DeleteSnapshotRequest(mockCallerId, mockSnapshotId);

      await expect(service.deleteSnapshot(request)).rejects.toThrow('Snapshot with ID');
    });

    it('should continue deletion when blob delete fails', async () => {
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
      mockSnapshotRepository.findById.mockResolvedValue(mockSnapshot as any);
      mockBlobStorageService.deleteImage.mockRejectedValue(new Error('Blob delete failed'));
      mockSnapshotRepository.deleteById.mockResolvedValue(undefined);

      const request = new DeleteSnapshotRequest(mockCallerId, mockSnapshotId);
      const result = await service.deleteSnapshot(request);

      expect(mockSnapshotRepository.deleteById).toHaveBeenCalled();
      expect(result.deletedId).toBe(mockSnapshotId);
    });

    it('should handle snapshot without image URL', async () => {
      const snapshotWithoutUrl = { ...mockSnapshot, imageUrl: undefined };
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
      mockSnapshotRepository.findById.mockResolvedValue(snapshotWithoutUrl as any);
      mockSnapshotRepository.deleteById.mockResolvedValue(undefined);

      const request = new DeleteSnapshotRequest(mockCallerId, mockSnapshotId);
      await service.deleteSnapshot(request);

      expect(mockSnapshotRepository.deleteById).toHaveBeenCalled();
    });
  });
});

