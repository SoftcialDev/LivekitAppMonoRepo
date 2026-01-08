/**
 * @fileoverview TalkSessionRepository - Repository for talk session data access
 * @summary Implements data access operations for talk sessions using Prisma
 * @description Provides repository implementation for talk session operations
 */

import { ITalkSessionRepository } from '../../domain/interfaces/ITalkSessionRepository';
import { TalkSession } from '../../domain/types/TalkSessionTypes';
import { TalkStopReason } from '../../domain/enums/TalkStopReason';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { wrapEntityCreationError, wrapEntityUpdateError, wrapDatabaseQueryError } from '../../utils/error/ErrorHelpers';
import prisma from '../database/PrismaClientService';
import { TalkSessionHistory } from '@prisma/client';

/**
 * Repository for talk session data access operations
 */
export class TalkSessionRepository implements ITalkSessionRepository {
  /**
   * Creates a new talk session
   * @param sessionData - Session data to create
   * @returns Promise that resolves to the created session
   * @throws Error if database operation fails
   */
  async createTalkSession(sessionData: {
    supervisorId: string;
    psoId: string;
    startedAt: Date;
  }): Promise<TalkSession> {
    try {
      const now = getCentralAmericaTime();
      const session = await prisma.talkSessionHistory.create({
        data: {
          supervisorId: sessionData.supervisorId,
          psoId: sessionData.psoId,
          startedAt: sessionData.startedAt,
          createdAt: now,
          updatedAt: now
        }
      });

      return this.mapToTalkSession(session);
    } catch (error: unknown) {
      throw wrapEntityCreationError('Failed to create talk session', error);
    }
  }

  /**
   * Stops a talk session
   * @param talkSessionId - The ID of the talk session to stop
   * @param stopReason - The reason for stopping the session
   * @returns Promise that resolves when the session is stopped
   * @throws Error if database operation fails
   */
  async stopTalkSession(talkSessionId: string, stopReason: TalkStopReason): Promise<void> {
    try {
      const now = getCentralAmericaTime();
      await prisma.talkSessionHistory.update({
        where: { id: talkSessionId },
        data: {
          stoppedAt: now,
          stopReason: stopReason,
          updatedAt: now
        }
      });
    } catch (error: unknown) {
      throw wrapEntityUpdateError('Failed to stop talk session', error);
    }
  }

  /**
   * Gets an active talk session for a supervisor and PSO
   * @param supervisorId - The supervisor's database ID
   * @param psoId - The PSO's database ID
   * @returns Promise that resolves to the active session or null
   * @throws Error if database operation fails
   */
  async getActiveTalkSession(supervisorId: string, psoId: string): Promise<TalkSession | null> {
    try {
      const session = await prisma.talkSessionHistory.findFirst({
        where: {
          supervisorId,
          psoId,
          stoppedAt: null
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      return session ? this.mapToTalkSession(session) : null;
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to get active talk session', error);
    }
  }

  /**
   * Gets all active talk sessions for a supervisor
   * @param supervisorId - The supervisor's database ID
   * @returns Promise that resolves to array of active sessions
   * @throws Error if database operation fails
   */
  async getActiveTalkSessionsForSupervisor(supervisorId: string): Promise<TalkSession[]> {
    try {
      const sessions = await prisma.talkSessionHistory.findMany({
        where: {
          supervisorId,
          stoppedAt: null
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      return sessions.map(s => this.mapToTalkSession(s));
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to get active talk sessions for supervisor', error);
    }
  }

  /**
   * Gets all active talk sessions for a PSO
   * @param psoId - The PSO's database ID
   * @returns Promise that resolves to array of active sessions
   * @throws Error if database operation fails
   */
  async getActiveTalkSessionsForPso(psoId: string): Promise<TalkSession[]> {
    try {
      const sessions = await prisma.talkSessionHistory.findMany({
        where: {
          psoId,
          stoppedAt: null
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      return sessions.map(s => this.mapToTalkSession(s));
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to get active talk sessions for PSO', error);
    }
  }

  /**
   * Gets all talk sessions with pagination and user relations.
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @returns Promise that resolves to object with sessions and total count
   * @throws Error if database operation fails
   */
  async getAllTalkSessionsWithRelations(
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
  }> {
    try {
      const skip = (page - 1) * limit;

      const [sessions, total] = await Promise.all([
        prisma.talkSessionHistory.findMany({
          skip,
          take: limit,
          include: {
            supervisor: {
              select: {
                fullName: true,
                email: true
              }
            },
            pso: {
              select: {
                fullName: true,
                email: true
              }
            }
          },
          orderBy: {
            startedAt: 'desc'
          }
        }),
        prisma.talkSessionHistory.count()
      ]);

      return {
        sessions: sessions.map(s => ({
          id: s.id,
          supervisorId: s.supervisorId,
          supervisor: {
            fullName: s.supervisor.fullName,
            email: s.supervisor.email
          },
          psoId: s.psoId,
          pso: {
            fullName: s.pso.fullName,
            email: s.pso.email
          },
          startedAt: s.startedAt,
          stoppedAt: s.stoppedAt,
          stopReason: s.stopReason,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt
        })),
        total
      };
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to get talk sessions', error);
    }
  }

  /**
   * Gets a talk session by ID with PSO information
   * @param talkSessionId - The ID of the talk session
   * @returns Promise that resolves to the session with PSO email or null
   * @throws Error if database operation fails
   */
  async findByIdWithPso(talkSessionId: string): Promise<{ psoEmail: string } | null> {
    try {
      const session = await prisma.talkSessionHistory.findUnique({
        where: { id: talkSessionId },
        include: {
          pso: {
            select: {
              email: true
            }
          }
        }
      });

      if (!session || !session.pso) {
        return null;
      }

      return {
        psoEmail: session.pso.email
      };
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to find talk session', error);
    }
  }

  /**
   * Maps Prisma model to TalkSession entity
   * @param prismaSession - Prisma talk session model
   * @returns TalkSession entity
   */
  private mapToTalkSession(prismaSession: TalkSessionHistory): TalkSession {
    return {
      id: prismaSession.id,
      supervisorId: prismaSession.supervisorId,
      psoId: prismaSession.psoId,
      startedAt: prismaSession.startedAt,
      stoppedAt: prismaSession.stoppedAt,
      stopReason: prismaSession.stopReason as TalkStopReason | null,
      createdAt: prismaSession.createdAt,
      updatedAt: prismaSession.updatedAt
    };
  }
}

