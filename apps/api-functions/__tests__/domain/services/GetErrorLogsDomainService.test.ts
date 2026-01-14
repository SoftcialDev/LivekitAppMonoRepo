import { GetErrorLogsDomainService } from '../../../src/domain/services/GetErrorLogsDomainService';
import { IErrorLogRepository } from '../../../src/domain/interfaces/IErrorLogRepository';
import { ApiErrorLog } from '../../../src/domain/entities/ApiErrorLog';
import { ErrorSeverity } from '../../../src/domain/enums/ErrorSeverity';
import { ErrorSource } from '../../../src/domain/enums/ErrorSource';
import { createMockErrorLogRepository } from './domainServiceTestSetup';

describe('GetErrorLogsDomainService', () => {
  let service: GetErrorLogsDomainService;
  let mockErrorLogRepository: jest.Mocked<IErrorLogRepository>;

  beforeEach(() => {
    mockErrorLogRepository = createMockErrorLogRepository();
    service = new GetErrorLogsDomainService(mockErrorLogRepository);
  });

  describe('getErrorLogs', () => {
    it('should return error logs successfully', async () => {
      const params = {
        limit: 10,
        offset: 0,
      };
      const mockErrorLog = new ApiErrorLog({
        id: 'error-id',
        severity: ErrorSeverity.Medium,
        source: ErrorSource.Database,
        endpoint: '/api/test',
        functionName: 'testFunction',
        errorName: 'Error',
        errorMessage: 'Test error',
        stackTrace: 'stack trace',
        httpStatusCode: 500,
        userId: 'user-id',
        userEmail: 'user@example.com',
        requestId: 'request-id',
        context: {},
        resolved: false,
        resolvedAt: null,
        resolvedBy: null,
        createdAt: new Date(),
      } as any);

      mockErrorLogRepository.findMany.mockResolvedValue([mockErrorLog]);

      const result = await service.getErrorLogs(params);

      expect(mockErrorLogRepository.findMany).toHaveBeenCalledWith(params);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('error-id');
    });

    it('should return empty array when no logs found', async () => {
      mockErrorLogRepository.findMany.mockResolvedValue([]);

      const result = await service.getErrorLogs();

      expect(result).toEqual([]);
    });
  });

  describe('countErrorLogs', () => {
    it('should return count of error logs', async () => {
      const params = {
        severity: ErrorSeverity.High,
      };

      mockErrorLogRepository.count.mockResolvedValue(5);

      const result = await service.countErrorLogs(params);

      expect(mockErrorLogRepository.count).toHaveBeenCalledWith(params);
      expect(result).toBe(5);
    });
  });

  describe('getErrorLogById', () => {
    it('should return error log by id', async () => {
      const mockErrorLog = new ApiErrorLog({
        id: 'error-id',
        severity: ErrorSeverity.Medium,
        source: ErrorSource.Database,
        errorMessage: 'Test error',
        createdAt: new Date(),
        resolved: false,
        resolvedAt: null,
        resolvedBy: null,
      } as any);

      mockErrorLogRepository.findById.mockResolvedValue(mockErrorLog);

      const result = await service.getErrorLogById('error-id');

      expect(mockErrorLogRepository.findById).toHaveBeenCalledWith('error-id');
      expect(result).toBe(mockErrorLog);
    });

    it('should return null when error log not found', async () => {
      mockErrorLogRepository.findById.mockResolvedValue(null);

      const result = await service.getErrorLogById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('markAsResolved', () => {
    it('should mark error log as resolved', async () => {
      mockErrorLogRepository.markAsResolved.mockResolvedValue(undefined);

      await service.markAsResolved('error-id', 'resolver-id');

      expect(mockErrorLogRepository.markAsResolved).toHaveBeenCalledWith('error-id', 'resolver-id');
    });
  });
});

