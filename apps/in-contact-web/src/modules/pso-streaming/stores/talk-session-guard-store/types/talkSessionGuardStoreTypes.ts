/**
 * @fileoverview Talk Session Guard Store Types
 * @summary Type definitions for talk session guard store
 * @description Defines types used by the talk session guard store
 */

/**
 * Registration information for an active talk session
 */
export interface TalkSessionRegistration {
  /**
   * Email of the PSO
   */
  email: string;

  /**
   * Function to stop the talk session
   */
  stopFunction: () => Promise<void>;

  /**
   * Timestamp when session was registered
   */
  registeredAt: number;
}

/**
 * State interface for talk session guard store
 */
export interface ITalkSessionGuardState {
  /**
   * Map of email to talk session registration
   */
  activeSessions: Map<string, TalkSessionRegistration>;

  /**
   * Register an active talk session
   * 
   * @param email - Email of the PSO
   * @param stopFunction - Function to stop the talk session
   */
  registerSession: (email: string, stopFunction: () => Promise<void>) => void;

  /**
   * Unregister a talk session
   * 
   * @param email - Email of the PSO
   */
  unregisterSession: (email: string) => void;

  /**
   * Check if there are any active talk sessions
   * 
   * @returns true if there are active sessions
   */
  hasActiveSessions: () => boolean;

  /**
   * Get all active session emails
   * 
   * @returns Array of emails with active sessions
   */
  getActiveSessionEmails: () => string[];

  /**
   * Stop all active sessions
   * 
   * @returns Promise that resolves when all sessions are stopped
   */
  stopAllSessions: () => Promise<void>;
}

