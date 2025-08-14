import prisma from "../services/prismaClienService";
import { RecordingStatus } from "@prisma/client";

/**
 * Repository for recording session persistence and queries.
 */
export class RecordingSessionRepository {
  /**
   * Creates an Active recording session row.
   *
   * @param data - Session fields to persist.
   * @returns The created session.
   */
  static async createActive(data: {
    roomName: string;
    egressId: string;
    userId: string;
    subjectUserId: string;
    subjectLabel: string;
    blobPath: string;
    startedAt: string;
  }) {
    return prisma.recordingSession.create({
      data: {
        roomName: data.roomName,
        egressId: data.egressId,
        userId: data.userId,
        subjectUserId: data.subjectUserId,
        subjectLabel: data.subjectLabel,
        status: RecordingStatus.Active,
        blobPath: data.blobPath,
        startedAt: data.startedAt,
      },
    });
    }

  /**
   * Finds Active sessions for a caller and room.
   *
   * @param roomName - LiveKit room name.
   * @param callerUserId - The initiator user id.
   * @returns Array of active sessions.
   */
  static async findActiveByRoomAndUser(roomName: string, callerUserId: string) {
    return prisma.recordingSession.findMany({
      where: { roomName, status: RecordingStatus.Active, userId: callerUserId },
    });
  }

  /**
   * Marks a session as Completed and stores the final URL.
   *
   * @param sessionId - Session primary key.
   * @param blobUrl - Final destination URL (may be unsigned).
   * @param stoppedAtIso - ISO-8601 string (local CR time or UTC depending on your helper).
   * @returns The updated session.
   */
  static async complete(sessionId: string, blobUrl: string | null, stoppedAtIso: string) {
    return prisma.recordingSession.update({
      where: { id: sessionId },
      data: {
        status: RecordingStatus.Completed,
        stoppedAt: stoppedAtIso,
        blobUrl,
      },
    });
  }

  /**
   * Marks a session as Failed.
   *
   * @param sessionId - Session primary key.
   * @returns The updated session.
   */
  static async fail(sessionId: string) {
    return prisma.recordingSession.update({
      where: { id: sessionId },
      data: { status: RecordingStatus.Failed },
    });
  }

  /**
   * Lists sessions with optional filters and ordering.
   *
   * @param opts - Filter/sort options.
   * @returns Array of sessions.
   */
  static async list(opts: { roomName?: string; limit: number; orderByCreatedAt: "asc" | "desc" }) {
    return prisma.recordingSession.findMany({
      where: { ...(opts.roomName ? { roomName: opts.roomName } : {}) },
      orderBy: { createdAt: opts.orderByCreatedAt },
      take: opts.limit,
    });
  }

  /**
   * Fetches users by a set of ids to resolve display names.
   *
   * @param ids - Unique user ids.
   * @returns Array of minimal user records.
   */
  static async getUsersByIds(ids: string[]) {
    return prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, fullName: true, email: true },
    });
  }

  /**
   * Fetches a recording session by id.
   *
   * @param id - Session primary key.
   * @returns The session or null.
   */
  static async findById(id: string) {
    return prisma.recordingSession.findUnique({ where: { id } });
  }

  /**
   * Permanently deletes a session row.
   *
   * @param id - Session primary key.
   * @returns The deleted session.
   */
  static async deleteById(id: string) {
    return prisma.recordingSession.delete({ where: { id } });
  }

  /* ------------------------------------------------------------------------ */
  /* New methods for “stop on disconnect” scenarios                           */
  /* ------------------------------------------------------------------------ */

  /**
   * Finds Active sessions for a given room name.
   *
   * @param roomName - LiveKit room name (often equals the subject user id in your flow).
   * @returns Array of active sessions.
   */
  static async findActiveByRoom(roomName: string) {
    return prisma.recordingSession.findMany({
      where: { roomName, status: RecordingStatus.Active },
    });
  }

  /**
   * Finds Active sessions initiated by a specific user.
   *
   * @param userId - Initiator user id (the caller who started the recording).
   * @returns Array of active sessions.
   */
  static async findActiveByInitiator(userId: string) {
    return prisma.recordingSession.findMany({
      where: { userId, status: RecordingStatus.Active },
    });
  }

  /**
   * Finds Active sessions for which the subject being recorded matches a user id.
   *
   * @param subjectUserId - Subject user id (the person being recorded).
   * @returns Array of active sessions.
   */
  static async findActiveBySubject(subjectUserId: string) {
    return prisma.recordingSession.findMany({
      where: { subjectUserId, status: RecordingStatus.Active },
    });
  }
}
