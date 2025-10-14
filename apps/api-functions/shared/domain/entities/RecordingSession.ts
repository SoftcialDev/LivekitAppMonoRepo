/**
 * @fileoverview RecordingSession - Domain entity for recording sessions
 * @summary Encapsulates recording session business logic and data
 * @description Represents a LiveKit recording session with all associated metadata and business rules
 */

import { RecordingStatus } from '@prisma/client';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Domain entity for recording sessions
 * 
 * @param id - Unique identifier for the recording session
 * @param roomName - LiveKit room name where recording occurred
 * @param roomId - Optional room identifier
 * @param egressId - LiveKit egress identifier
 * @param userId - User who initiated the recording
 * @param subjectUserId - User being recorded (subject)
 * @param subjectLabel - Human-readable label for the subject
 * @param status - Current status of the recording
 * @param startedAt - When the recording started
 * @param stoppedAt - When the recording stopped (if completed)
 * @param blobUrl - Final blob storage URL
 * @param blobPath - Relative path within blob storage
 * @param createdAt - When the session was created
 * @param updatedAt - When the session was last updated
 * @param user - Associated user details (email, fullName)
 */
export class RecordingSession {
  constructor(
    public readonly id: string,
    public readonly roomName: string,
    public readonly roomId: string | null,
    public readonly egressId: string,
    public readonly userId: string,
    public readonly subjectUserId: string | null,
    public readonly subjectLabel: string | null,
    public readonly status: RecordingStatus,
    public readonly startedAt: Date,
    public readonly stoppedAt: Date | null,
    public readonly blobUrl: string | null,
    public readonly blobPath: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly user?: {
      email: string;
      fullName: string;
    }
  ) {}

  /**
   * Creates RecordingSession from Prisma data
   * @param prismaSession - Raw Prisma recording session data
   * @returns RecordingSession entity instance
   */
  static fromPrisma(prismaSession: any): RecordingSession {
    return new RecordingSession(
      prismaSession.id,
      prismaSession.roomName,
      prismaSession.roomId,
      prismaSession.egressId,
      prismaSession.userId,
      prismaSession.subjectUserId,
      prismaSession.subjectLabel,
      prismaSession.status,
      prismaSession.startedAt ? new Date(prismaSession.startedAt) : getCentralAmericaTime(),
      prismaSession.stoppedAt ? new Date(prismaSession.stoppedAt) : null,
      prismaSession.blobUrl,
      prismaSession.blobPath,
      prismaSession.createdAt,
      prismaSession.updatedAt,
      prismaSession.user ? {
        email: prismaSession.user.email,
        fullName: prismaSession.user.fullName
      } : undefined
    );
  }

  /**
   * Checks if the recording is currently active
   * @returns True if recording status is Active
   */
  isActive(): boolean {
    return this.status === RecordingStatus.Active;
  }

  /**
   * Checks if the recording is completed
   * @returns True if recording status is Completed
   */
  isCompleted(): boolean {
    return this.status === RecordingStatus.Completed;
  }

  /**
   * Checks if the recording failed
   * @returns True if recording status is Failed
   */
  isFailed(): boolean {
    return this.status === RecordingStatus.Failed;
  }

  /**
   * Calculates recording duration in seconds
   * @returns Duration in seconds, or 0 if not calculable
   */
  getDuration(): number {
    const startMs = this.startedAt.getTime();
    const endMs = this.stoppedAt ? this.stoppedAt.getTime() : getCentralAmericaTime().getTime();
    
    if (isNaN(startMs) || isNaN(endMs)) return 0;
    
    return Math.max(0, Math.floor((endMs - startMs) / 1000));
  }

  /**
   * Converts entity to payload format for API responses
   * @returns Structured payload for API response
   */
  toPayload(): {
    id: string;
    roomName: string;
    roomId?: string | null;
    egressId: string;
    userId: string;
    status: string;
    startedAt: string;
    stoppedAt?: string | null;
    createdAt: string;
    updatedAt?: string | null;
    username?: string;
    recordedBy?: string;
    blobPath?: string | null;
    blobUrl?: string | null;
    duration: number;
  } {
    return {
      id: this.id,
      roomName: this.roomName,
      roomId: this.roomId,
      egressId: this.egressId,
      userId: this.userId,
      status: this.status,
      startedAt: this.startedAt.toISOString(),
      stoppedAt: this.stoppedAt?.toISOString() || null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() || null,
      username: this.user?.fullName || this.user?.email,
      recordedBy: this.user?.fullName || this.user?.email,
      blobPath: this.blobPath,
      blobUrl: this.blobUrl,
      duration: this.getDuration(),
    };
  }
}
