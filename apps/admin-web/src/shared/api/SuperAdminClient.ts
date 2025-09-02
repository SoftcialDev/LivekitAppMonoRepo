import apiClient from "./apiClient";

/**
 * @file Super Admin API client.
 * @description
 * Minimal Axios-based helpers for:
 * - `GET    /api/superAdmins`
 * - `POST   /api/superAdmins`            (body: `{ email }`)
 * - `DELETE /api/superAdmins/{id}`
 *
 * Notes:
 * - Maps backend role `"SuperAdmin"` → display label `"Super Admin"` for UI.
 * - Returns ISO date strings exactly as sent by the server.
 */

//////////////////////////
// Types (backend/raw)
//////////////////////////

/**
 * Raw role values as returned by the backend (e.g., Prisma enum).
 */
type RawUserRole = "SuperAdmin" | "Admin" | "Employee" | "ContactManager";

/**
 * Raw DTO returned by the backend for Super Admin users.
 */
interface BackendSuperAdminDto {
  /** Internal user ID */
  id: string;
  /** Azure AD Object ID (OID) */
  azureAdObjectId: string;
  /** Email address (lowercased) */
  email: string;
  /** Full display name */
  fullName: string;
  /** Backend role enum (e.g., "SuperAdmin") */
  role: RawUserRole;
  /** When the role was last updated (nullable ISO string) */
  roleChangedAt: string | null;
  /** Creation timestamp (ISO string) */
  createdAt: string;
  /** Update timestamp (ISO string) */
  updatedAt: string;
}

/**
 * Envelope returned by `GET /api/superAdmins`.
 */
interface ListSuperAdminsResponse {
  superAdmins: BackendSuperAdminDto[];
}

/**
 * Envelope returned by `POST /api/superAdmins`.
 */
interface CreateSuperAdminResponse {
  /** The created/updated user's internal ID */
  id: string;
}

//////////////////////////
// Types (client-facing)
//////////////////////////

/**
 * Display role values used in the UI (table-ready labels).
 */
type DisplayUserRole = "Super Admin" | "Admin" | "Employee" | "Contact Manager";

/**
 * DTO returned by this client for UI use.
 * - `role` is a display label (e.g., "Super Admin").
 * - `roleRaw` is preserved for feature flags or logic checks.
 */
export interface SuperAdminDto {
  id: string;
  azureAdObjectId: string;
  email: string;
  fullName: string;
  /** Role value formatted for UI, e.g., "Super Admin". */
  role: DisplayUserRole;
  /** Raw backend role, e.g., "SuperAdmin". */
  roleRaw: RawUserRole;
  roleChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

//////////////////////////
// Mapping helpers
//////////////////////////

/**
 * Maps a raw backend role → display role label for UI.
 *
 * @param raw Raw role from the server (e.g., "SuperAdmin").
 * @returns Display label for the UI (e.g., "Super Admin").
 */
function toDisplayRole(raw: RawUserRole): DisplayUserRole {
  switch (raw) {
    case "SuperAdmin":
      return "Super Admin";
    case "ContactManager":
      return "Contact Manager";
    case "Admin":
      return "Admin";
    case "Employee":
    default:
      return "Employee";
  }
}

/**
 * Maps a backend DTO → client-facing DTO with `role` formatted for UI.
 *
 * @param b Backend DTO from the server.
 * @returns UI-ready DTO.
 */
function mapDto(b: BackendSuperAdminDto): SuperAdminDto {
  return {
    ...b,
    role: toDisplayRole(b.role),
    roleRaw: b.role,
  };
}

//////////////////////////
// Public API
//////////////////////////

/**
 * Fetches all Super Admin users.
 *
 * @returns Promise resolving to an array of {@link SuperAdminDto} with `role` as "Super Admin".
 *
 * @example
 * ```ts
 * const items = await getSuperAdmins();
 * console.log(items[0].role); // "Super Admin"
 * ```
 */
export async function getSuperAdmins(): Promise<SuperAdminDto[]> {
  const res = await apiClient.get<ListSuperAdminsResponse>("/api/superAdmins");
  const list = Array.isArray(res.data?.superAdmins) ? res.data.superAdmins : [];
  return list.map(mapDto);
}

/**
 * Promotes a user to Super Admin by email.
 *
 * @param email Target user's email (case-insensitive).
 * @returns The created/updated user's internal ID.
 *
 * @example
 * ```ts
 * const id = await createSuperAdmin("user@example.com");
 * ```
 */
export async function createSuperAdmin(email: string): Promise<string> {
  const res = await apiClient.post<CreateSuperAdminResponse>("/api/superAdmins", { email });
  return res.data.id;
}

/**
 * Revokes Super Admin privileges for the given user ID (server demotes role).
 *
 * @param id Internal user ID to revoke.
 * @returns Promise that resolves when the operation completes.
 *
 * @example
 * ```ts
 * await deleteSuperAdmin("a1b2c3d4-...");
 * ```
 */
export async function deleteSuperAdmin(id: string): Promise<void> {
  await apiClient.delete(`/api/superAdmins/${encodeURIComponent(id)}`);
}
