/**
 * @fileoverview Tests for ErrorLogService
 * @description Tests for error logging domain service
 */

import { ErrorLogService } from '../../../../shared/domain/services/ErrorLogService';
import { IErrorLogRepository } from '../../../../shared/domain/interfaces/IErrorLogRepository';
import { ErrorSeverity } from '../../../../shared/domain/enums/ErrorSeverity';
import { ErrorSource } from '../../../../shared/domain/enums/ErrorSource';
import { ApiErrorLog } from '../../../../shared/domain/entities/ApiErrorLog';

describe('ErrorLogService', () => {
  let service: ErrorLogService;
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

    service = new ErrorLogService(errorLogRepository);
  });

  describe('logError', () => {
    it('should log error with Error instance', async () => {
      const error = new Error('Test error message');
      error.stack = 'Error: Test error message\n    at test.ts:1:1';

      const mockErrorLog = new ApiErrorLog({
        id: 'error-123',
        severity: ErrorSeverity.Medium,
        source: ErrorSource.ChatService,
        endpoint: '/api/test',
        functionName: 'testFunction',
        errorName: 'Error',
        errorMessage: 'Test error message',
        stackTrace: 'Error: Test error message\n    at test.ts:1:1',
        httpStatusCode: 500,
        userId: 'user-123',
        requestId: 'req-123',
        context: { test: 'data' },
        resolved: false,
        createdAt: new Date()
      });

      errorLogRepository.create.mockResolvedValue(mockErrorLog);

      await service.logError({
        source: ErrorSource.ChatService,
        endpoint: '/api/test',
        functionName: 'testFunction',
        error,
        userId: 'user-123',
        requestId: 'req-123',
        context: { test: 'data' },
        httpStatusCode: 500
      });

      expect(errorLogRepository.create).toHaveBeenCalledWith({
        severity: ErrorSeverity.Medium,
        source: ErrorSource.ChatService,
        endpoint: '/api/test',
        functionName: 'testFunction',
        errorName: 'Error',
        errorMessage: 'Test error message',
        stackTrace: 'Error: Test error message\n    at test.ts:1:1',
        httpStatusCode: 500,
        userId: 'user-123',
        requestId: 'req-123',
        context: { test: 'data' }
      });
    });

    it('should log error with string', async () => {
      const error = 'String error message';

      errorLogRepository.create.mockResolvedValue({} as ApiErrorLog);

      await service.logError({
        source: ErrorSource.Database,
        error
      });

      expect(errorLogRepository.create).toHaveBeenCalledWith({
        severity: ErrorSeverity.Critical,
        source: ErrorSource.Database,
        endpoint: undefined,
        functionName: undefined,
        errorName: undefined,
        errorMessage: 'String error message',
        stackTrace: undefined,
        httpStatusCode: undefined,
        userId: undefined,
        requestId: undefined,
        context: undefined
      });
    });

    it('should log error with custom severity', async () => {
      const error = new Error('Test error');

      errorLogRepository.create.mockResolvedValue({} as ApiErrorLog);

      await service.logError({
        severity: ErrorSeverity.High,
        source: ErrorSource.Validation,
        error
      });

      expect(errorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ErrorSeverity.High,
          source: ErrorSource.Validation
        })
      );
    });

    it('should determine severity from source when not provided', async () => {
      const error = new Error('Test error');

      errorLogRepository.create.mockResolvedValue({} as ApiErrorLog);

      await service.logError({
        source: ErrorSource.Database,
        error
      });

      expect(errorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ErrorSeverity.Critical
        })
      );
    });

    it('should handle repository errors gracefully', async () => {
      const error = new Error('Test error');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      errorLogRepository.create.mockRejectedValue(new Error('Repository error'));

      await service.logError({
        source: ErrorSource.ChatService,
        error
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle unknown error types', async () => {
      const error = { custom: 'error object' };

      errorLogRepository.create.mockResolvedValue({} as ApiErrorLog);

      await service.logError({
        source: ErrorSource.Unknown,
        error
      });

      expect(errorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          errorMessage: expect.stringContaining('custom')
        })
      );
    });
  });

  describe('logChatServiceError', () => {
    it('should log chat service error with all context', async () => {
      const error = new Error('Chat service error');

      errorLogRepository.create.mockResolvedValue({} as ApiErrorLog);

      await service.logChatServiceError({
        endpoint: '/api/snapshots',
        functionName: 'notifySnapshotReport',
        error,
        userId: 'user-123',
        chatId: 'chat-123',
        context: { psoEmail: 'pso@example.com' }
      });

      expect(errorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          source: ErrorSource.ChatService,
          endpoint: '/api/snapshots',
          functionName: 'notifySnapshotReport',
          userId: 'user-123',
          context: {
            psoEmail: 'pso@example.com',
            chatId: 'chat-123'
          }
        })
      );
    });

    it('should log chat service error without optional fields', async () => {
      const error = new Error('Chat service error');

      errorLogRepository.create.mockResolvedValue({} as ApiErrorLog);

      await service.logChatServiceError({
        endpoint: '/api/test',
        functionName: 'testFunction',
        error
      });

      expect(errorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          source: ErrorSource.ChatService,
          endpoint: '/api/test',
          functionName: 'testFunction',
          userId: undefined,
          context: {
            chatId: undefined
          }
        })
      );
    });
  });
});

