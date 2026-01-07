/**
 * @fileoverview TalkSessionTypes - Type definitions for talk session entities
 * @summary Defines types and interfaces for talk session data structures
 * @description Encapsulates talk session entity structure
 */

import { TalkStopReason } from '../enums/TalkStopReason';

/**
 * Talk session entity structure
 * @description Represents a talk session between a supervisor and PSO
 */
export interface TalkSession {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Supervisor user identifier
   */
  supervisorId: string;

  /**
   * PSO user identifier
   */
  psoId: string;

  /**
   * Session start timestamp
   */
  startedAt: Date;

  /**
   * Session stop timestamp (null if still active)
   */
  stoppedAt: Date | null;

  /**
   * Reason for stopping the session (null if still active)
   */
  stopReason: TalkStopReason | null;

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Last update timestamp
   */
  updatedAt: Date;
}

