/**
 * @fileoverview DomainError - unit tests
 * @summary Tests for base domain error class and specific error types
 * @description Validates error creation, inheritance, and error code handling
 */

// Mock dateUtils
jest.mock('../../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2023-01-01T12:00:00Z'))
}));

import { 
  DomainError, 
  AuthError, 
  ValidationError, 
  MessagingError, 
  ApplicationError, 
  SupervisorError, 
  UserRoleChangeError, 
  UserDeletionError 
} from '../../../../../shared/domain/errors/DomainError';
import { 
  AuthErrorCode, 
  ValidationErrorCode, 
  MessagingErrorCode, 
  ApplicationErrorCode, 
  SupervisorErrorCode, 
  UserRoleChangeErrorCode, 
  UserDeletionErrorCode 
} from '../../../../../shared/domain/errors/ErrorCodes';

describe('DomainError', () => {
  describe('base DomainError class', () => {
    it('should create error with message and status code', () => {
      class TestDomainError extends DomainError {
        constructor() {
          super('Test error message', 400);
        }
      }
      const error = new TestDomainError();

      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('TestDomainError');
      expect(error.timestamp).toEqual(new Date('2023-01-01T12:00:00Z'));
    });

    it('should set correct error name from constructor', () => {
      class TestError extends DomainError {
        constructor() {
          super('Test message', 500);
        }
      }

      const error = new TestError();
      expect(error.name).toBe('TestError');
    });

    it('should be instance of Error', () => {
      const error = new (class extends DomainError {
        constructor() {
          super('Test message', 400);
        }
      })();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
    });

    it('should have timestamp property', () => {
      const error = new (class extends DomainError {
        constructor() {
          super('Test message', 400);
        }
      })();

      expect(error.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('AuthError', () => {
    it('should create AuthError with message and status code', () => {
      const error = new AuthError('Authentication failed', AuthErrorCode.USER_NOT_FOUND);

      expect(error.message).toBe('Authentication failed');
      expect(error.statusCode).toBe(AuthErrorCode.USER_NOT_FOUND);
      expect(error.name).toBe('AuthError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should be instance of DomainError', () => {
      const error = new AuthError('Test message', AuthErrorCode.USER_NOT_FOUND);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(AuthError);
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with message and status code', () => {
      const error = new ValidationError('Validation failed', ValidationErrorCode.INVALID_EMAIL_FORMAT);

      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(ValidationErrorCode.INVALID_EMAIL_FORMAT);
      expect(error.name).toBe('ValidationError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should be instance of DomainError', () => {
      const error = new ValidationError('Test message', ValidationErrorCode.INVALID_EMAIL_FORMAT);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('MessagingError', () => {
    it('should create MessagingError with message and status code', () => {
      const error = new MessagingError('Messaging failed', MessagingErrorCode.COMMAND_DELIVERY_FAILED);

      expect(error.message).toBe('Messaging failed');
      expect(error.statusCode).toBe(MessagingErrorCode.COMMAND_DELIVERY_FAILED);
      expect(error.name).toBe('MessagingError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should be instance of DomainError', () => {
      const error = new MessagingError('Test message', MessagingErrorCode.COMMAND_DELIVERY_FAILED);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(MessagingError);
    });
  });

  describe('ApplicationError', () => {
    it('should create ApplicationError with message and status code', () => {
      const error = new ApplicationError('Application error', ApplicationErrorCode.COMMAND_PROCESSING_FAILED);

      expect(error.message).toBe('Application error');
      expect(error.statusCode).toBe(ApplicationErrorCode.COMMAND_PROCESSING_FAILED);
      expect(error.name).toBe('ApplicationError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should be instance of DomainError', () => {
      const error = new ApplicationError('Test message', ApplicationErrorCode.COMMAND_PROCESSING_FAILED);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(ApplicationError);
    });
  });

  describe('SupervisorError', () => {
    it('should create SupervisorError with message and status code', () => {
      const error = new SupervisorError('Supervisor error', SupervisorErrorCode.SUPERVISOR_NOT_FOUND);

      expect(error.message).toBe('Supervisor error');
      expect(error.statusCode).toBe(SupervisorErrorCode.SUPERVISOR_NOT_FOUND);
      expect(error.name).toBe('SupervisorError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should be instance of DomainError', () => {
      const error = new SupervisorError('Test message', SupervisorErrorCode.SUPERVISOR_NOT_FOUND);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(SupervisorError);
    });
  });

  describe('UserRoleChangeError', () => {
    it('should create UserRoleChangeError with message and status code', () => {
      const error = new UserRoleChangeError('Role change failed', UserRoleChangeErrorCode.ROLE_ASSIGNMENT_FAILED);

      expect(error.message).toBe('Role change failed');
      expect(error.statusCode).toBe(UserRoleChangeErrorCode.ROLE_ASSIGNMENT_FAILED);
      expect(error.name).toBe('UserRoleChangeError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should be instance of DomainError', () => {
      const error = new UserRoleChangeError('Test message', UserRoleChangeErrorCode.ROLE_ASSIGNMENT_FAILED);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(UserRoleChangeError);
    });
  });

  describe('UserDeletionError', () => {
    it('should create UserDeletionError with message and status code', () => {
      const error = new UserDeletionError('User deletion failed', UserDeletionErrorCode.DATABASE_DELETION_FAILED);

      expect(error.message).toBe('User deletion failed');
      expect(error.statusCode).toBe(UserDeletionErrorCode.DATABASE_DELETION_FAILED);
      expect(error.name).toBe('UserDeletionError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should be instance of DomainError', () => {
      const error = new UserDeletionError('Test message', UserDeletionErrorCode.DATABASE_DELETION_FAILED);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(UserDeletionError);
    });
  });

  describe('error inheritance', () => {
    it('should maintain proper inheritance chain', () => {
      const authError = new AuthError('Test', AuthErrorCode.USER_NOT_FOUND);
      const validationError = new ValidationError('Test', ValidationErrorCode.INVALID_EMAIL_FORMAT);
      const messagingError = new MessagingError('Test', MessagingErrorCode.COMMAND_DELIVERY_FAILED);
      const applicationError = new ApplicationError('Test', ApplicationErrorCode.COMMAND_PROCESSING_FAILED);
      const supervisorError = new SupervisorError('Test', SupervisorErrorCode.SUPERVISOR_NOT_FOUND);
      const userRoleChangeError = new UserRoleChangeError('Test', UserRoleChangeErrorCode.ROLE_ASSIGNMENT_FAILED);
      const userDeletionError = new UserDeletionError('Test', UserDeletionErrorCode.DATABASE_DELETION_FAILED);

      expect(authError).toBeInstanceOf(DomainError);
      expect(validationError).toBeInstanceOf(DomainError);
      expect(messagingError).toBeInstanceOf(DomainError);
      expect(applicationError).toBeInstanceOf(DomainError);
      expect(supervisorError).toBeInstanceOf(DomainError);
      expect(userRoleChangeError).toBeInstanceOf(DomainError);
      expect(userDeletionError).toBeInstanceOf(DomainError);
    });
  });

  describe('error serialization', () => {
    it('should preserve error properties', () => {
      const error = new AuthError('Test message', AuthErrorCode.USER_NOT_FOUND);

      expect(error.message).toBe('Test message');
      expect(error.name).toBe('AuthError');
      expect(error.statusCode).toBe(AuthErrorCode.USER_NOT_FOUND);
    });

    it('should be convertible to plain object', () => {
      const error = new AuthError('Test message', AuthErrorCode.USER_NOT_FOUND);
      const errorObject = {
        message: error.message,
        name: error.name,
        statusCode: error.statusCode,
        timestamp: error.timestamp
      };

      expect(errorObject.message).toBe('Test message');
      expect(errorObject.name).toBe('AuthError');
      expect(errorObject.statusCode).toBe(AuthErrorCode.USER_NOT_FOUND);
      expect(errorObject.timestamp).toBeInstanceOf(Date);
    });
  });
});
