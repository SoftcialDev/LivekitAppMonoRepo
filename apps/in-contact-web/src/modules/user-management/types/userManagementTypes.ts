/**
 * @fileoverview User Management type definitions
 * @summary Type definitions for user management module
 * @description Defines types and interfaces for user management pages (Admin, SuperAdmin, Supervisor, PSO, ContactManager)
 */

/**
 * Raw role values as returned by the backend Super Admin API
 * These are the actual role values stored in the database
 */
export enum BackendUserRole {
  SuperAdmin = 'SuperAdmin',
  Admin = 'Admin',
  Employee = 'Employee',
  ContactManager = 'ContactManager',
}

/**
 * Allowed values for the role query parameter on GetUsersByRole API
 * 
 * Can be a single role, comma-separated list, or special values like "All"
 */
export type UserRoleParam =
  | 'Admin'
  | 'Supervisor'
  | 'PSO'
  | 'Tenant'
  | 'null'
  | 'Unassigned'
  | 'All'
  | `${'Admin' | 'Supervisor' | 'PSO' | 'Tenant' | 'null' | 'Unassigned'},${string}`;

/**
 * Base user type returned by GetUsersByRole API
 */
export interface UserByRole {
  /**
   * Azure AD object ID
   */
  azureAdObjectId: string;

  /**
   * User's email or UPN
   */
  email: string;

  /**
   * First name parsed from display name
   */
  firstName: string;

  /**
   * Last name parsed from display name
   */
  lastName: string;

  /**
   * Current App Role, or null for tenant users
   */
  role: 'Admin' | 'Supervisor' | 'PSO' | null;

  /**
   * Optional Azure AD object ID of assigned supervisor
   */
  supervisorAdId?: string;

  /**
   * Optional display name of assigned supervisor
   */
  supervisorName?: string;

  /**
   * Optional ID field for DataTable compatibility
   */
  id?: string;
}

/**
 * Backend DTO returned by the Super Admin API (raw format)
 */
export interface BackendSuperAdminDto {
  /**
   * Internal user ID
   */
  id: string;

  /**
   * Azure AD object ID
   */
  azureAdObjectId: string;

  /**
   * Email address (lowercased)
   */
  email: string;

  /**
   * Full display name
   */
  fullName: string;

  /**
   * Raw backend role value
   */
  role: BackendUserRole;

  /**
   * When the role was last updated (nullable ISO string)
   */
  roleChangedAt: string | null;

  /**
   * Creation timestamp (ISO string)
   */
  createdAt: string;

  /**
   * Update timestamp (ISO string)
   */
  updatedAt: string;
}

/**
 * Envelope returned by GET /api/superAdmins
 */
export interface ListSuperAdminsResponse {
  /**
   * Array of super admin DTOs from the backend
   */
  superAdmins: BackendSuperAdminDto[];

  /**
   * Total count of super admins (for pagination)
   */
  totalCount: number;
}

/**
 * Super Admin DTO returned by SuperAdmin API (client-facing format)
 */
export interface SuperAdminDto {
  /**
   * Internal user ID
   */
  id: string;

  /**
   * Azure AD object ID
   */
  azureAdObjectId: string;

  /**
   * Email address (lowercased)
   */
  email: string;

  /**
   * Full display name
   */
  fullName: string;

  /**
   * Role value formatted for UI (e.g., "Super Admin")
   */
  role: string;

  /**
   * Raw backend role (e.g., "SuperAdmin")
   */
  roleRaw: BackendUserRole;

  /**
   * When the role was last updated (nullable ISO string)
   */
  roleChangedAt: string | null;

  /**
   * Creation timestamp (ISO string)
   */
  createdAt: string;

  /**
   * Update timestamp (ISO string)
   */
  updatedAt: string;
}

/**
 * Contact Manager DTO
 */
export interface ContactManagerDto {
  /**
   * Internal user ID
   */
  id: string;

  /**
   * Azure AD object ID
   */
  azureAdObjectId: string;

  /**
   * Email address
   */
  email: string;

  /**
   * Full display name
   */
  fullName: string;

  /**
   * Current status
   */
  status: string; // Using string for backward compatibility, actual type is ManagerStatus from presence/enums
}

// ContactManagerStatus moved to contactManagerTypes.ts and re-exported from presence/enums

/**
 * Standard paged response wrapper
 */
export interface PagedResponse<T> {
  /**
   * Total number of items matching the query (before paging)
   */
  total: number;

  /**
   * Current page number (1-based)
   */
  page: number;

  /**
   * Number of items per page
   */
  pageSize: number;

  /**
   * Array of items for the current page
   */
  users: T[];
}

/**
 * Request payload for changing user role
 */
export interface ChangeUserRoleRequest {
  /**
   * User email to change role for
   */
  userEmail: string;

  /**
   * New role to assign
   */
  newRole: 'Admin' | 'Supervisor' | 'PSO';
}

/**
 * Request payload for changing supervisor assignment
 */
export interface ChangeSupervisorRequest {
  /**
   * Array of user emails to transfer
   */
  userEmails: string[];

  /**
   * Email of the new supervisor
   */
  newSupervisorEmail: string;
}

/**
 * Response from ChangeSupervisor API
 */
export interface ChangeSupervisorResponse {
  /**
   * Number of users successfully updated
   */
  updatedCount: number;
}

/**
 * Request payload for deleting a user
 */
export interface DeleteUserRequest {
  /**
   * User email to delete
   */
  userEmail: string;

  /**
   * Reason for deletion
   */
  reason: string;
}

/**
 * Request payload for creating a Super Admin
 */
export interface CreateSuperAdminRequest {
  /**
   * User email to promote to Super Admin
   */
  email: string;
}

/**
 * Response from CreateSuperAdmin API
 */
export interface CreateSuperAdminResponse {
  /**
   * The created/updated user's internal ID
   */
  id: string;
}

/**
 * Maps a raw backend role to display role label for UI
 *
 * @param raw - Raw role from the server (e.g., "SuperAdmin")
 * @returns Display label for the UI (e.g., "Super Admin")
 */
export function toDisplayRole(raw: BackendUserRole): string {
  switch (raw) {
    case BackendUserRole.SuperAdmin:
      return 'Super Admin';
    case BackendUserRole.ContactManager:
      return 'Contact Manager';
    case BackendUserRole.Admin:
      return 'Admin';
    case BackendUserRole.Employee:
    default:
      return 'Employee';
  }
}

/**
 * Maps a backend DTO to client-facing DTO with role formatted for UI
 *
 * @param backendDto - Backend DTO from the server
 * @returns UI-ready DTO
 */
export function mapBackendSuperAdminDto(backendDto: BackendSuperAdminDto): SuperAdminDto {
  return {
    ...backendDto,
    role: toDisplayRole(backendDto.role),
    roleRaw: backendDto.role,
  };
}

/**
 * PSO item type for PSO management page
 * 
 * Extends UserByRole with BaseUserManagementItem for DataTable compatibility.
 * Supervisor fields (supervisorAdId, supervisorName) are already included in UserByRole.
 */
export type PsoItem = UserByRole & {
  /**
   * Required ID field for DataTable row identification
   */
  id: string;
};

