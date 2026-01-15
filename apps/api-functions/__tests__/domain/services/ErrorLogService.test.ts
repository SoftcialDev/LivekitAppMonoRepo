import { ErrorLogService } from '../../../src/domain/services/ErrorLogService';
import { IErrorLogRepository } from '../../../src/domain/interfaces/IErrorLogRepository';
import { ErrorSeverity } from '../../../src/domain/enums/ErrorSeverity';
import { ErrorSource } from '../../../src/domain/enums/ErrorSource';
import { createMockErrorLogRepository } from './domainServiceTestSetup';

jest.mock('../../../src/infrastructure/container/ServiceContainer', () => ({
  ServiceContainer: {
    getInstance: jest.fn(() => ({
      resolve: jest.fn(),
    })),
    initialized: true,
  },
}));

describe('ErrorLogService', () => {
  let service: ErrorLogService;
  let mockErrorLogRepository: jest.Mocked<IErrorLogRepository>;

  beforeEach(() => {
    mockErrorLogRepository = createMockErrorLogRepository();
    service = new ErrorLogService(mockErrorLogRepository);
  });

  describe('logError', () => {
    it('should log error successfully', async () => {
      const error = new Error('Test error');
      const data = {
        source: ErrorSource.Database,
        endpoint: '/api/test',
        functionName: 'testFunction',
        error,
      };

      mockErrorLogRepository.create.mockResolvedValue({
        id: 'error-id',
        severity: ErrorSeverity.Critical,
        source: ErrorSource.Database,
        errorMessage: 'Test error',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.logError(data);

      expect(mockErrorLogRepository.create).toHaveBeenCalled();
      expect(mockErrorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          source: ErrorSource.Database,
          errorMessage: 'Test error',
        })
      );
    });

    it('should determine severity automatically', async () => {
      const error = new Error('Critical error');
      error.name = 'DatabaseError';
      const data = {
        source: ErrorSource.Database,
        error,
      };

      mockErrorLogRepository.create.mockResolvedValue({
        id: 'error-id',
        severity: ErrorSeverity.Critical,
        source: ErrorSource.Database,
        errorMessage: 'Critical error',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.logError(data);

      expect(mockErrorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ErrorSeverity.Critical,
        })
      );
    });

    it('should handle string errors', async () => {
      const data = {
        source: ErrorSource.Validation,
        error: 'String error message',
      };

      mockErrorLogRepository.create.mockResolvedValue({
        id: 'error-id',
        severity: ErrorSeverity.Medium,
        source: ErrorSource.Validation,
        errorMessage: 'String error message',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.logError(data);

      expect(mockErrorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          errorMessage: 'String error message',
        })
      );
    });

    it('should not throw when repository fails', async () => {
      const data = {
        source: ErrorSource.Database,
        error: new Error('Test error'),
      };

      mockErrorLogRepository.create.mockRejectedValue(new Error('Repository error'));

      await expect(service.logError(data)).resolves.not.toThrow();
    });
  });

  describe('logChatServiceError', () => {
    it('should log chat service error successfully', async () => {
      const error = new Error('Chat service error');
      const data = {
        endpoint: '/api/chat',
        functionName: 'sendMessage',
        error,
        chatId: 'chat-id',
      };

      mockErrorLogRepository.create.mockResolvedValue({
        id: 'error-id',
        severity: ErrorSeverity.Medium,
        source: ErrorSource.ChatService,
        errorMessage: 'Chat service error',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.logChatServiceError(data);

      expect(mockErrorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          source: ErrorSource.ChatService,
          context: expect.objectContaining({
            chatId: 'chat-id',
          }),
        })
      );
    });
  });

  describe('extractErrorDetails with non-serializable error', () => {
    it('should handle error that cannot be JSON stringified', async () => {
      const circularError = {
        message: 'Circular error',
      };
      (circularError as any).self = circularError;

      const data = {
        source: ErrorSource.Validation,
        error: circularError,
      };

      mockErrorLogRepository.create.mockResolvedValue({
        id: 'error-id',
        severity: ErrorSeverity.Medium,
        source: ErrorSource.Validation,
        errorMessage: expect.any(String),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.logError(data);

      expect(mockErrorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          errorMessage: expect.any(String),
        })
      );
    });
  });

  describe('determineSeverity', () => {
    it('should return Medium for timeout errors', async () => {
      const error = new Error('Request timeout');
      error.name = 'TimeoutError';
      const data = {
        source: ErrorSource.API,
        error,
      };

      mockErrorLogRepository.create.mockResolvedValue({
        id: 'error-id',
        severity: ErrorSeverity.Medium,
        source: ErrorSource.API,
        errorMessage: 'Request timeout',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.logError(data);

      expect(mockErrorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ErrorSeverity.Medium,
        })
      );
    });

    it('should return Medium for network errors', async () => {
      const error = new Error('Network error');
      error.name = 'NetworkError';
      const data = {
        source: ErrorSource.API,
        error,
      };

      mockErrorLogRepository.create.mockResolvedValue({
        id: 'error-id',
        severity: ErrorSeverity.Medium,
        source: ErrorSource.API,
        errorMessage: 'Network error',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.logError(data);

      expect(mockErrorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ErrorSeverity.Medium,
        })
      );
    });

    it('should return High for authentication errors', async () => {
      const error = new Error('Unauthorized');
      error.name = 'AuthenticationError';
      const data = {
        source: ErrorSource.API,
        error,
      };

      mockErrorLogRepository.create.mockResolvedValue({
        id: 'error-id',
        severity: ErrorSeverity.High,
        source: ErrorSource.API,
        errorMessage: 'Unauthorized',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.logError(data);

      expect(mockErrorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ErrorSeverity.High,
        })
      );
    });

    it('should return High for Authentication source', async () => {
      const error = new Error('Some error');
      const data = {
        source: ErrorSource.Authentication,
        error,
      };

      mockErrorLogRepository.create.mockResolvedValue({
        id: 'error-id',
        severity: ErrorSeverity.High,
        source: ErrorSource.Authentication,
        errorMessage: 'Some error',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.logError(data);

      expect(mockErrorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ErrorSeverity.High,
        })
      );
    });

    it('should return Critical for errors with critical message', async () => {
      const error = new Error('Critical system failure');
      const data = {
        source: ErrorSource.API,
        error,
      };

      mockErrorLogRepository.create.mockResolvedValue({
        id: 'error-id',
        severity: ErrorSeverity.Critical,
        source: ErrorSource.API,
        errorMessage: 'Critical system failure',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.logError(data);

      expect(mockErrorLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ErrorSeverity.Critical,
        })
      );
    });
  });
});

