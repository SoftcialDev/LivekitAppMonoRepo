/**
 * @fileoverview IUserRepository - Domain interface for user repository
 * @description Defines the contract for user data access operations
 */

import { UserRole } from '@prisma/client';
import { User } from '../entities/User';

/**
 * Repository interface for user data access
 */
export interface IUserRepository {
  /**
   * Finds a user by Azure AD object ID
   * @param azureAdObjectId - Azure AD object ID
   * @returns Promise that resolves to user or null
   */
  findByAzureAdObjectId(azureAdObjectId: string): Promise<User | null>;

  /**
   * Finds a user by email
   * @param email - User email address
   * @returns Promise that resolves to user or null
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Checks if a user exists and is not deleted
   * @param azureAdObjectId - Azure AD object ID
   * @returns Promise that resolves to true if user exists and is active
   */
  existsAndActive(azureAdObjectId: string): Promise<boolean>;

  /**
   * Checks if a user has a specific role
   * @param azureAdObjectId - Azure AD object ID
   * @param role - Role to check
   * @returns Promise that resolves to true if user has the role
   */
  hasRole(azureAdObjectId: string, role: UserRole): Promise<boolean>;

  /**
   * Checks if a user has any of the specified roles
   * @param azureAdObjectId - Azure AD object ID
   * @param roles - Array of roles to check
   * @returns Promise that resolves to true if user has any of the roles
   */
  hasAnyRole(azureAdObjectId: string, roles: UserRole[]): Promise<boolean>;

  /**
   * Checks if a user is an employee
   * @param email - User email
   * @returns Promise that resolves to true if user is an employee
   */
  isEmployee(email: string): Promise<boolean>;

  /**
   * Updates a user's supervisor assignment
   * @param email - User email
   * @param supervisorId - Supervisor ID (null for unassign)
   * @returns Promise that resolves when update is complete
   */
  updateSupervisor(email: string, supervisorId: string | null): Promise<void>;

  /**
   * Creates a new employee user
   * @param email - User email
   * @param fullName - User full name
   * @param supervisorId - Supervisor ID (optional)
   * @returns Promise that resolves to created user
   */
  createEmployee(email: string, fullName: string, supervisorId?: string | null): Promise<User>;

  /**
   * Updates multiple users' supervisor assignments in a transaction
   * @param updates - Array of user email and supervisor ID pairs
   * @returns Promise that resolves when all updates are complete
   */
  updateMultipleSupervisors(updates: Array<{ email: string; supervisorId: string | null }>): Promise<void>;

  /**
   * Gets users by supervisor ID
   * @param supervisorId - Supervisor ID
   * @returns Promise that resolves to array of users
   */
  findBySupervisor(supervisorId: string): Promise<User[]>;

  /**
   * Deletes a user by ID
   * @param userId - User ID
   * @returns Promise that resolves when user is deleted
   */
  deleteUser(userId: string): Promise<void>;

  /**
   * Upserts a user (creates or updates)
   * @param userData - User data to upsert
   * @returns Promise that resolves to user entity
   */
  upsertUser(userData: {
    email: string;
    azureAdObjectId: string;
    fullName: string;
    role: UserRole;
  }): Promise<User>;

  /**
   * Finds users by roles
   * @param roles - Array of user roles
   * @returns Promise that resolves to array of users
   */
  findByRoles(roles: UserRole[]): Promise<User[]>;

  /**
   * Finds users with unassigned role
   * @returns Promise that resolves to array of users with unassigned role
   */
  findUsersWithUnassignedRole(): Promise<User[]>;

  /**
   * Changes user role
   * @param userId - User ID
   * @param newRole - New role to assign
   * @returns Promise that resolves when role is changed
   */
  changeUserRole(userId: string, newRole: UserRole): Promise<void>;

}
