import { ErrorLogger } from '../../../src/utils/error/ErrorLogger';
import { IErrorLogService } from '../../../src/domain/interfaces/IErrorLogService';
import { ErrorContext } from '../../../src/domain/types';
import { ErrorClassification } from '../../../src/domain/types/ErrorTypes';
import { ErrorSource } from '../../../src/domain/enums/ErrorSource';
import { ErrorSeverity } from '../../../src/domain/enums/ErrorSeverity';
import { AuthError, ValidationError, MessagingError } from '../../../src/domain/errors';

describe('ErrorLogger', () => {
  let mockErrorLogService: jest.Mocked<IErrorLogService>;
  let errorLogger: ErrorLogger;

  beforeEach(() => {
    mockErrorLogService = {
      logError: jest.fn().mockResolvedValue(undefined),
    } as any;

    errorLogger = new ErrorLogger(mockErrorLogService);
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should not log when shouldLog is false', async () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        endpoint: '/api/test',
        functionName: 'TestFunction',
      };
      const classification: ErrorClassification = {
        type: 'expected' as any,
        statusCode: 400,
        shouldLog: false,
        severity: ErrorSeverity.Medium,
      };

      await errorLogger.log(error, context, classification);

      expect(mockErrorLogService.logError).not.toHaveBeenCalled();
    });

    it('should log error with full context', async () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        endpoint: '/api/test',
        functionName: 'TestFunction',
        userId: 'user-1',
        method: 'POST',
        url: 'https://example.com/api/test',
        invocationId: 'invocation-123',
      };
      const classification: ErrorClassification = {
        type: 'expected' as any,
        statusCode: 400,
        shouldLog: true,
        severity: ErrorSeverity.Medium,
      };

      await errorLogger.log(error, context, classification);

      expect(mockErrorLogService.logError).toHaveBeenCalledWith({
        source: ErrorSource.Validation,
        endpoint: '/api/test',
        functionName: 'TestFunction',
        error,
        userId: 'user-1',
        httpStatusCode: 400,
        severity: ErrorSeverity.Medium,
        context: {
          method: 'POST',
          url: 'https://example.com/api/test',
          invocationId: 'invocation-123',
        },
      });
    });

    it('should determine error source from AuthError', async () => {
      const error = new AuthError('Auth failed', 401);
      const context: ErrorContext = {
        endpoint: '/api/test',
        functionName: 'TestFunction',
      };
      const classification: ErrorClassification = {
        type: 'expected' as any,
        statusCode: 401,
        shouldLog: true,
        severity: ErrorSeverity.Medium,
      };

      await errorLogger.log(error, context, classification);

      expect(mockErrorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          source: ErrorSource.Authentication,
        })
      );
    });

    it('should determine error source from ValidationError', async () => {
      const error = new ValidationError('Validation failed', 400);
      const context: ErrorContext = {
        endpoint: '/api/test',
        functionName: 'TestFunction',
      };
      const classification: ErrorClassification = {
        type: 'expected' as any,
        statusCode: 400,
        shouldLog: true,
        severity: ErrorSeverity.Medium,
      };

      await errorLogger.log(error, context, classification);

      expect(mockErrorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          source: ErrorSource.Validation,
        })
      );
    });

    it('should determine error source from MessagingError', async () => {
      const error = new MessagingError('Messaging failed', 500);
      const context: ErrorContext = {
        endpoint: '/api/test',
        functionName: 'TestFunction',
      };
      const classification: ErrorClassification = {
        type: 'unexpected' as any,
        statusCode: 500,
        shouldLog: true,
        severity: ErrorSeverity.Critical,
      };

      await errorLogger.log(error, context, classification);

      expect(mockErrorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          source: ErrorSource.WebPubSub,
        })
      );
    });

    it('should determine error source from error type', async () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        endpoint: '/api/test',
        functionName: 'TestFunction',
      };
      const classification: ErrorClassification = {
        type: 'expected' as any,
        statusCode: 400,
        shouldLog: true,
        severity: ErrorSeverity.Medium,
      };

      await errorLogger.log(error, context, classification);

      expect(mockErrorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          source: ErrorSource.Validation,
        })
      );
    });

    it('should normalize non-Error to Error', async () => {
      const error = 'String error';
      const context: ErrorContext = {
        endpoint: '/api/test',
        functionName: 'TestFunction',
      };
      const classification: ErrorClassification = {
        type: 'unexpected' as any,
        statusCode: 500,
        shouldLog: true,
        severity: ErrorSeverity.Critical,
      };

      await errorLogger.log(error, context, classification);

      expect(mockErrorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
        })
      );
      const loggedError = mockErrorLogService.logError.mock.calls[0][0].error as Error;
      expect(loggedError.message).toBe('String error');
    });

    it('should handle logging errors silently', async () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        endpoint: '/api/test',
        functionName: 'TestFunction',
      };
      const classification: ErrorClassification = {
        type: 'unexpected' as any,
        statusCode: 500,
        shouldLog: true,
        severity: ErrorSeverity.Critical,
      };

      mockErrorLogService.logError.mockRejectedValue(new Error('Logging failed'));

      await expect(errorLogger.log(error, context, classification)).resolves.not.toThrow();
    });
  });
});

