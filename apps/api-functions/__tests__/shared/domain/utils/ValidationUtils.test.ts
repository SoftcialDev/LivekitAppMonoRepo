/**
 * @fileoverview Tests for ValidationUtils
 * @description Tests for validation utilities
 */

import { ValidationUtils } from '../../../../shared/domain/utils/ValidationUtils';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { ISupervisorRepository } from '../../../../shared/domain/interfaces/ISupervisorRepository';
import { ValidationError } from '../../../../shared/domain/errors/DomainError';
import { ValidationErrorCode } from '../../../../shared/domain/errors/ErrorCodes';
import { UserRole } from '../../../../shared/domain/enums/UserRole';
import { User } from '../../../../shared/domain/entities/User';

describe('ValidationUtils', () => {
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockSupervisorRepository: jest.Mocked<ISupervisorRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
    } as any;

    mockSupervisorRepository = {
      findByEmail: jest.fn(),
    } as any;
  });

  describe('validateEmailRequired', () => {
    it('should return normalized email when valid', () => {
      const result = ValidationUtils.validateEmailRequired('Test@Example.COM');
      expect(result).toBe('test@example.com');
    });

    it('should throw error when email is null', () => {
      expect(() => {
        ValidationUtils.validateEmailRequired(null);
      }).toThrow(new ValidationError('Email is required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED));
    });

    it('should throw error when email is undefined', () => {
      expect(() => {
        ValidationUtils.validateEmailRequired(undefined);
      }).toThrow(new ValidationError('Email is required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED));
    });

    it('should throw error when email is empty string', () => {
      expect(() => {
        ValidationUtils.validateEmailRequired('');
      }).toThrow(new ValidationError('Email is required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED));
    });

    it('should throw error when email is whitespace only', () => {
      expect(() => {
        ValidationUtils.validateEmailRequired('   ');
      }).toThrow(new ValidationError('Email is required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED));
    });

    it('should use custom field name in error message', () => {
      expect(() => {
        ValidationUtils.validateEmailRequired(null, 'User Email');
      }).toThrow(new ValidationError('User Email is required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED));
    });
  });

  describe('validateEmailFormat', () => {
    it('should return normalized email when format is valid', () => {
      const result = ValidationUtils.validateEmailFormat('Test@Example.COM');
      expect(result).toBe('test@example.com');
    });

    it('should throw error when email format is invalid', () => {
      expect(() => {
        ValidationUtils.validateEmailFormat('invalid-email');
      }).toThrow(new ValidationError('Invalid email format', ValidationErrorCode.INVALID_EMAIL_FORMAT));
    });

    it('should throw error when email is missing @ symbol', () => {
      expect(() => {
        ValidationUtils.validateEmailFormat('testexample.com');
      }).toThrow(new ValidationError('Invalid email format', ValidationErrorCode.INVALID_EMAIL_FORMAT));
    });

    it('should throw error when email is missing domain', () => {
      expect(() => {
        ValidationUtils.validateEmailFormat('test@');
      }).toThrow(new ValidationError('Invalid email format', ValidationErrorCode.INVALID_EMAIL_FORMAT));
    });

    it('should use custom field name in error message', () => {
      expect(() => {
        ValidationUtils.validateEmailFormat('invalid-email', 'User Email');
      }).toThrow(new ValidationError('Invalid user email format', ValidationErrorCode.INVALID_EMAIL_FORMAT));
    });
  });

  describe('validateUserExists', () => {
    it('should return user when user exists and is active', async () => {
      // Arrange
      const email = 'test@example.com';
      const user = { id: 'user-123', email, deletedAt: null } as User;
      mockUserRepository.findByEmail.mockResolvedValue(user);

      // Act
      const result = await ValidationUtils.validateUserExists(mockUserRepository, email);

      // Assert
      expect(result).toBe(user);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw error when user is not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ValidationUtils.validateUserExists(mockUserRepository, email)
      ).rejects.toThrow(new ValidationError('User not found', ValidationErrorCode.TARGET_USER_NOT_FOUND));
    });

    it('should throw error when user is inactive', async () => {
      // Arrange
      const email = 'inactive@example.com';
      const user = { id: 'user-123', email, deletedAt: new Date() } as User;
      mockUserRepository.findByEmail.mockResolvedValue(user);

      // Act & Assert
      await expect(
        ValidationUtils.validateUserExists(mockUserRepository, email)
      ).rejects.toThrow(new ValidationError('User is inactive', ValidationErrorCode.TARGET_USER_NOT_FOUND));
    });

    it('should use custom field name in error message', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ValidationUtils.validateUserExists(mockUserRepository, email, 'Target User')
      ).rejects.toThrow(new ValidationError('Target User not found', ValidationErrorCode.TARGET_USER_NOT_FOUND));
    });
  });

  describe('validateUserIsEmployee', () => {
    it('should return user when user is an employee', async () => {
      // Arrange
      const email = 'employee@example.com';
      const user = { id: 'user-123', email, role: UserRole.Employee, deletedAt: null } as User;
      mockUserRepository.findByEmail.mockResolvedValue(user);

      // Act
      const result = await ValidationUtils.validateUserIsEmployee(mockUserRepository, email);

      // Assert
      expect(result).toBe(user);
    });

    it('should throw error when user is not an employee', async () => {
      // Arrange
      const email = 'supervisor@example.com';
      const user = { id: 'user-123', email, role: UserRole.Supervisor, deletedAt: null } as User;
      mockUserRepository.findByEmail.mockResolvedValue(user);

      // Act & Assert
      await expect(
        ValidationUtils.validateUserIsEmployee(mockUserRepository, email)
      ).rejects.toThrow(new ValidationError('User is not an employee', ValidationErrorCode.TARGET_NOT_EMPLOYEE));
    });

    it('should use custom field name in error message', async () => {
      // Arrange
      const email = 'supervisor@example.com';
      const user = { id: 'user-123', email, role: UserRole.Supervisor, deletedAt: null } as User;
      mockUserRepository.findByEmail.mockResolvedValue(user);

      // Act & Assert
      await expect(
        ValidationUtils.validateUserIsEmployee(mockUserRepository, email, 'Target User')
      ).rejects.toThrow(new ValidationError('Target User is not an employee', ValidationErrorCode.TARGET_NOT_EMPLOYEE));
    });
  });

  describe('validateUserIsSupervisor', () => {
    it('should return supervisor when user is a supervisor', async () => {
      // Arrange
      const email = 'supervisor@example.com';
      const supervisor = { id: 'user-123', email, role: UserRole.Supervisor, deletedAt: null } as User;
      mockSupervisorRepository.findByEmail.mockResolvedValue(supervisor);

      // Act
      const result = await ValidationUtils.validateUserIsSupervisor(mockSupervisorRepository, email);

      // Assert
      expect(result).toBe(supervisor);
      expect(mockSupervisorRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw error when supervisor is not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockSupervisorRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ValidationUtils.validateUserIsSupervisor(mockSupervisorRepository, email)
      ).rejects.toThrow(new ValidationError('Supervisor not found', ValidationErrorCode.TARGET_USER_NOT_FOUND));
    });

    it('should throw error when supervisor is inactive', async () => {
      // Arrange
      const email = 'inactive@example.com';
      const supervisor = { id: 'user-123', email, role: UserRole.Supervisor, deletedAt: new Date() } as User;
      mockSupervisorRepository.findByEmail.mockResolvedValue(supervisor);

      // Act & Assert
      await expect(
        ValidationUtils.validateUserIsSupervisor(mockSupervisorRepository, email)
      ).rejects.toThrow(new ValidationError('Supervisor is inactive', ValidationErrorCode.TARGET_USER_NOT_FOUND));
    });

    it('should throw error when user is not a supervisor', async () => {
      // Arrange
      const email = 'employee@example.com';
      const user = { id: 'user-123', email, role: UserRole.Employee, deletedAt: null } as User;
      mockSupervisorRepository.findByEmail.mockResolvedValue(user);

      // Act & Assert
      await expect(
        ValidationUtils.validateUserIsSupervisor(mockSupervisorRepository, email)
      ).rejects.toThrow(new ValidationError('Supervisor is not a supervisor', ValidationErrorCode.TARGET_NOT_EMPLOYEE));
    });

    it('should use custom field name in error message', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockSupervisorRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ValidationUtils.validateUserIsSupervisor(mockSupervisorRepository, email, 'Target Supervisor')
      ).rejects.toThrow(new ValidationError('Target Supervisor not found', ValidationErrorCode.TARGET_USER_NOT_FOUND));
    });
  });

  describe('validateEmailsArray', () => {
    it('should return normalized emails when array is valid', () => {
      const emails = ['Test1@Example.COM', 'Test2@Example.COM'];
      const result = ValidationUtils.validateEmailsArray(emails);
      expect(result).toEqual(['test1@example.com', 'test2@example.com']);
    });

    it('should throw error when emails array is null', () => {
      expect(() => {
        ValidationUtils.validateEmailsArray(null as any);
      }).toThrow(new ValidationError('User emails are required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED));
    });

    it('should throw error when emails array is empty', () => {
      expect(() => {
        ValidationUtils.validateEmailsArray([]);
      }).toThrow(new ValidationError('User emails are required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED));
    });

    it('should throw error when emails array contains invalid format', () => {
      expect(() => {
        ValidationUtils.validateEmailsArray(['valid@example.com', 'invalid-email']);
      }).toThrow(new ValidationError('Invalid user emails format', ValidationErrorCode.INVALID_EMAIL_FORMAT));
    });

    it('should use custom field name in error message', () => {
      expect(() => {
        ValidationUtils.validateEmailsArray([], 'Employee Emails');
      }).toThrow(new ValidationError('Employee Emails are required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED));
    });
  });

  describe('validateCallerId', () => {
    it('should return trimmed caller ID when valid', () => {
      const result = ValidationUtils.validateCallerId('  test-caller-id  ');
      expect(result).toBe('test-caller-id');
    });

    it('should throw error when caller ID is null', () => {
      expect(() => {
        ValidationUtils.validateCallerId(null);
      }).toThrow(new ValidationError('Caller ID is required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED));
    });

    it('should throw error when caller ID is undefined', () => {
      expect(() => {
        ValidationUtils.validateCallerId(undefined);
      }).toThrow(new ValidationError('Caller ID is required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED));
    });

    it('should throw error when caller ID is empty string', () => {
      expect(() => {
        ValidationUtils.validateCallerId('');
      }).toThrow(new ValidationError('Caller ID is required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED));
    });

    it('should throw error when caller ID is whitespace only', () => {
      expect(() => {
        ValidationUtils.validateCallerId('   ');
      }).toThrow(new ValidationError('Caller ID is required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED));
    });
  });
});
