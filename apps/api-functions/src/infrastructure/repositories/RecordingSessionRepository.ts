/**
 * @fileoverview RecordingSessionRepository - Repository implementation for recording sessions
 * @summary Handles recording session data persistence using Prisma
 * @description Implements IRecordingSessionRepository interface with Prisma ORM
 */

import { IRecordingSessionRepository } from '../../domain/interfaces/IRecordingSessionRepository';
import { CreateRecordingSessionData, ListRecordingsParams } from '../../domain/types/RecordingSessionTypes';
import { RecordingSession } from '../../domain/entities/RecordingSession';
import { RecordingStatus } from '@prisma/client';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { wrapDatabaseQueryError, wrapEntityCreationError, wrapEntityUpdateError, wrapEntityDeletionError } from '../../utils/error/ErrorHelpers';
import prisma from '../database/PrismaClientService';

/**
 * Repository implementation for recording session data access
 */
export class RecordingSessionRepository implements IRecordingSessionRepository {
  /**
   * Finds a recording session by ID
   * @param id - Recording session ID
   * @returns RecordingSession entity or null if not found
   */
  async findById(id: string): Promise<RecordingSession | null> {
    try {
      const prismaSession = await prisma.recordingSession.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });

      if (!prismaSession) return null;
      
      return RecordingSession.fromPrisma(prismaSession);
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to find recording session', error);
    }
  }

  /**
   * Lists recording sessions with optional filters
   * @param params - Filter and pagination parameters
   * @returns Array of RecordingSession entities
   */
  async list(params: ListRecordingsParams): Promise<RecordingSession[]> {
    try {
      const prismaSessions = await prisma.recordingSession.findMany({
        where: { ...(params.roomName ? { roomName: params.roomName } : {}) },
        orderBy: { createdAt: params.orderByCreatedAt },
        take: params.limit,
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });

      return prismaSessions.map(session => RecordingSession.fromPrisma(session));
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to list recording sessions', error);
    }
  }

  /**
   * Fetches users by IDs for display name resolution
   * @param ids - Array of user IDs
   * @returns Array of user data with id, email, and fullName
   */
  async getUsersByIds(ids: string[]): Promise<Array<{id: string; email: string; fullName: string}>> {
    try {
      const users = await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, fullName: true, email: true }
      });

      return users;
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to get users by IDs', error);
    }
  }

  /**
   * Creates a new active recording session
   * @param data - Recording session creation data
   * @returns Created RecordingSession entity
   */
  async createActive(data: CreateRecordingSessionData): Promise<RecordingSession> {
    try {
      const prismaSession = await prisma.recordingSession.create({
        data: {
          roomName: data.roomName,
          egressId: data.egressId,
          userId: data.userId,
          subjectUserId: data.subjectUserId,
          subjectLabel: data.subjectLabel,
          status: RecordingStatus.Active,
          blobPath: data.blobPath,
          startedAt: data.startedAt,
          createdAt: getCentralAmericaTime(),
          updatedAt: getCentralAmericaTime()
        },
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });

      return RecordingSession.fromPrisma(prismaSession);
    } catch (error: unknown) {
      throw wrapEntityCreationError('Failed to create recording session', error);
    }
  }

  /**
   * Marks a recording session as completed
   * @param sessionId - Recording session ID
   * @param blobUrl - Final blob storage URL
   * @param stoppedAt - ISO string of when recording stopped
   * @returns Promise that resolves when update is complete
   */
  async complete(sessionId: string, blobUrl: string | null, stoppedAt: string): Promise<void> {
    try {
      await prisma.recordingSession.update({
        where: { id: sessionId },
        data: {
          status: RecordingStatus.Completed,
          stoppedAt: stoppedAt,
          blobUrl: blobUrl,
        }
      });
    } catch (error: unknown) {
      throw wrapEntityUpdateError('Failed to complete recording session', error);
    }
  }

  /**
   * Marks a recording session as failed
   * @param sessionId - Recording session ID
   * @returns Promise that resolves when update is complete
   */
  async fail(sessionId: string): Promise<void> {
    try {
      await prisma.recordingSession.update({
        where: { id: sessionId },
        data: { 
          status: RecordingStatus.Failed,
          stoppedAt: getCentralAmericaTime().toISOString(),
        }
      });
    } catch (error: unknown) {
      throw wrapEntityUpdateError('Failed to mark recording session as failed', error);
    }
  }

  /**
   * Permanently deletes a recording session
   * @param id - Recording session ID
   * @returns Promise that resolves when deletion is complete
   */
  async deleteById(id: string): Promise<void> {
    try {
      await prisma.recordingSession.delete({
        where: { id }
      });
    } catch (error: unknown) {
      throw wrapEntityDeletionError('Failed to delete recording session', error);
    }
  }

  /**
   * Finds active recording sessions by room name
   * @param roomName - LiveKit room name
   * @returns Array of active RecordingSession entities
   */
  async findActiveByRoom(roomName: string): Promise<RecordingSession[]> {
    try {
      const prismaSessions = await prisma.recordingSession.findMany({
        where: { roomName, status: RecordingStatus.Active },
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });

      return prismaSessions.map(session => RecordingSession.fromPrisma(session));
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to find active recordings by room', error);
    }
  }

  /**
   * Finds active recording sessions by subject user ID
   * @param subjectUserId - User ID of the person being recorded
   * @returns Array of active RecordingSession entities
   */
  async findActiveBySubject(subjectUserId: string): Promise<RecordingSession[]> {
    try {
      const prismaSessions = await prisma.recordingSession.findMany({
        where: { subjectUserId, status: RecordingStatus.Active },
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });

      return prismaSessions.map(session => RecordingSession.fromPrisma(session));
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to find active recordings by subject', error);
    }
  }

  /**
   * Finds active recording sessions by initiator user ID
   * @param userId - User ID of the person who started the recording
   * @returns Array of active RecordingSession entities
   */
  async findActiveByInitiator(userId: string): Promise<RecordingSession[]> {
    try {
      const prismaSessions = await prisma.recordingSession.findMany({
        where: { userId, status: RecordingStatus.Active },
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });

      return prismaSessions.map(session => RecordingSession.fromPrisma(session));
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to find active recordings by initiator', error);
    }
  }
}
