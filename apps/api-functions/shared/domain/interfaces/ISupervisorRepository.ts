/**
 * @fileoverview ISupervisorRepository - Domain interface for supervisor repository
 * @description Defines the contract for supervisor data access operations
 */

import { User } from '../entities/User';

/**
 * Repository interface for supervisor data access
 */
export interface ISupervisorRepository {
  /**
   * Finds a supervisor by email
   * @param email - Supervisor email address
   * @returns Promise that resolves to supervisor or null
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Checks if a user is a supervisor
   * @param email - User email address
   * @returns Promise that resolves to true if user is a supervisor
   */
  isSupervisor(email: string): Promise<boolean>;

  /**
   * Finds a supervisor by ID
   * @param id - Supervisor ID
   * @returns Promise that resolves to supervisor or null
   */
  findById(id: string): Promise<User | null>;

  /**
   * Validates if a supervisor exists and is active
   * @param email - Supervisor email address
   * @returns Promise that resolves to true if supervisor exists and is active
   */
  validateSupervisor(email: string): Promise<boolean>;

  /**
   * Finds a supervisor by identifier (ID, Azure AD Object ID, or email)
   * @param identifier - The identifier to search for
   * @returns Promise that resolves to supervisor or error message
   */
  findSupervisorByIdentifier(identifier: string): Promise<User | string>;

  /**
   * Finds a PSO by identifier (ID, Azure AD Object ID, or email)
   * @param identifier - The identifier to search for
   * @returns Promise that resolves to PSO or null
   */
  findPsoByIdentifier(identifier: string): Promise<User | null>;
}
