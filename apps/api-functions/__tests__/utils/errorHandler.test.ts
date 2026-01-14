jest.mock('../../src/utils/response');
jest.mock('../../src/utils/logger');

import { Context } from '@azure/functions';
import { handleDomainError, handleAnyError } from '../../src/utils/errorHandler';
import { AuthError, ValidationError, MessagingError } from '../../src/domain/errors/DomainError';
import { badRequest, unauthorized } from '../../src/utils/response';
import { logWarn, logError } from '../../src/utils/logger';
import { TestUtils } from '../setup';

describe('errorHandler', () => {
  let mockContext: Context;
  const mockUnauthorized = unauthorized as jest.MockedFunction<typeof unauthorized>;
  const mockBadRequest = badRequest as jest.MockedFunction<typeof badRequest>;
  const mockLogWarn = logWarn as jest.MockedFunction<typeof logWarn>;
  const mockLogError = logError as jest.MockedFunction<typeof logError>;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    jest.clearAllMocks();
  });

  describe('handleDomainError', () => {
    it('should handle AuthError and call unauthorized', () => {
      const error = new AuthError('Unauthorized access', 401);
      const context = { userId: 'user-123' };

      handleDomainError(mockContext, error, context);

      expect(mockLogWarn).toHaveBeenCalledWith(
        mockContext,
        'Authorization failed: Unauthorized access',
        expect.objectContaining({
          statusCode: 401,
          message: 'Unauthorized access',
          userId: 'user-123',
        })
      );
      expect(mockUnauthorized).toHaveBeenCalledWith(mockContext, 'Unauthorized access');
    });

    it('should handle ValidationError and call badRequest', () => {
      const error = new ValidationError('Invalid input', 400);
      const context = { field: 'email' };

      handleDomainError(mockContext, error, context);

      expect(mockLogWarn).toHaveBeenCalledWith(
        mockContext,
        'Validation failed: Invalid input',
        expect.objectContaining({
          statusCode: 400,
          message: 'Invalid input',
          field: 'email',
        })
      );
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Invalid input');
    });

    it('should handle MessagingError and call badRequest', () => {
      const error = new MessagingError('Message failed', 400);
      const context = { channel: 'test' };

      handleDomainError(mockContext, error, context);

      expect(mockLogError).toHaveBeenCalledWith(
        mockContext,
        error,
        expect.objectContaining({
          statusCode: 400,
          message: 'Message failed',
          channel: 'test',
        })
      );
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Message failed');
    });

    it('should handle error without context', () => {
      const error = new AuthError('Unauthorized', 401);

      handleDomainError(mockContext, error);

      expect(mockLogWarn).toHaveBeenCalledWith(
        mockContext,
        'Authorization failed: Unauthorized',
        expect.objectContaining({
          statusCode: 401,
          message: 'Unauthorized',
        })
      );
      expect(mockUnauthorized).toHaveBeenCalledWith(mockContext, 'Unauthorized');
    });

    it('should handle unknown error type and call badRequest', () => {
      const error = { statusCode: 500, message: 'Unknown error' } as any;

      handleDomainError(mockContext, error);

      expect(mockLogError).toHaveBeenCalledWith(
        mockContext,
        error,
        expect.objectContaining({
          statusCode: 500,
          message: 'Unknown error',
        })
      );
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, '[object Object]');
    });
  });

  describe('handleAnyError', () => {
    it('should handle AuthError through handleDomainError', () => {
      const error = new AuthError('Unauthorized', 401);

      handleAnyError(mockContext, error);

      expect(mockLogWarn).toHaveBeenCalled();
      expect(mockUnauthorized).toHaveBeenCalledWith(mockContext, 'Unauthorized');
    });

    it('should handle ValidationError through handleDomainError', () => {
      const error = new ValidationError('Invalid input', 400);

      handleAnyError(mockContext, error);

      expect(mockLogWarn).toHaveBeenCalled();
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Invalid input');
    });

    it('should handle MessagingError through handleDomainError', () => {
      const error = new MessagingError('Message failed', 400);

      handleAnyError(mockContext, error);

      expect(mockLogError).toHaveBeenCalled();
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Message failed');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unexpected error');
      const context = { additional: 'context' };

      handleAnyError(mockContext, error, context);

      expect(mockLogError).toHaveBeenCalledWith(mockContext, error, context);
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'An unexpected error occurred');
    });

    it('should handle string errors', () => {
      const error = 'String error';

      handleAnyError(mockContext, error);

      expect(mockLogError).toHaveBeenCalledWith(mockContext, error, undefined);
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'An unexpected error occurred');
    });

    it('should handle null errors', () => {
      const error = null;

      handleAnyError(mockContext, error);

      expect(mockLogError).toHaveBeenCalledWith(mockContext, null, undefined);
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'An unexpected error occurred');
    });

    it('should handle error with context', () => {
      const error = new Error('Error with context');
      const context = { userId: 'user-123', action: 'test' };

      handleAnyError(mockContext, error, context);

      expect(mockLogError).toHaveBeenCalledWith(mockContext, error, context);
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'An unexpected error occurred');
    });
  });
});

