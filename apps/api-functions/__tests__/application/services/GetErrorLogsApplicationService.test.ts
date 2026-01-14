import { GetErrorLogsApplicationService } from '../../../src/application/services/GetErrorLogsApplicationService';
import { GetErrorLogsDomainService } from '../../../src/domain/services/GetErrorLogsDomainService';
import { ApiErrorLog } from '../../../src/domain/entities/ApiErrorLog';
import { ErrorLogQueryParams } from '../../../src/domain/types/ErrorLogTypes';
import { ErrorSeverity } from '../../../src/domain/enums/ErrorSeverity';
import { ErrorSource } from '../../../src/domain/enums/ErrorSource';

describe('GetErrorLogsApplicationService', () => {
  let service: GetErrorLogsApplicationService;
  let mockDomainService: jest.Mocked<GetErrorLogsDomainService>;

  beforeEach(() => {
    mockDomainService = {
      getErrorLogs: jest.fn(),
      countErrorLogs: jest.fn(),
      getErrorLogById: jest.fn(),
      markAsResolved: jest.fn(),
    } as any;

    service = new GetErrorLogsApplicationService(mockDomainService);
  });

  describe('getErrorLogs', () => {
    it('should successfully get error logs with params', async () => {
      const params: ErrorLogQueryParams = {
        limit: 10,
        offset: 0,
      };
      const mockLogs: ApiErrorLog[] = [
        new ApiErrorLog({
          id: 'log-1',
          severity: ErrorSeverity.Medium,
          source: ErrorSource.Unknown,
          errorMessage: 'Error message',
          errorName: 'ErrorName',
          stackTrace: 'Error stack',
          resolved: false,
          resolvedAt: null,
          resolvedBy: null,
          createdAt: new Date(),
        }),
      ];

      mockDomainService.getErrorLogs.mockResolvedValue(mockLogs);
      mockDomainService.countErrorLogs.mockResolvedValue(1);

      const result = await service.getErrorLogs(params);

      expect(mockDomainService.getErrorLogs).toHaveBeenCalledWith(params);
      expect(mockDomainService.countErrorLogs).toHaveBeenCalledWith(params);
      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(1);
    });

    it('should successfully get error logs without params', async () => {
      const mockLogs: ApiErrorLog[] = [];
      mockDomainService.getErrorLogs.mockResolvedValue(mockLogs);
      mockDomainService.countErrorLogs.mockResolvedValue(0);

      const result = await service.getErrorLogs();

      expect(mockDomainService.getErrorLogs).toHaveBeenCalledWith(undefined);
      expect(mockDomainService.countErrorLogs).toHaveBeenCalledWith(undefined);
      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(0);
    });
  });

  describe('getErrorLogById', () => {
    it('should successfully get error log by id', async () => {
      const id = 'log-1';
      const mockLog = new ApiErrorLog({
        id,
        severity: ErrorSeverity.Medium,
        source: ErrorSource.Unknown,
        errorMessage: 'Error message',
        errorName: 'ErrorName',
        stackTrace: 'Error stack',
        resolved: false,
        resolvedAt: null,
        resolvedBy: null,
        createdAt: new Date(),
      });

      mockDomainService.getErrorLogById.mockResolvedValue(mockLog);

      const result = await service.getErrorLogById(id);

      expect(mockDomainService.getErrorLogById).toHaveBeenCalledWith(id);
      expect(result).toBe(mockLog);
    });

    it('should return null when error log not found', async () => {
      const id = 'non-existent';
      mockDomainService.getErrorLogById.mockResolvedValue(null);

      const result = await service.getErrorLogById(id);

      expect(mockDomainService.getErrorLogById).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });
  });

  describe('markAsResolved', () => {
    it('should successfully mark error log as resolved', async () => {
      const id = 'log-1';
      const callerId = 'caller-id';

      mockDomainService.markAsResolved.mockResolvedValue(undefined);

      await service.markAsResolved(id, callerId);

      expect(mockDomainService.markAsResolved).toHaveBeenCalledWith(id, callerId);
    });
  });
});

