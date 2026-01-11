/**
 * @fileoverview PSO streaming status types
 * @summary Type definitions for PSO streaming status hook
 * @description Types for managing PSO streaming session status
 */

/**
 * PSO streaming session data
 */
export interface IPsoStreamingSession {
  id: string;
  userId: string;
  startedAt: string;
  stoppedAt: string | null;
  stopReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * PSO streaming status information
 */
export interface IPsoStreamingStatus {
  email: string;
  hasActiveSession: boolean;
  lastSession: {
    stopReason: string | null;
    stoppedAt: string | null;
  } | null;
}

