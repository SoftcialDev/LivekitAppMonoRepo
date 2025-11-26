/**
 * @fileoverview Tests for DeleteErrorLogsDomainService
 * @description Tests for error log deletion domain service
 */

import { DeleteErrorLogsDomainService } from '../../../../shared/domain/services/DeleteErrorLogsDomainService';
import { IErrorLogRepository } from '../../../../shared/domain/interfaces/IErrorLogRepository';

describe('DeleteErrorLogsDomainService', () => {
  let service: DeleteErrorLogsDomainService;
  let errorLogRepository: jest.Mocked<IErrorLogRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    errorLogRepository = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      markAsResolved: jest.fn(),
      deleteById: jest.fn(),
      deleteMany: jest.fn()
    } as any;

    service = new DeleteErrorLogsDomainService(errorLogRepository);
  });

  describe('deleteErrorLog', () => {
    it('should delete a single error log', async () => {
      errorLogRepository.deleteById.mockResolvedValue();

      await service.deleteErrorLog('error-123');

      expect(errorLogRepository.deleteById).toHaveBeenCalledWith('error-123');
    });

    it('should handle repository errors', async () => {
      errorLogRepository.deleteById.mockRejectedValue(new Error('Repository error'));

      await expect(service.deleteErrorLog('error-123')).rejects.toThrow('Repository error');
    });
  });

  describe('deleteErrorLogs', () => {
    it('should delete single error log using deleteById', async () => {
      errorLogRepository.deleteById.mockResolvedValue();

      await service.deleteErrorLogs(['error-123']);

      expect(errorLogRepository.deleteById).toHaveBeenCalledWith('error-123');
      expect(errorLogRepository.deleteMany).not.toHaveBeenCalled();
    });

    it('should delete multiple error logs using deleteMany', async () => {
      errorLogRepository.deleteMany.mockResolvedValue();

      await service.deleteErrorLogs(['error-123', 'error-456', 'error-789']);

      expect(errorLogRepository.deleteMany).toHaveBeenCalledWith([
        'error-123',
        'error-456',
        'error-789'
      ]);
      expect(errorLogRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should throw error when ids array is empty', async () => {
      await expect(service.deleteErrorLogs([])).rejects.toThrow(
        'No error log IDs provided for deletion'
      );
    });

    it('should handle repository errors for single deletion', async () => {
      errorLogRepository.deleteById.mockRejectedValue(new Error('Repository error'));

      await expect(service.deleteErrorLogs(['error-123'])).rejects.toThrow('Repository error');
    });

    it('should handle repository errors for batch deletion', async () => {
      errorLogRepository.deleteMany.mockRejectedValue(new Error('Repository error'));

      await expect(service.deleteErrorLogs(['error-123', 'error-456'])).rejects.toThrow(
        'Repository error'
      );
    });
  });
});

