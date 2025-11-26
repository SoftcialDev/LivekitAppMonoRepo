/**
 * @fileoverview Tests for GetErrorLogsDomainService
 * @description Tests for error log query domain service
 */

import { GetErrorLogsDomainService } from '../../../../shared/domain/services/GetErrorLogsDomainService';
import { IErrorLogRepository } from '../../../../shared/domain/interfaces/IErrorLogRepository';
import { ApiErrorLog } from '../../../../shared/domain/entities/ApiErrorLog';
import { ErrorSeverity } from '../../../../shared/domain/enums/ErrorSeverity';
import { ErrorSource } from '../../../../shared/domain/enums/ErrorSource';

describe('GetErrorLogsDomainService', () => {
  let service: GetErrorLogsDomainService;
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

    service = new GetErrorLogsDomainService(errorLogRepository);
  });

  describe('getErrorLogs', () => {
    it('should retrieve error logs with no filters', async () => {
      const mockErrorLogs = [
        new ApiErrorLog({
          id: 'error-123',
          severity: ErrorSeverity.High,
          source: ErrorSource.ChatService,
          errorName: 'Error',
          errorMessage: 'Test error 1',
          resolved: false,
          createdAt: new Date()
        }),
        new ApiErrorLog({
          id: 'error-456',
          severity: ErrorSeverity.Medium,
          source: ErrorSource.Database,
          errorName: 'Error',
          errorMessage: 'Test error 2',
          resolved: false,
          createdAt: new Date()
        })
      ];

      errorLogRepository.findMany.mockResolvedValue(mockErrorLogs);

      const result = await service.getErrorLogs();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('error-123');
      expect(result[1].id).toBe('error-456');
      expect(errorLogRepository.findMany).toHaveBeenCalledWith(undefined);
    });

    it('should retrieve error logs with filters', async () => {
      const mockErrorLogs = [
        new ApiErrorLog({
          id: 'error-123',
          severity: ErrorSeverity.High,
          source: ErrorSource.ChatService,
          errorName: 'Error',
          errorMessage: 'Test error',
          resolved: false,
          createdAt: new Date()
        })
      ];

      const filters = {
        source: ErrorSource.ChatService,
        severity: ErrorSeverity.High,
        resolved: false
      };

      errorLogRepository.findMany.mockResolvedValue(mockErrorLogs);

      const result = await service.getErrorLogs(filters);

      expect(result).toHaveLength(1);
      expect(errorLogRepository.findMany).toHaveBeenCalledWith(filters);
    });

    it('should return empty array when no error logs found', async () => {
      errorLogRepository.findMany.mockResolvedValue([]);

      const result = await service.getErrorLogs();

      expect(result).toHaveLength(0);
    });

    it('should handle repository errors', async () => {
      errorLogRepository.findMany.mockRejectedValue(new Error('Repository error'));

      await expect(service.getErrorLogs()).rejects.toThrow('Repository error');
    });
  });

  describe('countErrorLogs', () => {
    it('should count error logs with no filters', async () => {
      errorLogRepository.count = jest.fn().mockResolvedValue(10);

      const result = await service.countErrorLogs();

      expect(result).toBe(10);
      expect(errorLogRepository.count).toHaveBeenCalledWith(undefined);
    });

    it('should count error logs with filters', async () => {
      errorLogRepository.count = jest.fn().mockResolvedValue(5);

      const filters = {
        source: ErrorSource.ChatService,
        severity: ErrorSeverity.High
      };

      const result = await service.countErrorLogs(filters);

      expect(result).toBe(5);
      expect(errorLogRepository.count).toHaveBeenCalledWith(filters);
    });

    it('should handle repository errors', async () => {
      errorLogRepository.count = jest.fn().mockRejectedValue(new Error('Repository error'));

      await expect(service.countErrorLogs()).rejects.toThrow('Repository error');
    });
  });

  describe('getErrorLogById', () => {
    it('should retrieve error log by id', async () => {
      const mockErrorLog = new ApiErrorLog({
        id: 'error-123',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: new Date()
      });

      errorLogRepository.findById.mockResolvedValue(mockErrorLog);

      const result = await service.getErrorLogById('error-123');

      expect(result).toBeInstanceOf(ApiErrorLog);
      expect(result?.id).toBe('error-123');
      expect(errorLogRepository.findById).toHaveBeenCalledWith('error-123');
    });

    it('should return null when error log not found', async () => {
      errorLogRepository.findById.mockResolvedValue(null);

      const result = await service.getErrorLogById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      errorLogRepository.findById.mockRejectedValue(new Error('Repository error'));

      await expect(service.getErrorLogById('error-123')).rejects.toThrow('Repository error');
    });
  });

  describe('markAsResolved', () => {
    it('should mark error log as resolved', async () => {
      errorLogRepository.markAsResolved.mockResolvedValue();

      await service.markAsResolved('error-123', 'admin-123');

      expect(errorLogRepository.markAsResolved).toHaveBeenCalledWith('error-123', 'admin-123');
    });

    it('should handle repository errors', async () => {
      errorLogRepository.markAsResolved.mockRejectedValue(new Error('Repository error'));

      await expect(service.markAsResolved('error-123', 'admin-123')).rejects.toThrow(
        'Repository error'
      );
    });
  });
});

