import { GetSnapshotReasonsDomainService } from '../../../src/domain/services/GetSnapshotReasonsDomainService';
import { ISnapshotReasonRepository } from '../../../src/domain/interfaces/ISnapshotReasonRepository';
import { SnapshotReasonResponse } from '../../../src/domain/value-objects/SnapshotReasonResponse';
import { createMockSnapshotReasonRepository } from './domainServiceTestSetup';

describe('GetSnapshotReasonsDomainService', () => {
  let service: GetSnapshotReasonsDomainService;
  let mockSnapshotReasonRepository: jest.Mocked<ISnapshotReasonRepository>;

  beforeEach(() => {
    mockSnapshotReasonRepository = createMockSnapshotReasonRepository();
    service = new GetSnapshotReasonsDomainService(mockSnapshotReasonRepository);
  });

  describe('getSnapshotReasons', () => {
    it('should return all active snapshot reasons', async () => {
      const mockReasons = [
        {
          id: 'reason-1',
          label: 'Reason 1',
          code: 'REASON_1',
          isDefault: false,
          isActive: true,
          order: 1,
        },
        {
          id: 'reason-2',
          label: 'Reason 2',
          code: 'REASON_2',
          isDefault: true,
          isActive: true,
          order: 2,
        },
      ];

      mockSnapshotReasonRepository.findAllActive.mockResolvedValue(mockReasons as any);

      const result = await service.getSnapshotReasons();

      expect(mockSnapshotReasonRepository.findAllActive).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(SnapshotReasonResponse);
      expect(result[0].id).toBe('reason-1');
      expect(result[1].id).toBe('reason-2');
    });

    it('should return empty array when no active reasons', async () => {
      mockSnapshotReasonRepository.findAllActive.mockResolvedValue([]);

      const result = await service.getSnapshotReasons();

      expect(result).toEqual([]);
    });
  });
});






