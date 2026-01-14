import { CreateSnapshotReasonDomainService } from '../../../src/domain/services/CreateSnapshotReasonDomainService';
import { ISnapshotReasonRepository } from '../../../src/domain/interfaces/ISnapshotReasonRepository';
import { CreateSnapshotReasonRequest } from '../../../src/domain/value-objects/CreateSnapshotReasonRequest';
import { SnapshotReasonResponse } from '../../../src/domain/value-objects/SnapshotReasonResponse';
import { SnapshotReasonAlreadyExistsError } from '../../../src/domain/errors';
import { createMockSnapshotReasonRepository } from './domainServiceTestSetup';

describe('CreateSnapshotReasonDomainService', () => {
  let service: CreateSnapshotReasonDomainService;
  let mockSnapshotReasonRepository: jest.Mocked<ISnapshotReasonRepository>;

  beforeEach(() => {
    mockSnapshotReasonRepository = createMockSnapshotReasonRepository();
    service = new CreateSnapshotReasonDomainService(mockSnapshotReasonRepository);
  });

  describe('createSnapshotReason', () => {
    it('should create snapshot reason successfully', async () => {
      const request = new CreateSnapshotReasonRequest('Test Reason', 'TEST_REASON', 1);
      const mockReason = {
        id: 'reason-id',
        label: 'Test Reason',
        code: 'TEST_REASON',
        isDefault: false,
        isActive: true,
        order: 1,
      };

      mockSnapshotReasonRepository.findByCode.mockResolvedValue(null);
      mockSnapshotReasonRepository.create.mockResolvedValue(mockReason as any);

      const result = await service.createSnapshotReason(request);

      expect(mockSnapshotReasonRepository.findByCode).toHaveBeenCalledWith('TEST_REASON');
      expect(mockSnapshotReasonRepository.create).toHaveBeenCalledWith({
        label: 'Test Reason',
        code: 'TEST_REASON',
        order: 1,
        isDefault: false,
      });
      expect(result).toBeInstanceOf(SnapshotReasonResponse);
      expect(result.id).toBe('reason-id');
    });

    it('should throw error when code already exists', async () => {
      const request = new CreateSnapshotReasonRequest('Test Reason', 'EXISTING_CODE', 1);
      const existingReason = {
        id: 'existing-id',
        code: 'EXISTING_CODE',
      };

      mockSnapshotReasonRepository.findByCode.mockResolvedValue(existingReason as any);

      await expect(service.createSnapshotReason(request)).rejects.toThrow(SnapshotReasonAlreadyExistsError);
      expect(mockSnapshotReasonRepository.create).not.toHaveBeenCalled();
    });
  });
});

