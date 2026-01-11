/**
 * @fileoverview createRoleBasedClient Types
 * @summary Type definitions for createRoleBasedClient factory function
 */

import type { UserRoleParam } from '../../../types';

/**
 * Allowed role values for changeUserRole API
 * Must match ChangeUserRoleRequest.newRole type
 */
export type AllowedRole = 'Admin' | 'Supervisor' | 'PSO';

/**
 * Configuration for creating a role-based client
 */
export interface RoleBasedClientConfig {
  /**
   * Role to fetch for main items (e.g., 'Admin', 'Supervisor', 'PSO')
   */
  mainRole: UserRoleParam;

  /**
   * Roles to fetch for candidates (comma-separated list)
   */
  candidateRoles: UserRoleParam;

  /**
   * New role to assign when adding items (e.g., 'Admin', 'Supervisor', 'PSO')
   * Must match ChangeUserRoleRequest.newRole type
   */
  newRole: AllowedRole;

  /**
   * Reason message for deletion
   */
  deleteReason: string;
}

