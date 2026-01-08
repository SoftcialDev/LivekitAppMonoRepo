/**
 * @fileoverview UserDebugTypes - Type definitions for user debug information
 * @summary Defines types and interfaces for user debug data structures
 * @description Encapsulates type definitions for comprehensive user debug information
 * including roles, permissions, Contact Manager profiles, and supervisor information
 */

import { UserRole, ContactManagerStatus } from '@prisma/client';
import { Role } from '../entities/Role';

/**
 * Role assignment data with metadata
 * @description Represents role assignment information with role entity and assignment timestamp
 */
export interface RoleAssignmentData {
  /**
   * Role unique identifier
   */
  roleId: string;
  /**
   * Role domain entity
   */
  role: Role;
  /**
   * Role assignment timestamp
   */
  assignedAt: Date;
}

/**
 * Contact Manager profile information
 * @description Represents Contact Manager profile data for debug purposes
 */
export interface ContactManagerProfileInfo {
  /**
   * Profile unique identifier
   */
  id: string;
  /**
   * Current Contact Manager status
   */
  status: ContactManagerStatus;
  /**
   * Profile creation timestamp
   */
  createdAt: Date;
  /**
   * Profile last update timestamp
   */
  updatedAt: Date;
}

/**
 * Role assignment information
 * @description Represents a user's role assignment with metadata
 */
export interface RoleAssignmentInfo {
  /**
   * Role unique identifier
   */
  roleId: string;
  /**
   * Role display name or name
   */
  roleName: string;
  /**
   * Role assignment timestamp
   */
  assignedAt: Date;
}

/**
 * Permission information
 * @description Represents a permission with its metadata
 */
export interface PermissionInfo {
  /**
   * Permission code (format: resource:action)
   */
  code: string;
  /**
   * Permission display name
   */
  name: string;
  /**
   * Resource name
   */
  resource: string;
  /**
   * Action name
   */
  action: string;
}

/**
 * Supervisor information
 * @description Represents supervisor user data
 */
export interface SupervisorInfo {
  /**
   * User unique identifier
   */
  id: string;
  /**
   * Azure AD Object ID
   */
  azureAdObjectId: string;
  /**
   * User email address
   */
  email: string;
  /**
   * User full name
   */
  fullName: string;
}

/**
 * User basic information for debug purposes
 * @description Represents complete user data structure
 */
export interface UserDebugInfo {
  /**
   * User unique identifier
   */
  id: string;
  /**
   * Azure AD Object ID
   */
  azureAdObjectId: string;
  /**
   * User email address
   */
  email: string;
  /**
   * User full name
   */
  fullName: string;
  /**
   * User role (legacy single role)
   */
  role: UserRole | null;
  /**
   * Role change timestamp
   */
  roleChangedAt: Date | null;
  /**
   * Supervisor user identifier
   */
  supervisorId: string | null;
  /**
   * Supervisor assignment timestamp
   */
  assignedAt: Date | null;
  /**
   * User creation timestamp
   */
  createdAt: Date;
  /**
   * User last update timestamp
   */
  updatedAt: Date;
  /**
   * User deletion timestamp (soft delete)
   */
  deletedAt: Date | null;
}

