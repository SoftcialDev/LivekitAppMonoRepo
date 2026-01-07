/**
 * @fileoverview PresenceTypes - Type definitions for presence status responses
 * @summary Defines types and interfaces for presence status endpoint responses
 * @description Encapsulates presence status response data structures as types/interfaces
 */

/**
 * A single user's presence status in the paginated response,
 * including their supervisor's email and name if assigned.
 */
export interface PresenceItem {
  /** User's email address */
  email: string;
  /** User's full name (empty string if null) */
  fullName: string;
  /** Azure AD object ID */
  azureAdObjectId: string;
  /** User role, e.g. "Admin", "Supervisor", or "PSO" */
  role: string;
  /** Presence status, e.g. "online" or "offline" */
  status: string;
  /** ISO timestamp of last seen, or null if unavailable */
  lastSeenAt: string | null;
  /** Supervisor's email address, or null if none assigned */
  supervisorEmail: string | null;
  /** Supervisor's full name, or null if none assigned */
  supervisorName: string | null;
  /** Supervisor's ID, or null if none assigned */
  supervisorId: string | null;
}

/**
 * Structure of the paginated presence response.
 */
export interface PaginatedPresence {
  /** Total number of matching users */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Array of presence items */
  items: PresenceItem[];
}

