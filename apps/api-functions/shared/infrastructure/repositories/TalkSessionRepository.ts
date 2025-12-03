/**
 * @fileoverview TalkSessionRepository - Repository for talk session data access
 * @summary Implements data access operations for talk sessions using Prisma
 * @description Provides repository implementation for talk session operations
 */

import { ITalkSessionRepository, TalkSession } from '../../domain/interfaces/ITalkSessionRepository';
import { TalkStopReason } from '../../domain/enums/TalkStopReason';
import prisma from '../database/PrismaClientService';
import { getCentralAmericaTime } from '../../utils/dateUtils';

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
    } catch (error: any) {
      throw new Error(`Failed to create talk session: ${error.message}`);
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
    } catch (error: any) {
      throw new Error(`Failed to stop talk session: ${error.message}`);
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
    } catch (error: any) {
      throw new Error(`Failed to get active talk session: ${error.message}`);
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

      return sessions.map((s: any) => this.mapToTalkSession(s));
    } catch (error: any) {
      throw new Error(`Failed to get active talk sessions for supervisor: ${error.message}`);
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

      return sessions.map((s: any) => this.mapToTalkSession(s));
    } catch (error: any) {
      throw new Error(`Failed to get active talk sessions for PSO: ${error.message}`);
    }
  }

  /**
   * Maps Prisma model to TalkSession entity
   * @param prismaSession - Prisma talk session model
   * @returns TalkSession entity
   */
  private mapToTalkSession(prismaSession: any): TalkSession {
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

