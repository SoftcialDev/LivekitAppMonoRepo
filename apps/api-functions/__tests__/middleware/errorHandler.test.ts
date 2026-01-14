import { Context } from '@azure/functions';
import { withErrorHandler, ExpectedError } from '../../src/middleware/errorHandler';
import { ServiceContainer } from '../../src/infrastructure/container/ServiceContainer';
import { ErrorLogger } from '../../src/utils/error/ErrorLogger';
import { DomainError } from '../../src/domain/errors';
import { TestUtils } from '../setup';

const mockLog = jest.fn().mockResolvedValue(undefined);

jest.mock('../../src/infrastructure/container/ServiceContainer');
jest.mock('../../src/utils/error/ErrorLogger', () => ({
  ErrorLogger: jest.fn().mockImplementation(() => ({
    log: mockLog,
  })),
}));
jest.mock('../../src/config', () => ({
  config: {
    node_env: 'test',
  },
}));

class TestDomainError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

describe('errorHandler middleware', () => {
  let mockContext: Context;
  let mockHandler: jest.Mock;
  let mockServiceContainer: jest.Mocked<ServiceContainer>;
  let mockErrorLogService: any;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    mockHandler = jest.fn();
    mockErrorLogService = {
      logError: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockServiceContainer = {
      getInstance: jest.fn().mockReturnThis(),
      initialize: jest.fn(),
      resolve: jest.fn().mockReturnValue(mockErrorLogService),
    } as any;

    (ServiceContainer.getInstance as jest.Mock) = jest.fn().mockReturnValue(mockServiceContainer);
    (ServiceContainer as any).initialized = false;

    jest.clearAllMocks();
  });

  describe('withErrorHandler', () => {
    it('should call handler successfully', async () => {
      mockHandler.mockResolvedValue(undefined);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockHandler).toHaveBeenCalledWith(mockContext);
      expect(mockContext.res).toEqual({});
    });

    it('should handle ExpectedError with default status code', async () => {
      const error = new ExpectedError('Expected error');
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.res?.status).toBe(400);
      expect(mockContext.res?.body).toEqual({ error: 'Expected error' });
    });

    it('should handle ExpectedError with custom status code', async () => {
      const error = new ExpectedError('Not found', 404);
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.res?.status).toBe(404);
      expect(mockContext.res?.body).toEqual({ error: 'Not found' });
    });

    it('should handle DomainError', async () => {
      const error = new TestDomainError('Domain error');
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.res?.status).toBe(400);
      expect(mockContext.res?.body).toEqual({ error: 'Domain error' });
    });

    it('should handle unexpected Error', async () => {
      const error = new Error('Unexpected error');
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.res?.status).toBe(500);
      expect(mockContext.res?.body).toEqual({ error: 'Internal Server Error' });
    });

    it('should handle non-Error thrown value', async () => {
      const error = 'String error';
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.res?.status).toBe(500);
      expect(mockContext.res?.body).toEqual({ error: 'Internal Server Error' });
    });

    it('should log errors', async () => {
      const error = new Error('Test error');
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockServiceContainer.initialize).toHaveBeenCalled();
      expect(mockServiceContainer.resolve).toHaveBeenCalledWith('ErrorLogService');
      expect(mockLog).toHaveBeenCalled();
    });

    it('should use custom generic message', async () => {
      const error = new Error('Test error');
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withErrorHandler(mockHandler, {
        genericMessage: 'Custom error message',
      });
      await wrappedHandler(mockContext);

      expect(mockContext.res?.body).toEqual({ error: 'Custom error message' });
    });

    it('should throw error if req is missing for unexpected errors', async () => {
      const error = new Error('Test error');
      mockContext.req = undefined as any;
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withErrorHandler(mockHandler);
      
      await expect(wrappedHandler(mockContext)).rejects.toThrow('Test error');
    });

    it('should handle ExpectedError with details', async () => {
      const error = new ExpectedError('Validation failed', 400, { field: 'email' });
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.res?.status).toBe(400);
      expect(mockContext.res?.body).toEqual({ 
        error: 'Validation failed',
        details: { field: 'email' }
      });
    });

    it('should initialize service container if not initialized', async () => {
      (ServiceContainer as any).initialized = false;
      const error = new Error('Test error');
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockServiceContainer.initialize).toHaveBeenCalled();
    });

    it('should not initialize service container if already initialized', async () => {
      (ServiceContainer as any).initialized = true;
      const error = new Error('Test error');
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockServiceContainer.initialize).not.toHaveBeenCalled();
    });
  });
});

