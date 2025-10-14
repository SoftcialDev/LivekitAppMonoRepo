/**
 * @fileoverview StreamingSessionRepository - Repository for streaming session data access
 * @summary Implements data access operations for streaming sessions using Prisma
 * @description Provides repository implementation for streaming session operations
 */

import { IStreamingSessionRepository } from '../../domain/interfaces/IStreamingSessionRepository';
import { StreamingSessionHistory } from '../../domain/entities/StreamingSessionHistory';
import prisma from '../../services/prismaClienService';
import { getCentralAmericaTime } from '../../utils/dateUtils';

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
    } catch (error: any) {
      throw new Error(`Failed to get latest session for user: ${error.message}`);
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
    } catch (error: any) {
      throw new Error(`Failed to create session: ${error.message}`);
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
    } catch (error: any) {
      throw new Error(`Failed to update session: ${error.message}`);
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
    } catch (error: any) {
      throw new Error(`Failed to get sessions for user in date range: ${error.message}`);
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
          stoppedAt: null,
          user: {
            deletedAt: null  // Only include sessions from non-deleted users
          }
        },
        include: {
          user: {
            select: {
              email: true,
              id: true,
              fullName: true,
              role: true
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      });

      return sessions.map(session => StreamingSessionHistory.fromPrisma(session));
    } catch (error: any) {
      throw new Error(`Failed to get active sessions: ${error.message}`);
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
            supervisorId: supervisorId,
            deletedAt: null  // Only include sessions from non-deleted users
          }
        },
        include: {
          user: {
            select: {
              email: true,
              id: true,
              fullName: true,
              role: true
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      });

      return sessions.map(session => StreamingSessionHistory.fromPrisma(session));
    } catch (error: any) {
      throw new Error(`Failed to get active sessions for supervisor: ${error.message}`);
    }
  }
}
