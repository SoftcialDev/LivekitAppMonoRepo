/**
 * @fileoverview Streaming Status client types
 * @summary Type definitions for streaming status API client
 * @description Type definitions for streaming session status operations
 */

/**
 * Details of an active streaming session.
 */
export interface StreamingSession {
  /** The employee's user ID */
  userId: any;
  /** The employee's email address */
  email: string;
  /** ISO 8601 timestamp indicating when the session began */
  startedAt: string;
}

