/**
 * @fileoverview IUserRepository - Domain interface for user repository
 * @description Defines the contract for user data access operations
 */

import { UserRole, ContactManagerStatus } from '@prisma/client';
import { User } from '../entities/User';
import { ContactManagerProfile } from '../entities/ContactManagerProfile';
import { SuperAdminProfile } from '../entities/SuperAdminProfile';
import { Role } from '../entities/Role';


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
   * Finds a user by database ID
   * @param id - User database ID
   * @returns Promise that resolves to user or null
   */
  findById(id: string): Promise<User | null>;

  /**
   * Finds all users in the system
   * @returns Promise that resolves to array of users
   */
  findAllUsers(): Promise<User[]>;

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
   * Checks if a user is a PSO
   * @param email - User email
   * @returns Promise that resolves to true if user is a PSO
   */
  isPSO(email: string): Promise<boolean>;

  /**
   * Updates a user's supervisor assignment
   * @param email - User email
   * @param supervisorId - Supervisor ID (null for unassign)
   * @returns Promise that resolves when update is complete
   */
  updateSupervisor(email: string, supervisorId: string | null): Promise<void>;

  /**
   * Creates a new PSO user
   * @param email - User email
   * @param fullName - User full name
   * @param supervisorId - Supervisor ID (optional)
   * @returns Promise that resolves to created user
   */
    createPSO(email: string, fullName: string, supervisorId?: string | null): Promise<User>;

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
   * Finds active users by a specific role (excludes deleted users)
   * @param role - User role to search for
   * @returns Promise that resolves to array of users with id, email, and fullName
   */
  findActiveUsersByRole(role: UserRole): Promise<Array<{ id: string; email: string; fullName: string }>>;

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

  /**
   * Creates a user with ContactManager role
   * @param userData - User data to create
   * @returns Promise that resolves to the created User entity
   */
  createContactManager(userData: {
    azureAdObjectId: string;
    email: string;
    fullName: string;
  }): Promise<User>;

  /**
   * Creates a contact manager profile
   * @param userId - The user ID
   * @param status - The initial status
   * @returns Promise that resolves to the created ContactManagerProfile entity
   */
  createContactManagerProfile(userId: string, status: ContactManagerStatus): Promise<ContactManagerProfile>;

  /**
   * Creates a contact manager status history entry
   * @param data - Status history data
   * @returns Promise that resolves when history is created
   */
  createContactManagerStatusHistory(data: {
    profileId: string;
    previousStatus: ContactManagerStatus;
    newStatus: ContactManagerStatus;
    changedById: string;
  }): Promise<void>;

  /**
   * Creates a new Super Admin user
   * @param userData - Super Admin user data
   * @returns Promise that resolves to the created user
   */
  createSuperAdmin(userData: {
    azureAdObjectId: string;
    email: string;
    fullName: string;
  }): Promise<User>;


  /**
   * Creates a Super Admin audit log entry
   * @param data - Audit log data
   * @returns Promise that resolves when log is created
   */
  createSuperAdminAuditLog(data: {
    profileId: string;
    action: string;
    changedById: string;
  }): Promise<void>;

  /**
   * Finds a Contact Manager profile by ID
   * @param profileId - Profile ID
   * @returns Promise that resolves to the profile or null
   */
  findContactManagerProfile(profileId: string): Promise<ContactManagerProfile | null>;

  /**
   * Deletes a Contact Manager profile
   * @param profileId - Profile ID
   * @returns Promise that resolves when profile is deleted
   */
  deleteContactManagerProfile(profileId: string): Promise<void>;

  /**
   * Creates a Contact Manager audit log entry
   * @param data - Audit log data
   * @returns Promise that resolves when log is created
   */
  createContactManagerAuditLog(data: {
    profileId: string;
    action: string;
    changedById: string;
  }): Promise<void>;

  /**
   * Finds all Contact Manager profiles with their associated users
   * @returns Promise that resolves to array of ContactManagerProfile entities
   */
  findAllContactManagers(): Promise<ContactManagerProfile[]>;

  /**
   * Finds a Contact Manager profile by user ID
   * @param userId - User ID
   * @returns Promise that resolves to the profile or null
   */
  findContactManagerProfileByUserId(userId: string): Promise<ContactManagerProfile | null>;

  /**
   * Finds all Super Admin profiles with their associated users
   * @returns Promise that resolves to array of SuperAdminProfile entities
   */
  findAllSuperAdmins(): Promise<SuperAdminProfile[]>;

  /**
   * Updates a Contact Manager's status
   * @param profileId - Profile ID
   * @param status - New status
   * @returns Promise that resolves when status is updated
   */
  updateContactManagerStatus(profileId: string, status: ContactManagerStatus): Promise<void>;

  /**
   * Gets PSOs by supervisor with their supervisor information
   * @param supervisorId - Optional supervisor ID to filter PSOs
   * @returns Promise that resolves to array of PSOs with supervisor information
   */
  getPsosBySupervisor(supervisorId?: string): Promise<Array<{ email: string; supervisorName: string }>>;

  /**
   * Finds users by roles with supervisor information (returns raw Prisma data)
   * @param roles - Array of user roles
   * @returns Promise that resolves to array of raw Prisma users with supervisor info
   */
  findByRolesWithSupervisor(roles: UserRole[]): Promise<any[]>;

  /**
   * Finds users with unassigned role with supervisor information (returns raw Prisma data)
   * @returns Promise that resolves to array of raw Prisma users with supervisor info
   */
  findUsersWithUnassignedRoleWithSupervisor(): Promise<any[]>;

  /**
   * Gets active roles for a user (by Azure AD object id).
   * @param azureAdObjectId Azure AD object id.
   */
  getActiveRolesByAzureId(azureAdObjectId: string): Promise<Role[]>;

  /**
   * Gets effective permission codes for a user (union of active roles).
   * @param azureAdObjectId Azure AD object id.
   */
  getEffectivePermissionCodesByAzureId(azureAdObjectId: string): Promise<string[]>;
}
