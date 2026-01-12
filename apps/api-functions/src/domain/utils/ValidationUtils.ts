/**
 * @fileoverview ValidationUtils - Common validation utilities
 * @description Provides reusable validation functions for domain logic
 */

import { UserRole } from '../enums/UserRole';
import { IUserRepository } from '../interfaces/IUserRepository';
import { ISupervisorRepository } from '../interfaces/ISupervisorRepository';
import { ValidationError } from '../errors/DomainError';
import { ValidationErrorCode } from '../errors/ErrorCodes';
import { User } from '@prisma/client';
import { isValidEmailFormat } from './RegexUtils';

/**
 * Common validation utilities for domain operations
 */
export class ValidationUtils {
  /**
   * Validates if an email is provided and has correct format
   * @param email - Email to validate
   * @param fieldName - Name of the field for error messages
   * @throws ValidationError if email is invalid
   */
  static validateEmailRequired(email: string | null | undefined, fieldName: string = 'Email'): string {
    if (!email || email.trim() === '') {
      throw new ValidationError(`${fieldName} is required`, ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED);
    }
    return email.toLowerCase().trim();
  }

  /**
   * Validates if an email has correct format
   * @param email - Email to validate
   * @param fieldName - Name of the field for error messages
   * @throws ValidationError if email format is invalid
   */
  static validateEmailFormat(email: string, fieldName: string = 'Email'): string {
    if (!isValidEmailFormat(email)) {
      throw new ValidationError(`Invalid ${fieldName.toLowerCase()} format`, ValidationErrorCode.INVALID_EMAIL_FORMAT);
    }
    return email.toLowerCase().trim();
  }

  /**
   * Validates if a user exists and is active
   * @param userRepository - User repository for data access
   * @param email - User email to validate
   * @param fieldName - Name of the field for error messages
   * @returns Promise that resolves to user if valid
   * @throws ValidationError if user is invalid
   */
  static async validateUserExists(
    userRepository: IUserRepository, 
    email: string, 
    fieldName: string = 'User'
  ): Promise<User> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ValidationError(`${fieldName} not found`, ValidationErrorCode.TARGET_USER_NOT_FOUND);
    }
    if (user.deletedAt) {
      throw new ValidationError(`${fieldName} is inactive`, ValidationErrorCode.TARGET_USER_NOT_FOUND);
    }
    return user;
  }

  /**
   * Validates if a user is a PSO
   * @param userRepository - User repository for data access
   * @param email - User email to validate
   * @param fieldName - Name of the field for error messages
   * @returns Promise that resolves to user if valid
   * @throws ValidationError if user is not a PSO
   */
  static async validateUserIsPSO(
    userRepository: IUserRepository, 
    email: string, 
    fieldName: string = 'User'
  ): Promise<User> {
    const user = await this.validateUserExists(userRepository, email, fieldName);
    if (user.role !== UserRole.PSO) {
      throw new ValidationError(`${fieldName} is not a PSO`, ValidationErrorCode.TARGET_NOT_EMPLOYEE);
    }
    return user;
  }

  /**
   * Validates if a user is a supervisor
   * @param supervisorRepository - Supervisor repository for data access
   * @param email - Supervisor email to validate
   * @param fieldName - Name of the field for error messages
   * @returns Promise that resolves to supervisor if valid
   * @throws ValidationError if user is not a supervisor
   */
  static async validateUserIsSupervisor(
    supervisorRepository: ISupervisorRepository, 
    email: string, 
    fieldName: string = 'Supervisor'
  ): Promise<User> {
    const supervisor = await supervisorRepository.findByEmail(email);
    if (!supervisor) {
      throw new ValidationError(`${fieldName} not found`, ValidationErrorCode.TARGET_USER_NOT_FOUND);
    }
    if (supervisor.deletedAt) {
      throw new ValidationError(`${fieldName} is inactive`, ValidationErrorCode.TARGET_USER_NOT_FOUND);
    }
    if (supervisor.role !== UserRole.Supervisor) {
      throw new ValidationError(`${fieldName} is not a supervisor`, ValidationErrorCode.TARGET_NOT_EMPLOYEE);
    }
    return supervisor;
  }

  /**
   * Validates if an array of emails is provided and not empty
   * @param emails - Array of emails to validate
   * @param fieldName - Name of the field for error messages
   * @throws ValidationError if emails array is invalid
   */
  static validateEmailsArray(emails: string[], fieldName: string = 'User emails'): string[] {
    if (!emails || emails.length === 0) {
      throw new ValidationError(`${fieldName} are required`, ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED);
    }
    return emails.map(email => this.validateEmailFormat(email, fieldName));
  }

  /**
   * Validates if a caller ID is provided
   * @param callerId - Caller ID to validate
   * @throws ValidationError if caller ID is missing
   */
  static validateCallerId(callerId: string | null | undefined): string {
    if (!callerId || callerId.trim() === '') {
      throw new ValidationError('Caller ID is required', ValidationErrorCode.EMPLOYEE_EMAIL_REQUIRED);
    }
    return callerId.trim();
  }
}
