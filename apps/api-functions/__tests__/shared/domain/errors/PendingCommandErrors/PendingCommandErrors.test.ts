/**
 * @fileoverview PendingCommandErrors - unit tests
 * @summary Tests for pending command specific error classes
 * @description Validates error creation, inheritance, and error message handling
 */

import { 
  PendingCommandNotFoundError, 
  PendingCommandExpiredError, 
  PendingCommandAccessDeniedError, 
  PendingCommandUserNotFoundError, 
  PendingCommandFetchError 
} from '../../../../../shared/domain/errors/PendingCommandErrors';

describe('PendingCommandErrors', () => {
  describe('PendingCommandNotFoundError', () => {
    it('should create error with default message', () => {
      const error = new PendingCommandNotFoundError();

      expect(error.message).toBe('No pending commands found');
      expect(error.name).toBe('PendingCommandNotFoundError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom not found message';
      const error = new PendingCommandNotFoundError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('PendingCommandNotFoundError');
    });

    it('should be instance of Error', () => {
      const error = new PendingCommandNotFoundError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('PendingCommandExpiredError', () => {
    it('should create error with default message', () => {
      const error = new PendingCommandExpiredError();

      expect(error.message).toBe('Pending command has expired');
      expect(error.name).toBe('PendingCommandExpiredError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom expired message';
      const error = new PendingCommandExpiredError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('PendingCommandExpiredError');
    });

    it('should be instance of Error', () => {
      const error = new PendingCommandExpiredError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('PendingCommandAccessDeniedError', () => {
    it('should create error with default message', () => {
      const error = new PendingCommandAccessDeniedError();

      expect(error.message).toBe('Access denied to pending commands');
      expect(error.name).toBe('PendingCommandAccessDeniedError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom access denied message';
      const error = new PendingCommandAccessDeniedError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('PendingCommandAccessDeniedError');
    });

    it('should be instance of Error', () => {
      const error = new PendingCommandAccessDeniedError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('PendingCommandUserNotFoundError', () => {
    it('should create error with default message', () => {
      const error = new PendingCommandUserNotFoundError();

      expect(error.message).toBe('User not found or inactive');
      expect(error.name).toBe('PendingCommandUserNotFoundError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom user not found message';
      const error = new PendingCommandUserNotFoundError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('PendingCommandUserNotFoundError');
    });

    it('should be instance of Error', () => {
      const error = new PendingCommandUserNotFoundError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('PendingCommandFetchError', () => {
    it('should create error with default message', () => {
      const error = new PendingCommandFetchError();

      expect(error.message).toBe('Failed to fetch pending commands');
      expect(error.name).toBe('PendingCommandFetchError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom fetch error message';
      const error = new PendingCommandFetchError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('PendingCommandFetchError');
    });

    it('should be instance of Error', () => {
      const error = new PendingCommandFetchError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('error usage scenarios', () => {
    it('should handle error throwing and catching', () => {
      expect(() => {
        throw new PendingCommandNotFoundError('Test error');
      }).toThrow('Test error');

      expect(() => {
        throw new PendingCommandExpiredError('Test error');
      }).toThrow('Test error');

      expect(() => {
        throw new PendingCommandAccessDeniedError('Test error');
      }).toThrow('Test error');

      expect(() => {
        throw new PendingCommandUserNotFoundError('Test error');
      }).toThrow('Test error');

      expect(() => {
        throw new PendingCommandFetchError('Test error');
      }).toThrow('Test error');
    });

    it('should support error type checking', () => {
      const notFoundError = new PendingCommandNotFoundError();
      const expiredError = new PendingCommandExpiredError();
      const accessDeniedError = new PendingCommandAccessDeniedError();
      const userNotFoundError = new PendingCommandUserNotFoundError();
      const fetchError = new PendingCommandFetchError();

      expect(notFoundError instanceof PendingCommandNotFoundError).toBe(true);
      expect(expiredError instanceof PendingCommandExpiredError).toBe(true);
      expect(accessDeniedError instanceof PendingCommandAccessDeniedError).toBe(true);
      expect(userNotFoundError instanceof PendingCommandUserNotFoundError).toBe(true);
      expect(fetchError instanceof PendingCommandFetchError).toBe(true);
    });
  });

  describe('error serialization', () => {
    it('should preserve error properties', () => {
      const error = new PendingCommandNotFoundError('Test message');

      expect(error.message).toBe('Test message');
      expect(error.name).toBe('PendingCommandNotFoundError');
    });

    it('should be convertible to plain object', () => {
      const error = new PendingCommandNotFoundError('Test message');
      const errorObject = {
        message: error.message,
        name: error.name,
        stack: error.stack
      };

      expect(errorObject.message).toBe('Test message');
      expect(errorObject.name).toBe('PendingCommandNotFoundError');
      expect(errorObject.stack).toBeDefined();
    });
  });

  describe('error stack trace', () => {
    it('should have stack trace', () => {
      const error = new PendingCommandNotFoundError();
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });
});
