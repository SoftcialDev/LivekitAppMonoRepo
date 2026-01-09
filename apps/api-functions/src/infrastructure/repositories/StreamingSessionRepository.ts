/**
 * @fileoverview StreamingSessionRepository - Repository for streaming session data access
 * @summary Implements data access operations for streaming sessions using Prisma
 * @description Provides repository implementation for streaming session operations
 */

import { IStreamingSessionRepository } from '../../domain/interfaces/IStreamingSessionRepository';
import { StreamingSessionHistory } from '../../domain/entities/StreamingSessionHistory';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { wrapStreamingSessionFetchError, wrapEntityCreationError, wrapEntityUpdateError, wrapDatabaseQueryError } from '../../utils/error/ErrorHelpers';
import prisma from '../database/PrismaClientService';

/**
 * Repository for streaming session data access operations
 */
export class StreamingSessionRepository implements IStreamingSessionRepository {
  /**
   * Gets the latest streaming session for a user
   * @param userId - The user's database ID
   * @returns Promise that resolves to the latest session or null
   * @throws Error if database operation fails
   */
  async getLatestSessionForUser(userId: string): Promise<StreamingSessionHistory | null> {
    try {
      const session = await prisma.streamingSessionHistory.findFirst({
        where: { userId },
        orderBy: { startedAt: 'desc' }
      });

      return session ? StreamingSessionHistory.fromPrisma(session) : null;
    } catch (error: unknown) {
      throw wrapStreamingSessionFetchError('Failed to get latest session for user', error);
    }
  }

  /**
   * Creates a new streaming session
   * @param sessionData - Session data to create
   * @returns Promise that resolves to the created session
   * @throws Error if database operation fails
   */
  async createSession(sessionData: {
    userId: string;
    startedAt: Date;
  }): Promise<StreamingSessionHistory> {
    try {
      const session = await prisma.streamingSessionHistory.create({
        data: {
          userId: sessionData.userId,
          startedAt: sessionData.startedAt,
          createdAt: getCentralAmericaTime(),
          updatedAt: getCentralAmericaTime()
        }
      });

      return StreamingSessionHistory.fromPrisma(session);
    } catch (error: unknown) {
      throw wrapEntityCreationError('Failed to create session', error);
    }
  }

  /**
   * Updates a streaming session
   * @param sessionId - Session ID to update
   * @param updateData - Data to update
   * @returns Promise that resolves to the updated session
   * @throws Error if database operation fails
   */
  async updateSession(sessionId: string, updateData: {
    stoppedAt?: Date;
    stopReason?: string;
  }): Promise<StreamingSessionHistory> {
    try {
      const session = await prisma.streamingSessionHistory.update({
        where: { id: sessionId },
        data: {
          ...updateData,
          updatedAt: getCentralAmericaTime()
        }
      });

      return StreamingSessionHistory.fromPrisma(session);
    } catch (error: unknown) {
      throw wrapEntityUpdateError('Failed to update session', error);
    }
  }

  /**
   * Gets streaming sessions for a user within a date range
   * @param userId - The user's database ID
   * @param startDate - Start date for filtering
   * @param endDate - End date for filtering
   * @returns Promise that resolves to array of sessions
   * @throws Error if database operation fails
   */
  async getSessionsForUserInDateRange(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<StreamingSessionHistory[]> {
    try {
      const sessions = await prisma.streamingSessionHistory.findMany({
        where: {
          userId,
          startedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { startedAt: 'desc' }
      });

      return sessions.map(session => StreamingSessionHistory.fromPrisma(session));
    } catch (error: unknown) {
      throw wrapStreamingSessionFetchError('Failed to get sessions for user in date range', error);
    }
  }

  /**
   * Gets all active streaming sessions
   * @returns Promise that resolves to array of active sessions
   * @throws Error if database operation fails
   */
  async getActiveSessions(): Promise<StreamingSessionHistory[]> {
    try {
      const sessions = await prisma.streamingSessionHistory.findMany({
        where: {
          stoppedAt: null
        },
        include: {
          user: {
            select: {
              email: true,
              id: true
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      });

      return sessions.map(session => StreamingSessionHistory.fromPrisma(session));
    } catch (error: unknown) {
      throw wrapStreamingSessionFetchError('Failed to get active sessions', error);
    }
  }

  /**
   * Gets active streaming sessions for a specific supervisor
   * @param supervisorId - The supervisor's database ID
   * @returns Promise that resolves to array of active sessions for supervisor's PSOs
   * @throws Error if database operation fails
   */
  async getActiveSessionsForSupervisor(supervisorId: string): Promise<StreamingSessionHistory[]> {
    try {
      const sessions = await prisma.streamingSessionHistory.findMany({
        where: {
          stoppedAt: null,
          user: {
            supervisorId: supervisorId
          }
        },
        include: {
          user: {
            select: {
              email: true,
              id: true
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      });

      return sessions.map(session => StreamingSessionHistory.fromPrisma(session));
    } catch (error: unknown) {
      throw wrapStreamingSessionFetchError('Failed to get active sessions for supervisor', error);
    }
  }

  /**
   * Stops a streaming session for a user
   * @param userId - The ID of the user
   * @param reason - The reason for stopping the session
   * @param context - Optional Azure Functions context for logging
1   * @returns Promise that resolves to the updated session with stoppedAt, or null if no session was found
   * @throws Error if database operation fails
   */
  async stopStreamingSession(userId: string, reason: string, context?: Record<string, unknown>): Promise<StreamingSessionHistory | null> {
    try {
      const now = getCentralAmericaTime();
      
      // Find the latest open session for the user
      const openSession = await prisma.streamingSessionHistory.findFirst({
        where: {
          userId,
          stoppedAt: null
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      if (!openSession) {
        return null;
      }
        
      // Update the session with stop information and return the updated session
      const updatedSession = await prisma.streamingSessionHistory.update({
        where: { id: openSession.id },
        data: {
          stoppedAt: now,
          stopReason: reason,
          updatedAt: now
        }
      });

      return StreamingSessionHistory.fromPrisma(updatedSession);
    } catch (error: unknown) {
      throw wrapEntityUpdateError('Failed to stop streaming session', error);
    }
  }

  /**
   * Starts a new streaming session for a user
   * @param userId - The user's database ID
   * @returns Promise that resolves when the session is started
   * @throws Error if database operation fails
   */
  async startStreamingSession(userId: string): Promise<void> {
    try {
      const now = getCentralAmericaTime();
      
      // 1. Close any previous open session
      await prisma.streamingSessionHistory.updateMany({
        where: { userId, stoppedAt: null },
        data: { 
          stoppedAt: now,
          updatedAt: now 
        },
      });

      // 2. Create a new streaming session record
      await prisma.streamingSessionHistory.create({
        data: { 
          userId,
          startedAt: now,
          createdAt: getCentralAmericaTime(),
          updatedAt: getCentralAmericaTime()
        },
      });
    } catch (error: unknown) {
      throw wrapEntityCreationError('Failed to start streaming session', error);
    }
  }

  /**
   * Gets the last streaming session for a user
   * @param userId - The user's database ID
   * @returns Promise that resolves to the last session or null
   * @throws Error if database operation fails
   */
  async getLastStreamingSession(userId: string): Promise<StreamingSessionHistory | null> {
    try {
      const session = await prisma.streamingSessionHistory.findFirst({
        where: { userId },
        orderBy: { startedAt: 'desc' }
      });

      return session ? StreamingSessionHistory.fromPrisma(session) : null;
    } catch (error: unknown) {
      throw wrapStreamingSessionFetchError('Failed to get last streaming session', error);
    }
  }

  /**
   * Checks if a user is currently streaming
   * @param userId - The user's database ID
   * @returns Promise that resolves to true if streaming, false otherwise
   * @throws Error if database operation fails
   */
  async isUserStreaming(userId: string): Promise<boolean> {
    try {
      const openCount = await prisma.streamingSessionHistory.count({
        where: { userId, stoppedAt: null }
      });
      
      return openCount > 0;
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to check if user is streaming', error);
    }
  }

  /**
   * Gets latest streaming sessions for multiple emails in batch
   * Uses DISTINCT ON to ensure only the most recent session per email
   * @param emails - Array of email addresses to query
   * @returns Promise that resolves to array of sessions with user info, one per email
   * @throws Error if database operation fails
   * @example
   * const sessions = await repository.getLatestSessionsForEmails(['user1@example.com', 'user2@example.com']);
   * // Returns: [{ email: 'user1@example.com', session: StreamingSessionHistory | null }, ...]
   */
  async getLatestSessionsForEmails(emails: string[]): Promise<Array<{
    email: string;
    session: StreamingSessionHistory | null;
  }>> {
    try {
      const sessions = await prisma.$queryRaw`
        SELECT DISTINCT ON (u.email) 
          ssh.id, ssh."userId", ssh."startedAt", ssh."stoppedAt", 
          ssh."createdAt", ssh."updatedAt", ssh."stopReason",
          u.email
        FROM "StreamingSessionHistory" ssh
        JOIN "User" u ON ssh."userId" = u.id
        WHERE u.email = ANY(${emails})
        ORDER BY u.email, ssh."updatedAt" DESC
      ` as Array<{
        id: string;
        userId: string;
        startedAt: Date;
        stoppedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        stopReason: string | null;
        email: string;
      }>;

      const sessionsByEmail = new Map<string, StreamingSessionHistory>();
      sessions.forEach(session => {
        const email = session.email;
        sessionsByEmail.set(email, StreamingSessionHistory.fromPrisma({
          id: session.id,
          userId: session.userId,
          startedAt: session.startedAt,
          stoppedAt: session.stoppedAt,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          stopReason: session.stopReason,
          user: { email: session.email, id: session.userId }
        }));
      });

      return emails.map(email => ({
        email,
        session: sessionsByEmail.get(email) || null
      }));
    } catch (error: unknown) {
      throw wrapStreamingSessionFetchError('Failed to get latest sessions for emails', error);
    }
  }
}
