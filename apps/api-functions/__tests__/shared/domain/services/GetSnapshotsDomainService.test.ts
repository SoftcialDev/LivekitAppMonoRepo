import { GetSnapshotsDomainService } from '../../../../shared/domain/services/GetSnapshotsDomainService';
import { GetSnapshotsRequest } from '../../../../shared/domain/value-objects/GetSnapshotsRequest';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { ISnapshotRepository } from '../../../../shared/domain/interfaces/ISnapshotRepository';
import { UserNotFoundError } from '../../../../shared/domain/errors/UserErrors';

describe('GetSnapshotsDomainService', () => {
  let service: GetSnapshotsDomainService;
  let userRepository: jest.Mocked<IUserRepository>;
  let snapshotRepository: jest.Mocked<ISnapshotRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = { findByAzureAdObjectId: jest.fn() } as any;
    snapshotRepository = { findAllWithRelations: jest.fn() } as any;
    service = new GetSnapshotsDomainService(userRepository, snapshotRepository);
  });

  describe('getSnapshots', () => {
    it('should return snapshots when caller is valid', async () => {
      const mockCaller = { id: 'user-123', deletedAt: null };
      const mockSnapshots = [{ id: 'snap-1', supervisor: { fullName: 'Supervisor One' }, pso: { fullName: 'PSO One', email: 'pso1@example.com' }, reason: 'Test reason', imageUrl: 'https://example.com/image1.jpg', takenAt: new Date('2024-01-01T10:00:00Z') }];
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
      snapshotRepository.findAllWithRelations.mockResolvedValue(mockSnapshots as any);
      const request = new GetSnapshotsRequest('caller-123');
      const result = await service.getSnapshots(request);
      expect(result.reports).toHaveLength(1);
    });

    it('should throw UserNotFoundError when caller not found', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue(null);
      const request = new GetSnapshotsRequest('caller-123');
      await expect(service.getSnapshots(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should return empty array when no snapshots exist', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue({ id: 'user-123', deletedAt: null } as any);
      snapshotRepository.findAllWithRelations.mockResolvedValue([]);
      const request = new GetSnapshotsRequest('caller-123');
      const result = await service.getSnapshots(request);
      expect(result.reports).toHaveLength(0);
    });
  });
});