import { GetSnapshotsRequest } from '../../../src/domain/value-objects/GetSnapshotsRequest';
import { GetSnapshotsResponse } from '../../../src/domain/value-objects/GetSnapshotsResponse';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { createMockUserRepository, createMockSnapshotRepository, createMockUser } from './domainServiceTestSetup';

jest.mock('../../../src/utils/blobUrlParser', () => ({
  tryParseBlobPathFromUrl: jest.fn((url: string) => {
    if (url.includes('blob.core.windows.net')) {
      return 'snapshots/blob-name.jpg';
    }
    return null;
  }),
}));

jest.mock('../../../src/infrastructure/services/blobSigner', () => ({
  generateSnapshotSasUrl: jest.fn((path: string) => `https://storage.example.com/${path}?sas=token`),
}));

jest.mock('../../../src/config', () => ({
  config: {
    snapshotContainerName: 'snapshots',
  },
}));

import { GetSnapshotsDomainService } from '../../../src/domain/services/GetSnapshotsDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { ISnapshotRepository } from '../../../src/domain/interfaces/ISnapshotRepository';

describe('GetSnapshotsDomainService', () => {
  let service: GetSnapshotsDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockSnapshotRepository: jest.Mocked<ISnapshotRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockSnapshotRepository = createMockSnapshotRepository();
    service = new GetSnapshotsDomainService(mockUserRepository, mockSnapshotRepository);
  });

  describe('getSnapshots', () => {
    it('should return snapshots successfully', async () => {
      const request = new GetSnapshotsRequest('caller-id');
      const caller = createMockUser({
        id: 'caller-id',
        azureAdObjectId: 'caller-id',
      });
      const snapshots = [
        {
          id: 'snapshot-1',
          supervisor: { fullName: 'Supervisor One' },
          pso: { fullName: 'PSO One', email: 'pso1@example.com' },
          reason: { id: 'reason-1', label: 'Reason 1', code: 'REASON_1' },
          description: 'Description 1',
          imageUrl: 'https://storage.blob.core.windows.net/snapshots/blob1.jpg',
          takenAt: new Date(),
        },
      ];

      mockUserRepository.findByAzureAdObjectId = jest.fn().mockResolvedValue(caller);
      mockSnapshotRepository.findAllWithRelations = jest.fn().mockResolvedValue(snapshots as any);

      const result = await service.getSnapshots(request);

      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].id).toBe('snapshot-1');
      expect(result.reports[0].supervisorName).toBe('Supervisor One');
    });

    it('should throw error when caller not found', async () => {
      const request = new GetSnapshotsRequest('caller-id');

      mockUserRepository.findByAzureAdObjectId = jest.fn().mockResolvedValue(null);

      await expect(service.getSnapshots(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw error when caller is deleted', async () => {
      const request = new GetSnapshotsRequest('caller-id');
      const caller = createMockUser({
        id: 'caller-id',
        azureAdObjectId: 'caller-id',
        deletedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId = jest.fn().mockResolvedValue(caller);

      await expect(service.getSnapshots(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should return empty array when no snapshots', async () => {
      const request = new GetSnapshotsRequest('caller-id');
      const caller = createMockUser({
        id: 'caller-id',
        azureAdObjectId: 'caller-id',
      });

      mockUserRepository.findByAzureAdObjectId = jest.fn().mockResolvedValue(caller);
      mockSnapshotRepository.findAllWithRelations = jest.fn().mockResolvedValue([]);

      const result = await service.getSnapshots(request);

      expect(result.reports).toEqual([]);
    });
  });
});

