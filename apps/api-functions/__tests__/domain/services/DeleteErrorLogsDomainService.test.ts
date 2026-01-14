import { DeleteErrorLogsDomainService } from '../../../src/domain/services/DeleteErrorLogsDomainService';
import { IErrorLogRepository } from '../../../src/domain/interfaces/IErrorLogRepository';
import { NoErrorLogIdsProvidedError } from '../../../src/domain/errors/ErrorLogErrors';
import { createMockErrorLogRepository } from './domainServiceTestSetup';

describe('DeleteErrorLogsDomainService', () => {
  let service: DeleteErrorLogsDomainService;
  let mockErrorLogRepository: jest.Mocked<IErrorLogRepository>;

  beforeEach(() => {
    mockErrorLogRepository = createMockErrorLogRepository();
    service = new DeleteErrorLogsDomainService(mockErrorLogRepository);
  });

  describe('deleteErrorLog', () => {
    it('should delete single error log', async () => {
      mockErrorLogRepository.deleteById.mockResolvedValue(undefined);

      await service.deleteErrorLog('error-id');

      expect(mockErrorLogRepository.deleteById).toHaveBeenCalledWith('error-id');
    });
  });

  describe('deleteErrorLogs', () => {
    it('should delete single error log when array has one item', async () => {
      mockErrorLogRepository.deleteById.mockResolvedValue(undefined);

      await service.deleteErrorLogs(['error-id']);

      expect(mockErrorLogRepository.deleteById).toHaveBeenCalledWith('error-id');
      expect(mockErrorLogRepository.deleteMany).not.toHaveBeenCalled();
    });

    it('should delete multiple error logs', async () => {
      mockErrorLogRepository.deleteMany.mockResolvedValue(undefined);

      await service.deleteErrorLogs(['error-id-1', 'error-id-2']);

      expect(mockErrorLogRepository.deleteMany).toHaveBeenCalledWith(['error-id-1', 'error-id-2']);
    });

    it('should throw error when no ids provided', async () => {
      await expect(service.deleteErrorLogs([])).rejects.toThrow(NoErrorLogIdsProvidedError);
    });
  });

  describe('deleteAll', () => {
    it('should delete all error logs', async () => {
      mockErrorLogRepository.deleteAll.mockResolvedValue(undefined);

      await service.deleteAll();

      expect(mockErrorLogRepository.deleteAll).toHaveBeenCalled();
    });
  });
});

