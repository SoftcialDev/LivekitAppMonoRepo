/**
 * @fileoverview Talk session type definitions
 * @summary Type definitions for talk session reports
 * @description Defines interfaces and types for talk session reports and API responses
 */

/**
 * Talk session report returned by the API
 */
export interface TalkSessionReport {
  /**
   * Unique identifier for the talk session
   */
  id: string;

  /**
   * Supervisor ID who started the session
   */
  supervisorId: string;

  /**
   * Full name of the supervisor
   */
  supervisorName: string;

  /**
   * Email of the supervisor
   */
  supervisorEmail: string;

  /**
   * PSO ID
   */
  psoId: string;

  /**
   * Full name of the PSO
   */
  psoName: string;

  /**
   * Email of the PSO
   */
  psoEmail: string;

  /**
   * ISO-8601 timestamp when session started
   */
  startedAt: string;

  /**
   * ISO-8601 timestamp when session stopped (null if still active)
   */
  stoppedAt: string | null;

  /**
   * Reason why the session was stopped (null if still active)
   */
  stopReason: string | null;

  /**
   * ISO-8601 timestamp when session was created
   */
  createdAt: string;

  /**
   * ISO-8601 timestamp when session was last updated
   */
  updatedAt: string;
}

/**
 * Response from getTalkSessions API
 */
export interface GetTalkSessionsResponse {
  /**
   * Array of talk session reports
   */
  sessions: TalkSessionReport[];

  /**
   * Total number of sessions
   */
  total: number;

  /**
   * Current page number (1-based)
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Whether there are more pages
   */
  hasMore: boolean;
}

