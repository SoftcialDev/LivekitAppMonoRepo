/**
 * @fileoverview Tests for errorHandler utility functions
 * @description Tests for centralized error handling with HTTP status code mapping
 */

import { handleDomainError, handleAnyError } from '../../../shared/utils/errorHandler';
import { AuthError, ValidationError, MessagingError } from '../../../shared/domain/errors/DomainError';
import { AuthErrorCode, ValidationErrorCode, MessagingErrorCode } from '../../../shared/domain/errors/ErrorCodes';
import { Context } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';

// Mock the response functions
jest.mock('../../../shared/utils/response', () => ({
  badRequest: jest.fn((ctx, error) => ({ status: 400, body: error })),
  unauthorized: jest.fn((ctx, message) => ({ status: 401, body: { error: message } }))
}));

describe('errorHandler', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = TestHelpers.createMockContext();
    jest.clearAllMocks();
  });

  describe('handleDomainError', () => {
    describe('AuthError', () => {
      it('should handle AuthError and return unauthorized response', () => {
        const authError = new AuthError('Invalid token', AuthErrorCode.INSUFFICIENT_PRIVILEGES);
        const context = { userId: 'user-123' };

        const result = handleDomainError(mockContext, authError, context);

        expect(mockContext.log.warn).toHaveBeenCalledWith(
          'Authorization failed: Invalid token',
          {
            statusCode: 403,
            message: 'Invalid token',
            userId: 'user-123'
          }
        );
        expect(result).toEqual({ status: 401, body: { error: 'Invalid token' } });
      });

      it('should handle AuthError without context', () => {
        const authError = new AuthError('Access denied', AuthErrorCode.INSUFFICIENT_PRIVILEGES);

        const result = handleDomainError(mockContext, authError);

        expect(mockContext.log.warn).toHaveBeenCalledWith(
          'Authorization failed: Access denied',
          {
            statusCode: 403,
            message: 'Access denied'
          }
        );
        expect(result).toEqual({ status: 401, body: { error: 'Access denied' } });
      });

      it('should handle AuthError with complex context', () => {
        const authError = new AuthError('Token expired', AuthErrorCode.INSUFFICIENT_PRIVILEGES);
        const context = {
          userId: 'user-123',
          resource: '/api/users',
          action: 'DELETE',
          timestamp: new Date().toISOString()
        };

        handleDomainError(mockContext, authError, context);

        expect(mockContext.log.warn).toHaveBeenCalledWith(
          'Authorization failed: Token expired',
          {
            statusCode: 403,
            message: 'Token expired',
            userId: 'user-123',
            resource: '/api/users',
            action: 'DELETE',
            timestamp: expect.any(String)
          }
        );
      });
    });

    describe('ValidationError', () => {
      it('should handle ValidationError and return bad request response', () => {
        const validationError = new ValidationError('Invalid email format', ValidationErrorCode.INVALID_EMAIL_FORMAT);
        const context = { field: 'email' };

        const result = handleDomainError(mockContext, validationError, context);

        expect(mockContext.log.warn).toHaveBeenCalledWith(
          'Validation failed: Invalid email format',
          {
            statusCode: 400,
            message: 'Invalid email format',
            field: 'email'
          }
        );
        expect(result).toEqual({ status: 400, body: 'Invalid email format' });
      });

      it('should handle ValidationError without context', () => {
        const validationError = new ValidationError('Required field missing', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED);

        const result = handleDomainError(mockContext, validationError);

        expect(mockContext.log.warn).toHaveBeenCalledWith(
          'Validation failed: Required field missing',
          {
            statusCode: 400,
            message: 'Required field missing'
          }
        );
        expect(result).toEqual({ status: 400, body: 'Required field missing' });
      });

      it('should handle ValidationError with multiple validation issues', () => {
        const validationError = new ValidationError('Multiple validation errors', ValidationErrorCode.INVALID_EMAIL_FORMAT);
        const context = {
          errors: [
            { field: 'email', message: 'Invalid format' },
            { field: 'password', message: 'Too short' }
          ]
        };

        handleDomainError(mockContext, validationError, context);

        expect(mockContext.log.warn).toHaveBeenCalledWith(
          'Validation failed: Multiple validation errors',
          {
            statusCode: 400,
            message: 'Multiple validation errors',
            errors: [
              { field: 'email', message: 'Invalid format' },
              { field: 'password', message: 'Too short' }
            ]
          }
        );
      });
    });

    describe('MessagingError', () => {
      it('should handle MessagingError and return bad request response', () => {
        const messagingError = new MessagingError('Failed to send message', MessagingErrorCode.WEBSOCKET_SEND_FAILED);
        const context = { channel: 'email' };

        const result = handleDomainError(mockContext, messagingError, context);

        expect(mockContext.log.error).toHaveBeenCalledWith(
          'Messaging failed: Failed to send message',
          {
            statusCode: 400,
            message: 'Failed to send message',
            channel: 'email'
          }
        );
        expect(result).toEqual({ status: 400, body: 'Failed to send message' });
      });

      it('should handle MessagingError without context', () => {
        const messagingError = new MessagingError('Queue is full', MessagingErrorCode.WEBSOCKET_SEND_FAILED);

        const result = handleDomainError(mockContext, messagingError);

        expect(mockContext.log.error).toHaveBeenCalledWith(
          'Messaging failed: Queue is full',
          {
            statusCode: 400,
            message: 'Queue is full'
          }
        );
        expect(result).toEqual({ status: 400, body: 'Queue is full' });
      });

      it('should handle MessagingError with retry context', () => {
        const messagingError = new MessagingError('Connection timeout', MessagingErrorCode.WEBSOCKET_SEND_FAILED);
        const context = {
          retryCount: 3,
          maxRetries: 5,
          lastAttempt: new Date().toISOString()
        };

        handleDomainError(mockContext, messagingError, context);

        expect(mockContext.log.error).toHaveBeenCalledWith(
          'Messaging failed: Connection timeout',
          {
            statusCode: 400,
            message: 'Connection timeout',
            retryCount: 3,
            maxRetries: 5,
            lastAttempt: expect.any(String)
          }
        );
      });
    });

    describe('unknown domain error', () => {
      it('should handle unknown domain error type', () => {
        const unknownError = {
          message: 'Unknown error',
          statusCode: 500
        } as any;

        const result = handleDomainError(mockContext, unknownError);

        expect(mockContext.log.error).toHaveBeenCalledWith(
          'Unknown domain error: Unknown error',
          {
            statusCode: 500,
            message: 'Unknown error'
          }
        );
        expect(result).toEqual({ status: 400, body: 'Unknown error' });
      });
    });
  });

  describe('handleAnyError', () => {
    it('should delegate known domain errors to handleDomainError', () => {
      const authError = new AuthError('Invalid credentials', AuthErrorCode.INSUFFICIENT_PRIVILEGES);
      const context = { userId: 'user-123' };

      const result = handleAnyError(mockContext, authError, context);

      expect(mockContext.log.warn).toHaveBeenCalledWith(
        'Authorization failed: Invalid credentials',
        {
          statusCode: 403,
          message: 'Invalid credentials',
          userId: 'user-123'
        }
      );
      expect(result).toEqual({ status: 401, body: { error: 'Invalid credentials' } });
    });

    it('should handle ValidationError through handleAnyError', () => {
      const validationError = new ValidationError('Invalid input', ValidationErrorCode.INVALID_EMAIL_FORMAT);

      const result = handleAnyError(mockContext, validationError);

      expect(mockContext.log.warn).toHaveBeenCalledWith(
        'Validation failed: Invalid input',
        {
          statusCode: 400,
          message: 'Invalid input'
        }
      );
      expect(result).toEqual({ status: 400, body: 'Invalid input' });
    });

    it('should handle MessagingError through handleAnyError', () => {
      const messagingError = new MessagingError('Send failed', MessagingErrorCode.WEBSOCKET_SEND_FAILED);

      const result = handleAnyError(mockContext, messagingError);

      expect(mockContext.log.error).toHaveBeenCalledWith(
        'Messaging failed: Send failed',
        {
          statusCode: 400,
          message: 'Send failed'
        }
      );
      expect(result).toEqual({ status: 400, body: 'Send failed' });
    });

    it('should handle unknown errors', () => {
      const unknownError = new Error('Unexpected error');
      const context = { operation: 'createUser' };

      const result = handleAnyError(mockContext, unknownError, context);

      expect(mockContext.log.error).toHaveBeenCalledWith(
        'Unexpected error:',
        {
          error: unknownError,
          operation: 'createUser'
        }
      );
      expect(result).toEqual({ status: 400, body: 'An unexpected error occurred' });
    });

    it('should handle string errors', () => {
      const stringError = 'Simple string error';
      const context = { step: 'validation' };

      const result = handleAnyError(mockContext, stringError, context);

      expect(mockContext.log.error).toHaveBeenCalledWith(
        'Unexpected error:',
        {
          error: stringError,
          step: 'validation'
        }
      );
      expect(result).toEqual({ status: 400, body: 'An unexpected error occurred' });
    });

    it('should handle null errors', () => {
      const result = handleAnyError(mockContext, null);

      expect(mockContext.log.error).toHaveBeenCalledWith(
        'Unexpected error:',
        { error: null }
      );
      expect(result).toEqual({ status: 400, body: 'An unexpected error occurred' });
    });

    it('should handle undefined errors', () => {
      const result = handleAnyError(mockContext, undefined);

      expect(mockContext.log.error).toHaveBeenCalledWith(
        'Unexpected error:',
        { error: undefined }
      );
      expect(result).toEqual({ status: 400, body: 'An unexpected error occurred' });
    });

    it('should handle errors without context', () => {
      const error = new Error('No context error');

      const result = handleAnyError(mockContext, error);

      expect(mockContext.log.error).toHaveBeenCalledWith(
        'Unexpected error:',
        { error }
      );
      expect(result).toEqual({ status: 400, body: 'An unexpected error occurred' });
    });

    it('should handle complex error objects', () => {
      const complexError = {
        name: 'CustomError',
        message: 'Complex error occurred',
        code: 'CUSTOM_001',
        details: {
          field: 'email',
          value: 'invalid-email',
          reason: 'Invalid format'
        }
      };

      const result = handleAnyError(mockContext, complexError);

      expect(mockContext.log.error).toHaveBeenCalledWith(
        'Unexpected error:',
        { error: complexError }
      );
      expect(result).toEqual({ status: 400, body: 'An unexpected error occurred' });
    });
  });

  describe('edge cases', () => {
    it('should handle empty context object', () => {
      const authError = new AuthError('Test error', AuthErrorCode.INSUFFICIENT_PRIVILEGES);
      const emptyContext = {};

      handleDomainError(mockContext, authError, emptyContext);

      expect(mockContext.log.warn).toHaveBeenCalledWith(
        'Authorization failed: Test error',
        {
          statusCode: 403,
          message: 'Test error'
        }
      );
    });

    it('should handle context with circular references', () => {
      const authError = new AuthError('Test error', AuthErrorCode.INSUFFICIENT_PRIVILEGES);
      const circularContext: any = { name: 'test' };
      circularContext.self = circularContext;

      // This should not throw an error
      expect(() => {
        handleDomainError(mockContext, authError, circularContext);
      }).not.toThrow();
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const authError = new AuthError(longMessage, AuthErrorCode.INSUFFICIENT_PRIVILEGES);

      const result = handleDomainError(mockContext, authError);

      expect(mockContext.log.warn).toHaveBeenCalledWith(
        `Authorization failed: ${longMessage}`,
        {
          statusCode: 403,
          message: longMessage
        }
      );
      expect(result).toEqual({ status: 401, body: { error: longMessage } });
    });
  });
});
