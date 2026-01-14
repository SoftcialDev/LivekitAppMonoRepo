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
});

