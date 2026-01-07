/**
 * @fileoverview IStreamingSessionRepository - Interface for streaming session data access
 * @summary Defines the contract for streaming session repository operations
 * @description Provides the interface for streaming session data access operations
 */

import { StreamingSessionHistory } from '../entities/StreamingSessionHistory';

/**
 * Interface for streaming session repository
 * Defines the contract for data access operations related to streaming sessions
 */
export interface IStreamingSessionRepository {
  /**
   * Gets the latest streaming session for a user
   * @param userId - The user's database ID
   * @returns Promise that resolves to the latest session or null
   * @throws Error if database operation fails
   */
  getLatestSessionForUser(userId: string): Promise<StreamingSessionHistory | null>;

  /**
   * Creates a new streaming session
   * @param sessionData - Session data to create
   * @returns Promise that resolves to the created session
   * @throws Error if database operation fails
   */
  createSession(sessionData: {
    userId: string;
    startedAt: Date;
  }): Promise<StreamingSessionHistory>;

  /**
   * Updates a streaming session
   * @param sessionId - Session ID to update
   * @param updateData - Data to update
   * @returns Promise that resolves to the updated session
   * @throws Error if database operation fails
   */
  updateSession(sessionId: string, updateData: {
    stoppedAt?: Date;
    stopReason?: string;
  }): Promise<StreamingSessionHistory>;

  /**
   * Gets streaming sessions for a user within a date range
   * @param userId - The user's database ID
   * @param startDate - Start date for filtering
   * @param endDate - End date for filtering
   * @returns Promise that resolves to array of sessions
   * @throws Error if database operation fails
   */
  getSessionsForUserInDateRange(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<StreamingSessionHistory[]>;

  /**
   * Gets all active streaming sessions
   * @returns Promise that resolves to array of active sessions
   * @throws Error if database operation fails
   */
  getActiveSessions(): Promise<StreamingSessionHistory[]>;

  /**
   * Gets active streaming sessions for a specific supervisor
   * @param supervisorId - The supervisor's database ID
   * @returns Promise that resolves to array of active sessions for supervisor's PSOs
   * @throws Error if database operation fails
   */
  getActiveSessionsForSupervisor(supervisorId: string): Promise<StreamingSessionHistory[]>;

  /**
   * Starts a new streaming session for a user
   * @param userId - The user's database ID
   * @returns Promise that resolves when the session is started
   * @throws Error if database operation fails
   */
  startStreamingSession(userId: string): Promise<void>;

  /**
   * Stops a streaming session for a user
   * @param userId - The user's database ID
   * @param reason - The reason for stopping the session
   * @param context - Optional Azure Functions context for logging
   * @returns Promise that resolves when the session is stopped
   * @throws Error if database operation fails
   */
  stopStreamingSession(userId: string, reason: string, context?: any): Promise<void>;

  /**
   * Gets the last streaming session for a user
   * @param userId - The user's database ID
   * @returns Promise that resolves to the last session or null
   * @throws Error if database operation fails
   */
  getLastStreamingSession(userId: string): Promise<StreamingSessionHistory | null>;

  /**
   * Checks if a user is currently streaming
   * @param userId - The user's database ID
   * @returns Promise that resolves to true if streaming, false otherwise
   * @throws Error if database operation fails
   */
  isUserStreaming(userId: string): Promise<boolean>;

  /**
   * Gets latest streaming sessions for multiple emails in batch
   * @param emails - Array of email addresses
   * @returns Promise that resolves to array of sessions with user info
   * @throws Error if database operation fails
   */
  getLatestSessionsForEmails(emails: string[]): Promise<Array<{
    email: string;
    session: StreamingSessionHistory | null;
  }>>;
}
