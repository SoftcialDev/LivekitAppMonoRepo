/**
 * @fileoverview StreamingSessionErrors - unit tests
 * @summary Tests for streaming session specific error classes
 * @description Validates error creation, inheritance, and error message handling
 */

import { 
  StreamingSessionNotFoundError, 
  StreamingSessionAccessDeniedError, 
  StreamingSessionUserNotFoundError, 
  StreamingSessionFetchError, 
  StreamingSessionCreationError, 
  StreamingSessionUpdateError 
} from '../../../../../shared/domain/errors/StreamingSessionErrors';

describe('StreamingSessionErrors', () => {
  describe('StreamingSessionNotFoundError', () => {
    it('should create error with default message', () => {
      const error = new StreamingSessionNotFoundError();

      expect(error.message).toBe('Streaming session not found');
      expect(error.name).toBe('StreamingSessionNotFoundError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom streaming session not found message';
      const error = new StreamingSessionNotFoundError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('StreamingSessionNotFoundError');
    });

    it('should be instance of Error', () => {
      const error = new StreamingSessionNotFoundError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('StreamingSessionAccessDeniedError', () => {
    it('should create error with default message', () => {
      const error = new StreamingSessionAccessDeniedError();

      expect(error.message).toBe('Access denied to streaming session');
      expect(error.name).toBe('StreamingSessionAccessDeniedError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom access denied message';
      const error = new StreamingSessionAccessDeniedError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('StreamingSessionAccessDeniedError');
    });

    it('should be instance of Error', () => {
      const error = new StreamingSessionAccessDeniedError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('StreamingSessionUserNotFoundError', () => {
    it('should create error with default message', () => {
      const error = new StreamingSessionUserNotFoundError();

      expect(error.message).toBe('User not found for streaming session');
      expect(error.name).toBe('StreamingSessionUserNotFoundError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom user not found message';
      const error = new StreamingSessionUserNotFoundError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('StreamingSessionUserNotFoundError');
    });

    it('should be instance of Error', () => {
      const error = new StreamingSessionUserNotFoundError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('StreamingSessionFetchError', () => {
    it('should create error with default message', () => {
      const error = new StreamingSessionFetchError();

      expect(error.message).toBe('Failed to fetch streaming session');
      expect(error.name).toBe('StreamingSessionFetchError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom fetch error message';
      const error = new StreamingSessionFetchError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('StreamingSessionFetchError');
    });

    it('should be instance of Error', () => {
      const error = new StreamingSessionFetchError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('StreamingSessionCreationError', () => {
    it('should create error with default message', () => {
      const error = new StreamingSessionCreationError();

      expect(error.message).toBe('Failed to create streaming session');
      expect(error.name).toBe('StreamingSessionCreationError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom creation error message';
      const error = new StreamingSessionCreationError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('StreamingSessionCreationError');
    });

    it('should be instance of Error', () => {
      const error = new StreamingSessionCreationError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('StreamingSessionUpdateError', () => {
    it('should create error with default message', () => {
      const error = new StreamingSessionUpdateError();

      expect(error.message).toBe('Failed to update streaming session');
      expect(error.name).toBe('StreamingSessionUpdateError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom update error message';
      const error = new StreamingSessionUpdateError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('StreamingSessionUpdateError');
    });

    it('should be instance of Error', () => {
      const error = new StreamingSessionUpdateError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('error usage scenarios', () => {
    it('should handle error throwing and catching', () => {
      const errors = [
        new StreamingSessionNotFoundError('Test error'),
        new StreamingSessionAccessDeniedError('Test error'),
        new StreamingSessionUserNotFoundError('Test error'),
        new StreamingSessionFetchError('Test error'),
        new StreamingSessionCreationError('Test error'),
        new StreamingSessionUpdateError('Test error')
      ];

      errors.forEach(error => {
        expect(() => {
          throw error;
        }).toThrow('Test error');
      });
    });

    it('should support error type checking', () => {
      const notFoundError = new StreamingSessionNotFoundError();
      const accessDeniedError = new StreamingSessionAccessDeniedError();
      const userNotFoundError = new StreamingSessionUserNotFoundError();
      const fetchError = new StreamingSessionFetchError();
      const creationError = new StreamingSessionCreationError();
      const updateError = new StreamingSessionUpdateError();

      expect(notFoundError instanceof StreamingSessionNotFoundError).toBe(true);
      expect(accessDeniedError instanceof StreamingSessionAccessDeniedError).toBe(true);
      expect(userNotFoundError instanceof StreamingSessionUserNotFoundError).toBe(true);
      expect(fetchError instanceof StreamingSessionFetchError).toBe(true);
      expect(creationError instanceof StreamingSessionCreationError).toBe(true);
      expect(updateError instanceof StreamingSessionUpdateError).toBe(true);
    });

    it('should support error categorization', () => {
      const isNotFoundError = (error: Error): boolean => {
        return error instanceof StreamingSessionNotFoundError;
      };

      const isAccessDeniedError = (error: Error): boolean => {
        return error instanceof StreamingSessionAccessDeniedError;
      };

      const isUserNotFoundError = (error: Error): boolean => {
        return error instanceof StreamingSessionUserNotFoundError;
      };

      expect(isNotFoundError(new StreamingSessionNotFoundError())).toBe(true);
      expect(isAccessDeniedError(new StreamingSessionAccessDeniedError())).toBe(true);
      expect(isUserNotFoundError(new StreamingSessionUserNotFoundError())).toBe(true);
    });
  });

  describe('error serialization', () => {
    it('should preserve error properties', () => {
      const error = new StreamingSessionNotFoundError('Test message');

      expect(error.message).toBe('Test message');
      expect(error.name).toBe('StreamingSessionNotFoundError');
    });

    it('should be convertible to plain object', () => {
      const error = new StreamingSessionNotFoundError('Test message');
      const errorObject = {
        message: error.message,
        name: error.name,
        stack: error.stack
      };

      expect(errorObject.message).toBe('Test message');
      expect(errorObject.name).toBe('StreamingSessionNotFoundError');
      expect(errorObject.stack).toBeDefined();
    });
  });

  describe('error stack trace', () => {
    it('should have stack trace', () => {
      const error = new StreamingSessionNotFoundError();
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });
});
