/**
 * @file
 * CRUD client for User Management endpoints with pagination support.
 *
 * Endpoints:
 *  - GET   /api/GetUsersByRole?role=<role>&page=<page>&pageSize=<pageSize>
 *      → { total: number; page: number; pageSize: number; users: UserByRole[] }
 *      • `<role>` can be:
 *         - "Admin"      (only admins)
 *         - "Supervisor" (only supervisors)
 *         - "Employee"   (only employees)
 *         - "Tenant"     (only users with no App Role)
 *         - "All"        (all users with any App Role)
 *         - Comma-separated list, e.g. "Supervisor,Tenant"
 *  - POST  /api/ChangeUserRole
 *      → void
 *  - POST  /api/ChangeSupervisor
 *      → { updatedCount: number }
 */

import apiClient from "./apiClient";

//
// Data Types
//

/**
 * Allowed values for the `role` query parameter on GetUsersByRole.
 */
export type UserRoleParam =
  | "Admin"
  | "Supervisor"
  | "Employee"
  | "Tenant"
  | "All"
  | `${"Admin" | "Supervisor" | "Employee" | "Tenant"},${string}`;

/**
 * Represents a user returned by GetUsersByRole.
 */
export interface UserByRole {
  /** Azure AD object ID */
  azureAdObjectId: string;
  /** User’s email or UPN */
  email: string;
  /** First name parsed from display name */
  firstName: string;
  /** Last name parsed from display name */
  lastName: string;
  /**
   * Current App Role, or `null` for tenant users:
   * - "Admin" | "Supervisor" | "Employee" | null
   */
  role: "Admin" | "Supervisor" | "Employee" | null;
  /** (Optional) Azure AD object ID of assigned supervisor */
  supervisorAdId?: string;
  /** (Optional) Display name of assigned supervisor */
  supervisorName?: string;
}

/**
 * Standard paged response wrapper.
 */
export interface PagedResponse<T> {
  /** Total number of items matching the query (before paging) */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Items for this page */
  users: T[];
}

/**
 * Payload for ChangeUserRole.
 */
export interface ChangeUserRolePayload {
  /** Target user’s email */
  userEmail: string;
  /**
   * New role to assign, or `null` to remove all roles
   * (user becomes a tenant user).
   */
  newRole: "Admin" | "Supervisor" | "Employee" | null;
}

/**
 * Payload for ChangeSupervisor.
 */
export interface ChangeSupervisorPayload {
  /** Array of employee emails to reassign */
  userEmails: string[];
  /** New supervisor’s email */
  newSupervisorEmail: string | null;  
}

//
// API Functions
//

/**
 * Fetches users filtered by App Role (and optionally tenant users) with server-side paging.
 *
 * @param roleParam
 *   One of:
 *    - `"Admin"`      → only admins
 *    - `"Supervisor"` → only supervisors
 *    - `"Employee"`   → only employees
 *    - `"Tenant"`     → only users with no App Role
 *    - `"All"`        → all users with any App Role
 *    - Comma-separated list, e.g. `"Supervisor,Tenant"`
 * @param page
 *   1-based page number. Defaults to `1`.
 * @param pageSize
 *   Number of items per page. Defaults to `50`.
 *
 * @returns Promise resolving to a `PagedResponse<UserByRole>`.
 *
 * @example
 * ```ts
 * // Fetch first 20 supervisors
 * const { total, page, pageSize, users } =
 *   await getUsersByRole("Supervisor", 1, 20);
 *
 * // Fetch tenant users (no paging)
 * const { users: allTenants } = await getUsersByRole("Tenant");
 * ```
 */
export async function getUsersByRole(
  roleParam: UserRoleParam,
  page: number = 1,
  pageSize: number = 50
): Promise<PagedResponse<UserByRole>> {
  const params = new URLSearchParams({
    role: roleParam,
    page: String(page),
    pageSize: String(pageSize),
  });

  const res = await apiClient.get<{
    total: number;
    page: number;
    pageSize: number;
    users: UserByRole[];
  }>(`/api/GetUsersByRole?${params.toString()}`);

  return {
    total: res.data.total,
    page: res.data.page,
    pageSize: res.data.pageSize,
    users: res.data.users,
  };
}

/**
 * Assigns or removes an App Role from a user.
 *
 * @param payload.userEmail - Target user’s email.
 * @param payload.newRole   - New role to assign, or `null` to clear all roles.
 *
 * @returns Promise resolving when the operation completes.
 *
 * @example
 * ```ts
 * // Assign Supervisor role:
 * await changeUserRole({ userEmail: "jane@foo.com", newRole: "Supervisor" });
 * // Remove all roles:
 * await changeUserRole({ userEmail: "bob@foo.com", newRole: null });
 * ```
 */
export async function changeUserRole(
  payload: ChangeUserRolePayload
): Promise<void> {
  await apiClient.post("/api/ChangeUserRole", payload);
}

/**
 * Reassigns one or more employees to a new supervisor.
 *
 * @param payload.userEmails         - Array of employee emails.
 * @param payload.newSupervisorEmail - Supervisor’s email, or null to clear.
 * @returns Promise resolving to the number of records updated.
 */
export async function changeSupervisor(
  payload: ChangeSupervisorPayload
): Promise<number> {
  // Si es null, enviamos JSON null; si no, la cadena
  const res = await apiClient.post<{ updatedCount: number }>(
    "/api/ChangeSupervisor",
    payload
  );
  return res.data.updatedCount;
}

/**
 * Fetches the list of PSO email addresses the current user may view.
 *
 * Calls GET `/api/MyPsos` and returns the array of lower-cased email strings.
 *
 * @returns Promise resolving to an array of PSO emails.
 *
 * @example
 * ```ts
 * const myPsos = await getMyPsos();
 * // ["alice@example.com", "bob@example.com", …]
 * ```
 */
export async function getMyPsos(): Promise<string[]> {
  const response = await apiClient.get<{ psos: string[] }>('/api/GetPsosBySupervisor');
  return response.data.psos;
}
