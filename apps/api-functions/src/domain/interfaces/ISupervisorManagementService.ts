/**
 * @fileoverview ISupervisorManagementService - Domain interface for supervisor management
 * @description Defines the contract for supervisor management operations
 */

import { SupervisorChangeResult } from '../value-objects/SupervisorChangeResult';

/**
 * Interface for supervisor management service operations
 */
export interface ISupervisorManagementService {
  /**
   * Assigns supervisor to multiple users
   * @param userEmails - Array of user emails
   * @param supervisorEmail - Supervisor email (null for unassign)
   * @returns Promise that resolves to supervisor change result
   */
  assignSupervisor(userEmails: string[], supervisorEmail: string | null): Promise<SupervisorChangeResult>;

  /**
   * Validates supervisor assignment
   * @param supervisorEmail - Email of the supervisor to assign
   * @returns Promise that resolves to supervisor ID or null if unassign
   * @throws ValidationError if supervisor is invalid
   */
  validateSupervisorAssignment(supervisorEmail: string | null): Promise<string | null>;

  /**
   * Validates that users can have supervisor changed
   * @param userEmails - Emails of users to validate
   * @returns Promise that resolves to valid user emails
   * @throws ValidationError if users are invalid
   */
  validateUsersForSupervisorChange(userEmails: string[]): Promise<string[]>;
}
