/**
 * @fileoverview UserErrors - unit tests
 * @summary Tests for user specific error classes
 * @description Validates error creation, inheritance, and error message handling
 */

import { 
  UserNotFoundError, 
  UserAccessDeniedError 
} from '../../../../../shared/domain/errors/UserErrors';

describe('UserErrors', () => {
  describe('UserNotFoundError', () => {
    it('should create error with custom message', () => {
      const customMessage = 'User with ID 123 not found';
      const error = new UserNotFoundError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('UserNotFoundError');
    });

    it('should be instance of Error', () => {
      const error = new UserNotFoundError('Test message');
      expect(error).toBeInstanceOf(Error);
    });

    it('should have correct error name', () => {
      const error = new UserNotFoundError('Test message');
      expect(error.name).toBe('UserNotFoundError');
    });
  });

  describe('UserAccessDeniedError', () => {
    it('should create error with custom message', () => {
      const customMessage = 'User does not have permission to access this resource';
      const error = new UserAccessDeniedError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('UserAccessDeniedError');
    });

    it('should be instance of Error', () => {
      const error = new UserAccessDeniedError('Test message');
      expect(error).toBeInstanceOf(Error);
    });

    it('should have correct error name', () => {
      const error = new UserAccessDeniedError('Test message');
      expect(error.name).toBe('UserAccessDeniedError');
    });
  });

  describe('error usage scenarios', () => {
    it('should handle error throwing and catching', () => {
      expect(() => {
        throw new UserNotFoundError('User not found');
      }).toThrow('User not found');

      expect(() => {
        throw new UserAccessDeniedError('Access denied');
      }).toThrow('Access denied');
    });

    it('should support error type checking', () => {
      const notFoundError = new UserNotFoundError('User not found');
      const accessDeniedError = new UserAccessDeniedError('Access denied');

      expect(notFoundError instanceof UserNotFoundError).toBe(true);
      expect(accessDeniedError instanceof UserAccessDeniedError).toBe(true);
    });

    it('should support error categorization', () => {
      const isNotFoundError = (error: Error): boolean => {
        return error instanceof UserNotFoundError;
      };

      const isAccessDeniedError = (error: Error): boolean => {
        return error instanceof UserAccessDeniedError;
      };

      expect(isNotFoundError(new UserNotFoundError('Test'))).toBe(true);
      expect(isAccessDeniedError(new UserAccessDeniedError('Test'))).toBe(true);
    });

    it('should support error handling in try-catch blocks', () => {
      const handleUserError = (error: Error): string => {
        if (error instanceof UserNotFoundError) {
          return 'User not found - please check the user ID';
        }
        if (error instanceof UserAccessDeniedError) {
          return 'Access denied - insufficient permissions';
        }
        return 'Unknown error occurred';
      };

      const notFoundError = new UserNotFoundError('User ID 123 not found');
      const accessDeniedError = new UserAccessDeniedError('Insufficient permissions');

      expect(handleUserError(notFoundError)).toBe('User not found - please check the user ID');
      expect(handleUserError(accessDeniedError)).toBe('Access denied - insufficient permissions');
    });
  });

  describe('error serialization', () => {
    it('should preserve error properties', () => {
      const notFoundError = new UserNotFoundError('User not found');
      const accessDeniedError = new UserAccessDeniedError('Access denied');

      expect(notFoundError.message).toBe('User not found');
      expect(notFoundError.name).toBe('UserNotFoundError');
      expect(accessDeniedError.message).toBe('Access denied');
      expect(accessDeniedError.name).toBe('UserAccessDeniedError');
    });

    it('should be convertible to plain object', () => {
      const notFoundError = new UserNotFoundError('User not found');
      const errorObject = {
        message: notFoundError.message,
        name: notFoundError.name,
        stack: notFoundError.stack
      };

      expect(errorObject.message).toBe('User not found');
      expect(errorObject.name).toBe('UserNotFoundError');
      expect(errorObject.stack).toBeDefined();
    });
  });

  describe('error stack trace', () => {
    it('should have stack trace', () => {
      const notFoundError = new UserNotFoundError('Test message');
      const accessDeniedError = new UserAccessDeniedError('Test message');

      expect(notFoundError.stack).toBeDefined();
      expect(accessDeniedError.stack).toBeDefined();
      expect(typeof notFoundError.stack).toBe('string');
      expect(typeof accessDeniedError.stack).toBe('string');
    });
  });

  describe('error message handling', () => {
    it('should preserve custom error messages', () => {
      const customMessages = [
        'User with email test@example.com not found',
        'User account has been deactivated',
        'User does not exist in the system',
        'Access denied to user management functions',
        'Insufficient permissions to modify user data',
        'User role does not allow this operation'
      ];

      customMessages.forEach((message, index) => {
        const error = index % 2 === 0 
          ? new UserNotFoundError(message)
          : new UserAccessDeniedError(message);

        expect(error.message).toBe(message);
      });
    });
  });
});
