import { DeleteSnapshotReasonDomainService } from '../../../src/domain/services/DeleteSnapshotReasonDomainService';
import { ISnapshotReasonRepository } from '../../../src/domain/interfaces/ISnapshotReasonRepository';
import {
  SnapshotReasonNotFoundError,
  CannotDeleteOtherReasonError,
  CannotDeleteDefaultReasonError,
} from '../../../src/domain/errors/SnapshotErrors';
import { createMockSnapshotReasonRepository } from './domainServiceTestSetup';

describe('DeleteSnapshotReasonDomainService', () => {
  let service: DeleteSnapshotReasonDomainService;
  let mockSnapshotReasonRepository: jest.Mocked<ISnapshotReasonRepository>;

  beforeEach(() => {
    mockSnapshotReasonRepository = createMockSnapshotReasonRepository();
    service = new DeleteSnapshotReasonDomainService(mockSnapshotReasonRepository);
  });

  describe('deleteSnapshotReason', () => {
    it('should soft delete snapshot reason successfully', async () => {
      const id = 'reason-id';
      const existingReason = {
        id,
        code: 'REASON_CODE',
        isDefault: false,
      };

      mockSnapshotReasonRepository.findById.mockResolvedValue(existingReason as any);
      mockSnapshotReasonRepository.softDelete.mockResolvedValue(undefined);

      await service.deleteSnapshotReason(id);

      expect(mockSnapshotReasonRepository.findById).toHaveBeenCalledWith(id);
      expect(mockSnapshotReasonRepository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw error when reason not found', async () => {
      const id = 'non-existent';

      mockSnapshotReasonRepository.findById.mockResolvedValue(null);

      await expect(service.deleteSnapshotReason(id)).rejects.toThrow(SnapshotReasonNotFoundError);
      expect(mockSnapshotReasonRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should throw error when trying to delete OTHER reason', async () => {
      const id = 'reason-id';
      const existingReason = {
        id,
        code: 'OTHER',
        isDefault: false,
      };

      mockSnapshotReasonRepository.findById.mockResolvedValue(existingReason as any);

      await expect(service.deleteSnapshotReason(id)).rejects.toThrow(CannotDeleteOtherReasonError);
      expect(mockSnapshotReasonRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should throw error when trying to delete default reason', async () => {
      const id = 'reason-id';
      const existingReason = {
        id,
        code: 'DEFAULT_CODE',
        isDefault: true,
      };

      mockSnapshotReasonRepository.findById.mockResolvedValue(existingReason as any);

      await expect(service.deleteSnapshotReason(id)).rejects.toThrow(CannotDeleteDefaultReasonError);
      expect(mockSnapshotReasonRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});






