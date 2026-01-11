/**
 * @fileoverview Talk session status types
 * @summary Type definitions for talk session status hook
 * @description Types for managing active talk session status checking
 */

/**
 * Options for useTalkSessionStatus hook
 */
export interface IUseTalkSessionStatusOptions {
  /**
   * Email of the PSO to check for active talk sessions
   */
  psoEmail: string | null | undefined;
  /**
   * Whether polling is enabled (default: true)
   */
  enabled?: boolean;
  /**
   * Polling interval in milliseconds (default: 5000)
   */
  pollInterval?: number;
}

/**
 * Return type for useTalkSessionStatus hook
 */
export interface IUseTalkSessionStatusReturn {
  /**
   * Whether the PSO has an active talk session
   */
  hasActiveSession: boolean;
  /**
   * ID of the active session (if any)
   */
  sessionId: string | null;
  /**
   * Email of the supervisor in the active session (if any)
   */
  supervisorEmail: string | null;
  /**
   * Name of the supervisor in the active session (if any)
   */
  supervisorName: string | null;
  /**
   * Whether the status is currently being fetched
   */
  loading: boolean;
  /**
   * Error message if status check failed
   */
  error: string | null;
  /**
   * Manually refresh the status
   */
  refetch: () => Promise<void>;
}

