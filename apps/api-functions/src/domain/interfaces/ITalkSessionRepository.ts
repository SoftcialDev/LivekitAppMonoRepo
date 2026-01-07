/**
 * @fileoverview ITalkSessionRepository - Interface for talk session data access
 * @summary Defines the contract for talk session repository operations
 * @description Provides the interface for talk session data access operations
 */

import { TalkStopReason } from '../enums/TalkStopReason';
import { TalkSession } from '../types/TalkSessionTypes';

/**
 * Interface for talk session repository
 * Defines the contract for data access operations related to talk sessions
 */
export interface ITalkSessionRepository {
  /**
   * Creates a new talk session
   * @param sessionData - Session data to create
   * @returns Promise that resolves to the created session
   * @throws Error if database operation fails
   */
  createTalkSession(sessionData: {
    supervisorId: string;
    psoId: string;
    startedAt: Date;
  }): Promise<TalkSession>;

  /**
   * Stops a talk session
   * @param talkSessionId - The ID of the talk session to stop
   * @param stopReason - The reason for stopping the session
   * @returns Promise that resolves when the session is stopped
   * @throws Error if database operation fails
   */
  stopTalkSession(talkSessionId: string, stopReason: TalkStopReason): Promise<void>;

  /**
   * Gets an active talk session for a supervisor and PSO
   * @param supervisorId - The supervisor's database ID
   * @param psoId - The PSO's database ID
   * @returns Promise that resolves to the active session or null
   * @throws Error if database operation fails
   */
  getActiveTalkSession(supervisorId: string, psoId: string): Promise<TalkSession | null>;

  /**
   * Gets all active talk sessions for a supervisor
   * @param supervisorId - The supervisor's database ID
   * @returns Promise that resolves to array of active sessions
   * @throws Error if database operation fails
   */
  getActiveTalkSessionsForSupervisor(supervisorId: string): Promise<TalkSession[]>;

  /**
   * Gets all active talk sessions for a PSO
   * @param psoId - The PSO's database ID
   * @returns Promise that resolves to array of active sessions
   * @throws Error if database operation fails
   */
  getActiveTalkSessionsForPso(psoId: string): Promise<TalkSession[]>;

  /**
   * Gets all talk sessions with pagination and user relations
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @returns Promise that resolves to object with sessions and total count
   * @throws Error if database operation fails
   */
  getAllTalkSessionsWithRelations(
    page: number,
    limit: number
  ): Promise<{
    sessions: Array<{
      id: string;
      supervisorId: string;
      supervisor: { fullName: string; email: string };
      psoId: string;
      pso: { fullName: string; email: string };
      startedAt: Date;
      stoppedAt: Date | null;
      stopReason: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
  }>;

  /**
   * Gets a talk session by ID with PSO information
   * @param talkSessionId - The ID of the talk session
   * @returns Promise that resolves to the session with PSO email or null
   * @throws Error if database operation fails
   */
  findByIdWithPso(talkSessionId: string): Promise<{ psoEmail: string } | null>;
}

