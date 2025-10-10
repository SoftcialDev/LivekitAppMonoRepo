/**
 * @fileoverview SupervisorManagementService - Domain service for supervisor management
 * @description Handles supervisor management logic that can be reused across handlers
 */

import { UserRole } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { ISupervisorRepository } from '../interfaces/ISupervisorRepository';
import { ISupervisorManagementService } from '../interfaces/ISupervisorManagementService';
import { SupervisorAssignment } from '../value-objects/SupervisorAssignment';
import { SupervisorChangeResult } from '../value-objects/SupervisorChangeResult';
import { SupervisorError, ValidationError } from '../errors/DomainError';
import { SupervisorErrorCode, ValidationErrorCode } from '../errors/ErrorCodes';

/**
 * Domain service for supervisor management operations
 */
export class SupervisorManagementService implements ISupervisorManagementService {
  private userRepository: IUserRepository;
  private supervisorRepository: ISupervisorRepository;

  /**
   * Creates a new SupervisorManagementService instance
   * @param userRepository - User repository for data access
   * @param supervisorRepository - Supervisor repository for data access
   */
  constructor(userRepository: IUserRepository, supervisorRepository: ISupervisorRepository) {
    this.userRepository = userRepository;
    this.supervisorRepository = supervisorRepository;
  }

  /**
   * Changes supervisor for multiple users
   * @param assignment - The supervisor assignment operation
   * @returns Promise that resolves to supervisor change result
   * @throws SupervisorError if assignment fails
   */
  async changeUserSupervisor(assignment: SupervisorAssignment): Promise<SupervisorChangeResult> {
    let updatedCount = 0;
    let skippedCount = 0;

    for (const email of assignment.userEmails) {
      const existing = await this.userRepository.findByEmail(email);

      // Skip if user already exists with non-Employee role
      if (existing && existing.role && existing.role !== UserRole.Employee) {
        skippedCount++;
        continue;
      }

      // Update or create user with supervisor assignment
      try {
        await this.updateUserSupervisor(email, assignment.newSupervisorEmail);
        updatedCount++;
      } catch (error) {
        throw new SupervisorError(
          `Failed to update supervisor for user ${email}: ${(error as Error).message}`,
          SupervisorErrorCode.SUPERVISOR_ASSIGNMENT_FAILED
        );
      }
    }

    return SupervisorChangeResult.withSkipped(updatedCount, skippedCount);
  }

  /**
   * Validates supervisor assignment
   * @param supervisorEmail - Email of the supervisor to assign
   * @returns Promise that resolves to supervisor ID or null if unassign
   * @throws ValidationError if supervisor is invalid
   */
  async validateSupervisorAssignment(supervisorEmail: string | null): Promise<string | null> {
    if (!supervisorEmail) {
      return null; // Unassign operation
    }

    const supervisor = await this.supervisorRepository.findByEmail(supervisorEmail);
    if (!supervisor) {
      throw new ValidationError(
        'Supervisor not found',
        ValidationErrorCode.TARGET_USER_NOT_FOUND
      );
    }

    if (supervisor.deletedAt) {
      throw new ValidationError(
        'Supervisor is inactive',
        ValidationErrorCode.TARGET_NOT_EMPLOYEE
      );
    }

    if (supervisor.role !== UserRole.Supervisor) {
      throw new ValidationError(
        'Target is not a Supervisor',
        ValidationErrorCode.TARGET_NOT_EMPLOYEE
      );
    }

    return supervisor.id;
  }

  /**
   * Validates that users can have supervisor changed
   * @param userEmails - Emails of users to validate
   * @returns Promise that resolves to valid user emails
   * @throws ValidationError if users are invalid
   */
  async validateUsersForSupervisorChange(userEmails: string[]): Promise<string[]> {
    const validEmails: string[] = [];

    for (const email of userEmails) {
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        // User doesn't exist - will be created as Employee
        validEmails.push(email);
        continue;
      }

      if (!user.isActive()) {
        throw new ValidationError(
          `User ${email} is inactive`,
          ValidationErrorCode.TARGET_USER_NOT_FOUND
        );
      }

      if (!user.isEmployee()) {
        // Skip non-employees (they will be skipped in the actual operation)
        continue;
      }

      validEmails.push(email);
    }

    return validEmails;
  }

  /**
   * Updates user supervisor assignment
   * @param email - User email
   * @param supervisorEmail - Supervisor email (null for unassign)
   * @returns Promise that resolves when update is complete
   */
  private async updateUserSupervisor(email: string, supervisorEmail: string | null): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    
    if (user) {
      // Update existing user's supervisor
      let supervisorId: string | null = null;
      if (supervisorEmail) {
        const supervisor = await this.supervisorRepository.findByEmail(supervisorEmail);
        if (supervisor) {
          supervisorId = supervisor.id;
        }
      }
      
      await this.userRepository.updateSupervisor(email, supervisorId);
    } else {
      // Create new employee user
      let supervisorId: string | null = null;
      if (supervisorEmail) {
        const supervisor = await this.supervisorRepository.findByEmail(supervisorEmail);
        if (supervisor) {
          supervisorId = supervisor.id;
        }
      }
      
      // Extract name from email (fallback)
      const fullName = email.split('@')[0].replace(/[._]/g, ' ');
      await this.userRepository.createEmployee(email, fullName, supervisorId);
    }
  }

  /**
   * Assigns supervisor to multiple users
   * @param userEmails - Array of user emails
   * @param supervisorEmail - Supervisor email (null for unassign)
   * @returns Promise that resolves to supervisor change result
   */
  async assignSupervisor(userEmails: string[], supervisorEmail: string | null): Promise<SupervisorChangeResult> {
    let supervisorId: string | null = null;
    
    if (supervisorEmail) {
      const supervisor = await this.supervisorRepository.findByEmail(supervisorEmail);
      if (!supervisor || supervisor.deletedAt || supervisor.role !== UserRole.Supervisor) {
        throw new SupervisorError('Supervisor not found or invalid', SupervisorErrorCode.SUPERVISOR_NOT_FOUND);
      }
      supervisorId = supervisor.id;
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const updates: Array<{ email: string; supervisorId: string | null }> = [];

    // Prepare all updates
    for (const email of userEmails) {
      const user = await this.userRepository.findByEmail(email);
      if (user && user.isEmployee()) {
        // Only update if supervisor is actually changing
        if (user.supervisorId !== supervisorId) {
          updates.push({ email, supervisorId });
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    // Execute all updates in a single transaction
    if (updates.length > 0) {
      await this.userRepository.updateMultipleSupervisors(updates);
      updatedCount = updates.length;
    }

    return new SupervisorChangeResult(updatedCount, skippedCount, userEmails.length);
  }
}
