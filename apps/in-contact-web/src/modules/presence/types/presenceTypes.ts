/**
 * @fileoverview Presence type definitions
 * @summary Type definitions for presence module
 * @description Defines interfaces and types for user presence and status
 */

import { PresenceStatus, ManagerStatus } from '../enums';
import { UserRole } from '@/modules/auth/enums';
import { WEBSOCKET_MESSAGE_TYPES } from '@/shared/services/webSocket/constants/webSocketConstants';

/**
 * User status information
 * 
 * Represents a user's current status including presence, role, and supervisor information.
 */
export interface UserStatus {
  /**
   * User's email address (unique identifier)
   */
  email: string;

  /**
   * User's full name
   */
  fullName: string;

  /**
   * User's display name (alias for fullName)
   */
  name: string;

  /**
   * Current presence status
   */
  status: PresenceStatus;

  /**
   * Azure AD object ID
   */
  azureAdObjectId: string | null;

  /**
   * Timestamp when user was last seen
   */
  lastSeenAt?: string;

  /**
   * User's role in the system
   */
  role?: UserRole;

  /**
   * Contact Manager availability status (only for ContactManager role)
   */
  cmStatus?: ManagerStatus;

  /**
   * Supervisor ID (for PSOs)
   */
  supervisorId?: string | null;

  /**
   * Supervisor email (for PSOs)
   */
  supervisorEmail?: string | null;

  /**
   * Supervisor name (for PSOs)
   */
  supervisorName?: string | null;
}

/**
 * Presence message from WebSocket
 */
export interface PresenceMessage {
  /**
   * Message type
   */
  type: typeof WEBSOCKET_MESSAGE_TYPES.PRESENCE;

  /**
   * User status information
   */
  user: UserStatus;
}

/**
 * Options for fetching presence data
 * 
 * Used to optimize performance when fetching presence information.
 * By default, ALL users are fetched (online + offline) to ensure sidebar
 * can display all users. Use `onlyOnline: true` only for performance-critical
 * scenarios where offline users are not needed.
 */
export interface FetchPresenceOptions {
  /**
   * If true, only fetch online users (performance optimization)
   * Default: false (fetches both online and offline - required for sidebar)
   */
  onlyOnline?: boolean;

  /**
   * Maximum number of users to fetch (for performance)
   * Default: PRESENCE_MAX_INITIAL_USERS (1000)
   * Set to undefined for no limit (not recommended for large systems)
   */
  maxUsers?: number;
}

/**
 * Response from presence API snapshot
 */
export interface PresenceSnapshotResponse {
  /**
   * Users currently online
   */
  online: UserStatus[];

  /**
   * Users currently offline
   */
  offline: UserStatus[];
}

/**
 * Individual presence record from API
 * 
 * Note: The API returns status as 'online' | 'offline' strings,
 * which we then convert to PresenceStatus enum values.
 */
export interface PresenceItem {
  /**
   * User's email
   */
  email: string;

  /**
   * User's full name
   */
  fullName: string;

  /**
   * Current status (from API as string, converted to enum)
   */
  status: PresenceStatus | 'online' | 'offline';

  /**
   * Last seen timestamp
   */
  lastSeenAt: string;

  /**
   * User's role
   */
  role?: UserRole;

  /**
   * Supervisor ID
   */
  supervisorId?: string | null;

  /**
   * Supervisor email
   */
  supervisorEmail?: string | null;
}

/**
 * Paginated presence response from API
 */
export interface PagedPresenceResponse {
  /**
   * Total number of users
   */
  total: number;

  /**
   * Current page number
   */
  page: number;

  /**
   * Page size
   */
  pageSize: number;

  /**
   * Array of presence items
   */
  items: PresenceItem[];
}

/**
 * Information for updating supervisor info in presence store
 */
export interface SupervisorInfoUpdate {
  /**
   * Array of PSO emails affected
   */
  psoEmails: string[];

  /**
   * New supervisor email
   */
  newSupervisorEmail: string;

  /**
   * New supervisor ID
   */
  newSupervisorId?: string;

  /**
   * New supervisor name
   */
  newSupervisorName?: string;
}

