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
 * Supervisor user record returned by GetSupervisorByIdentifier.
 */
export interface Supervisor {
  /** Prisma User.id (UUID) */
  id: string;
  /** Azure AD object ID */
  azureAdObjectId: string;
  /** User’s email/UPN */
  email: string;
  /** User’s full display name */
  fullName: string;
}

/**
 * Represents a PSO (employee) together with their supervisor’s full name.
 */
export interface PsoWithSupervisor {
  /** The PSO’s email address, always lower‑cased. */
  email: string;
  /** The full name of this PSO’s supervisor (e.g. "Ana Gómez"). */
  supervisorName: string;

}

/**
 * Response from GetSupervisorByIdentifier.
 * - If a supervisor is assigned, `supervisor` will be present.
 * - If no supervisor is assigned, `message` will be present.
 */
export type GetSupervisorResponse =
  | { supervisor: Supervisor }
  | { message: string };

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
 * Fetches the list of PSOs (employees) the current user may view,
 * each annotated with that employee’s supervisor full name.
 *
 * Calls GET `/api/MyPsos` (Azure Function) which returns:
 * ```json
 * {
 *   "psos": [
 *     { "email": "alice@example.com", "supervisorName": "Carlos Pérez" },
 *     { "email": "bob@example.com",   "supervisorName": "María Rodríguez" }
 *   ]
 * }
 * ```
 *
 * @returns Promise resolving to an array of {@link PsoWithSupervisor}.
 *
 * @example
 * ```ts
 * const list = await getMyPsos();
 * // [
 * //   { email: "alice@example.com", supervisorName: "Carlos Pérez" },
 * //   { email: "bob@example.com",   supervisorName: "María Rodríguez" }
 * // ]
 * ```
 * @throws Will propagate any network or parsing error from axios.
 */
export async function getMyPsos(): Promise<PsoWithSupervisor[]> {
  const response = await apiClient.get<{ psos: PsoWithSupervisor[] }>('/api/GetPsosBySupervisor');
  return response.data.psos;
}

/**
 * Fetches the supervisor for a given PSO identifier.
 *
 * @param identifier
 *   The PSO’s identifier, which may be:
 *   - their User.id (UUID)
 *   - their Azure AD object ID (UUID)
 *   - their email address (UPN)
 *
 * @returns Promise resolving to a `GetSupervisorResponse`.
 *
 * @example
 * ```ts
 * // by email
 * const result = await getSupervisorByIdentifier("alice.employee@contoso.com");
 *
 * if ("supervisor" in result) {
 *   console.log("Supervisor is", result.supervisor.fullName);
 * } else {
 *   console.log(result.message); // e.g. "No supervisor assigned"
 * }
 * ```
 */
export async function getSupervisorByIdentifier(
  identifier: string
): Promise<GetSupervisorResponse> {
  const res = await apiClient.get<GetSupervisorResponse>(
    `/api/GetSupervisorByIdentifier?identifier=${encodeURIComponent(identifier)}`
  );
  return res.data;
}

/**
 * Fetches the supervisor for a given PSO identifier (ID, Azure OID or email)
 * via the Function App endpoint GetSupervisorForPso.
 *
 * @param identifier
 *   The PSO’s identifier, which may be:
 *   - their User.id (UUID)
 *   - their Azure AD object ID (UUID)
 *   - their email address (UPN)
 *
 * @returns Promise resolving to a `GetSupervisorResponse`.
 *
 * @example
 * ```ts
 * const result = await getSupervisorForPso("alice.employee@contoso.com");
 * if ("supervisor" in result) {
 *   console.log("Supervisor is", result.supervisor.fullName);
 * } else {
 *   console.log(result.message); // e.g. "No supervisor assigned"
 * }
 * ```
 */
export async function getSupervisorForPso(
  identifier: string
): Promise<GetSupervisorResponse> {
  const url = `/api/GetSupervisorForPso?identifier=${encodeURIComponent(
    identifier
  )}`;
  const res = await apiClient.get<GetSupervisorResponse>(url);
  return res.data;
}


/**
 * Transfers all PSOs currently assigned to the logged‑in supervisor
 * to another supervisor (or unassigns them if `newSupervisorEmail` is `null`).
 *
 * Calls POST `/api/TransferPsos` with body `{ newSupervisorEmail }`.
 *
 * @param newSupervisorEmail
 *   The email/UPN of the supervisor who should receive these PSOs,
 *   or `null` to clear assignment.
 * @returns Promise resolving to the number of PSOs that were transferred.
 *
 * @example
 * ```ts
 * // Move all my PSOs to bob@foo.com:
 * const count = await transferPsos("bob@foo.com");
 * console.log(`Transferred ${count} PSOs`);
 *
 * // Unassign all my PSOs:
 * const cleared = await transferPsos(null);
 * console.log(`Cleared ${cleared} PSOs`); 
 * ```
 */
export async function transferPsos(
  newSupervisorEmail: string | null
): Promise<number> {
  const res = await apiClient.post<{ transferredCount: number }>(
    "/api/TransferPsos",
    { newSupervisorEmail }
  );
  return res.data.transferredCount;
}