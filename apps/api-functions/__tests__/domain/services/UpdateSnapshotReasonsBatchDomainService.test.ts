import { UpdateSnapshotReasonsBatchDomainService } from '../../../src/domain/services/UpdateSnapshotReasonsBatchDomainService';
import { ISnapshotReasonRepository } from '../../../src/domain/interfaces/ISnapshotReasonRepository';
import { SnapshotReasonNotFoundError, CannotDeactivateOtherReasonError, CannotDeactivateDefaultReasonError } from '../../../src/domain/errors/SnapshotErrors';
import { createMockSnapshotReasonRepository } from './domainServiceTestSetup';

describe('UpdateSnapshotReasonsBatchDomainService', () => {
  let service: UpdateSnapshotReasonsBatchDomainService;
  let mockSnapshotReasonRepository: jest.Mocked<ISnapshotReasonRepository>;

  beforeEach(() => {
    mockSnapshotReasonRepository = createMockSnapshotReasonRepository();
    service = new UpdateSnapshotReasonsBatchDomainService(mockSnapshotReasonRepository);
  });

  describe('updateSnapshotReasonsBatch', () => {
    it('should update multiple snapshot reasons successfully', async () => {
      const reasons = [
        { id: 'reason-1', label: 'Updated Label 1', order: 1 },
        { id: 'reason-2', label: 'Updated Label 2', order: 2 },
      ];

      mockSnapshotReasonRepository.findById
        .mockResolvedValueOnce({ id: 'reason-1', code: 'REASON_1', isDefault: false } as any)
        .mockResolvedValueOnce({ id: 'reason-2', code: 'REASON_2', isDefault: false } as any);
      mockSnapshotReasonRepository.updateBatch.mockResolvedValue(undefined);

      await service.updateSnapshotReasonsBatch(reasons);

      expect(mockSnapshotReasonRepository.updateBatch).toHaveBeenCalledWith(reasons);
    });

    it('should throw error when reason not found', async () => {
      const reasons = [
        { id: 'non-existent', label: 'Label' },
      ];

      mockSnapshotReasonRepository.findById.mockResolvedValue(null);

      await expect(service.updateSnapshotReasonsBatch(reasons)).rejects.toThrow(SnapshotReasonNotFoundError);
    });

    it('should throw error when trying to deactivate OTHER reason', async () => {
      const reasons = [
        { id: 'reason-1', isActive: false },
      ];

      mockSnapshotReasonRepository.findById.mockResolvedValue({
        id: 'reason-1',
        code: 'OTHER',
        isDefault: false,
      } as any);

      await expect(service.updateSnapshotReasonsBatch(reasons)).rejects.toThrow(CannotDeactivateOtherReasonError);
    });

    it('should throw error when trying to deactivate default reason', async () => {
      const reasons = [
        { id: 'reason-1', isActive: false },
      ];

      mockSnapshotReasonRepository.findById.mockResolvedValue({
        id: 'reason-1',
        code: 'DEFAULT_CODE',
        isDefault: true,
      } as any);

      await expect(service.updateSnapshotReasonsBatch(reasons)).rejects.toThrow(CannotDeactivateDefaultReasonError);
    });
  });
});





