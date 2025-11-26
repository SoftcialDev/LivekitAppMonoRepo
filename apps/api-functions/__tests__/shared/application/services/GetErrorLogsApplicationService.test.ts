/**
 * @fileoverview Tests for GetErrorLogsApplicationService
 * @description Tests for error log query application service
 */

import { GetErrorLogsApplicationService } from '../../../../shared/application/services/GetErrorLogsApplicationService';
import { GetErrorLogsDomainService } from '../../../../shared/domain/services/GetErrorLogsDomainService';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { ApiErrorLog } from '../../../../shared/domain/entities/ApiErrorLog';
import { ErrorSeverity } from '../../../../shared/domain/enums/ErrorSeverity';
import { ErrorSource } from '../../../../shared/domain/enums/ErrorSource';
import { AuthError } from '../../../../shared/domain/errors/DomainError';
import { AuthErrorCode } from '../../../../shared/domain/errors/ErrorCodes';

describe('GetErrorLogsApplicationService', () => {
  let service: GetErrorLogsApplicationService;
  let getErrorLogsDomainService: jest.Mocked<GetErrorLogsDomainService>;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    getErrorLogsDomainService = {
      getErrorLogs: jest.fn(),
      getErrorLogById: jest.fn(),
      markAsResolved: jest.fn()
    } as any;

    userRepository = {
      findByEmail: jest.fn(),
      findByAzureAdObjectId: jest.fn()
    } as any;

    service = new GetErrorLogsApplicationService(getErrorLogsDomainService, userRepository);
  });

  describe('getErrorLogs', () => {
    it('should retrieve error logs for authorized user', async () => {
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

      getErrorLogsDomainService.getErrorLogs.mockResolvedValue(mockErrorLogs);
      getErrorLogsDomainService.countErrorLogs = jest.fn().mockResolvedValue(1);

      const result = await service.getErrorLogs('shanty.cerdas@example.com', {});

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(getErrorLogsDomainService.getErrorLogs).toHaveBeenCalledWith({});
    });

    it('should throw AuthError for unauthorized user', async () => {
      await expect(service.getErrorLogs('unauthorized@example.com', {})).rejects.toThrow(
        AuthError
      );

      await expect(service.getErrorLogs('unauthorized@example.com', {})).rejects.toThrow(
        'Access denied: Only authorized user can access error logs'
      );
    });

    it('should allow access for email containing shanty.cerdas', async () => {
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

      getErrorLogsDomainService.getErrorLogs.mockResolvedValue(mockErrorLogs);
      getErrorLogsDomainService.countErrorLogs = jest.fn().mockResolvedValue(1);

      // Test different email formats that should work
      const emails = [
        'shanty.cerdas@example.com',
        'shantycerdas@example.com',
        'test.shanty.cerdas@example.com',
        'SHANTY.CERDAS@EXAMPLE.COM'
      ];

      for (const email of emails) {
        const result = await service.getErrorLogs(email, {});
        expect(result.logs).toHaveLength(1);
      }
    });

    it('should throw AuthError for empty email', async () => {
      await expect(service.getErrorLogs('', {})).rejects.toThrow(AuthError);
    });

    it('should pass filters to domain service', async () => {
      const filters = {
        source: ErrorSource.ChatService,
        severity: ErrorSeverity.High
      };

      getErrorLogsDomainService.getErrorLogs.mockResolvedValue([]);
      getErrorLogsDomainService.countErrorLogs = jest.fn().mockResolvedValue(0);

      await service.getErrorLogs('shanty.cerdas@example.com', filters);

      expect(getErrorLogsDomainService.getErrorLogs).toHaveBeenCalledWith(filters);
      expect(getErrorLogsDomainService.countErrorLogs).toHaveBeenCalledWith(filters);
    });
  });

  describe('getErrorLogById', () => {
    it('should retrieve error log by id for authorized user', async () => {
      const mockErrorLog = new ApiErrorLog({
        id: 'error-123',
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        errorName: 'Error',
        errorMessage: 'Test error',
        resolved: false,
        createdAt: new Date()
      });

      getErrorLogsDomainService.getErrorLogById.mockResolvedValue(mockErrorLog);

      const result = await service.getErrorLogById('shanty.cerdas@example.com', 'error-123');

      expect(result).toBeInstanceOf(ApiErrorLog);
      expect(result?.id).toBe('error-123');
      expect(getErrorLogsDomainService.getErrorLogById).toHaveBeenCalledWith('error-123');
    });

    it('should throw AuthError for unauthorized user', async () => {
      await expect(
        service.getErrorLogById('unauthorized@example.com', 'error-123')
      ).rejects.toThrow(AuthError);
    });
  });

  describe('markAsResolved', () => {
    it('should mark error log as resolved for authorized user', async () => {
      getErrorLogsDomainService.markAsResolved.mockResolvedValue();

      await service.markAsResolved('shanty.cerdas@example.com', 'error-123', 'admin-123');

      expect(getErrorLogsDomainService.markAsResolved).toHaveBeenCalledWith(
        'error-123',
        'admin-123'
      );
    });

    it('should throw AuthError for unauthorized user', async () => {
      await expect(
        service.markAsResolved('unauthorized@example.com', 'error-123', 'admin-123')
      ).rejects.toThrow(AuthError);
    });
  });
});

