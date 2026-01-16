import { UpdateSnapshotReasonDomainService } from '../../../src/domain/services/UpdateSnapshotReasonDomainService';
import { ISnapshotReasonRepository } from '../../../src/domain/interfaces/ISnapshotReasonRepository';
import { SnapshotReasonResponse } from '../../../src/domain/value-objects/SnapshotReasonResponse';
import {
  SnapshotReasonNotFoundError,
  SnapshotReasonAlreadyExistsError,
  CannotDeactivateOtherReasonError,
  CannotDeactivateDefaultReasonError,
} from '../../../src/domain/errors/SnapshotErrors';
import { createMockSnapshotReasonRepository } from './domainServiceTestSetup';

describe('UpdateSnapshotReasonDomainService', () => {
  let service: UpdateSnapshotReasonDomainService;
  let mockSnapshotReasonRepository: jest.Mocked<ISnapshotReasonRepository>;

  beforeEach(() => {
    mockSnapshotReasonRepository = createMockSnapshotReasonRepository();
    service = new UpdateSnapshotReasonDomainService(mockSnapshotReasonRepository);
  });

  describe('updateSnapshotReason', () => {
    it('should update snapshot reason successfully', async () => {
      const id = 'reason-id';
      const existingReason = {
        id,
        label: 'Old Label',
        code: 'OLD_CODE',
        isDefault: false,
        isActive: true,
        order: 1,
      };
      const updatedReason = {
        id,
        label: 'New Label',
        code: 'OLD_CODE',
        isDefault: false,
        isActive: true,
        order: 2,
      };

      mockSnapshotReasonRepository.findById.mockResolvedValue(existingReason as any);
      mockSnapshotReasonRepository.update.mockResolvedValue(updatedReason as any);

      const result = await service.updateSnapshotReason(id, { label: 'New Label', order: 2 });

      expect(mockSnapshotReasonRepository.findById).toHaveBeenCalledWith(id);
      expect(mockSnapshotReasonRepository.update).toHaveBeenCalledWith(id, { label: 'New Label', order: 2 });
      expect(result).toBeInstanceOf(SnapshotReasonResponse);
      expect(result.label).toBe('New Label');
    });

    it('should throw error when reason not found', async () => {
      const id = 'non-existent';

      mockSnapshotReasonRepository.findById.mockResolvedValue(null);

      await expect(service.updateSnapshotReason(id, { label: 'New Label' })).rejects.toThrow(
        SnapshotReasonNotFoundError
      );
    });

    it('should throw error when trying to deactivate OTHER reason', async () => {
      const id = 'reason-id';
      const existingReason = {
        id,
        code: 'OTHER',
        isDefault: false,
        isActive: true,
      };

      mockSnapshotReasonRepository.findById.mockResolvedValue(existingReason as any);

      await expect(service.updateSnapshotReason(id, { isActive: false })).rejects.toThrow(
        CannotDeactivateOtherReasonError
      );
    });

    it('should throw error when trying to deactivate default reason', async () => {
      const id = 'reason-id';
      const existingReason = {
        id,
        code: 'DEFAULT_CODE',
        isDefault: true,
        isActive: true,
      };

      mockSnapshotReasonRepository.findById.mockResolvedValue(existingReason as any);

      await expect(service.updateSnapshotReason(id, { isActive: false })).rejects.toThrow(
        CannotDeactivateDefaultReasonError
      );
    });

    it('should throw error when new code already exists', async () => {
      const id = 'reason-id';
      const existingReason = {
        id,
        code: 'OLD_CODE',
        isDefault: false,
        isActive: true,
      };
      const codeExists = {
        id: 'other-id',
        code: 'NEW_CODE',
      };

      mockSnapshotReasonRepository.findById.mockResolvedValue(existingReason as any);
      mockSnapshotReasonRepository.findByCode.mockResolvedValue(codeExists as any);

      await expect(service.updateSnapshotReason(id, { code: 'NEW_CODE' })).rejects.toThrow(
        SnapshotReasonAlreadyExistsError
      );
    });

    it('should allow updating code to same value', async () => {
      const id = 'reason-id';
      const existingReason = {
        id,
        code: 'SAME_CODE',
        isDefault: false,
        isActive: true,
      };
      const updatedReason = {
        id,
        code: 'SAME_CODE',
        label: 'Updated Label',
      };

      mockSnapshotReasonRepository.findById.mockResolvedValue(existingReason as any);
      mockSnapshotReasonRepository.update.mockResolvedValue(updatedReason as any);

      await service.updateSnapshotReason(id, { code: 'SAME_CODE', label: 'Updated Label' });

      expect(mockSnapshotReasonRepository.findByCode).not.toHaveBeenCalled();
    });
  });
});



