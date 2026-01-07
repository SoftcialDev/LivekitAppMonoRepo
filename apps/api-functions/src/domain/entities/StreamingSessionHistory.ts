/**
 * @fileoverview StreamingSessionHistory - Domain entity for streaming sessions
 * @description Encapsulates streaming session business logic and state management
 */

/**
 * Domain entity representing a StreamingSessionHistory with business logic
 */
export class StreamingSessionHistory {
  public readonly id: string;
  public readonly userId: string;
  public readonly startedAt: Date;
  public readonly stoppedAt: Date | null;
  public readonly stopReason: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly user?: {
    email: string;
    id: string;
  };

  /**
   * Creates a new StreamingSessionHistory entity
   * @param props - StreamingSessionHistory properties
   */
  constructor(props: {
    id: string;
    userId: string;
    startedAt: Date;
    stoppedAt?: Date | null;
    stopReason?: string | null;
    createdAt: Date;
    updatedAt: Date;
    user?: {
      email: string;
      id: string;
    };
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.startedAt = props.startedAt;
    this.stoppedAt = props.stoppedAt || null;
    this.stopReason = props.stopReason || null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.user = props.user;
  }

  /**
   * Creates a StreamingSessionHistory entity from Prisma model
   * @param prismaSession - Prisma StreamingSessionHistory model
   * @returns StreamingSessionHistory entity
   */
  static fromPrisma(prismaSession: any): StreamingSessionHistory {
    return new StreamingSessionHistory({
      id: prismaSession.id,
      userId: prismaSession.userId,
      startedAt: prismaSession.startedAt,
      stoppedAt: prismaSession.stoppedAt,
      stopReason: prismaSession.stopReason,
      createdAt: prismaSession.createdAt,
      updatedAt: prismaSession.updatedAt,
      user: prismaSession.user ? {
        email: prismaSession.user.email,
        id: prismaSession.user.id
      } : undefined,
    });
  }

  /**
   * Checks if the session is currently active (not stopped)
   * @returns True if session is active
   */
  isActive(): boolean {
    return this.stoppedAt === null;
  }

  /**
   * Checks if the session is stopped
   * @returns True if session is stopped
   */
  isStopped(): boolean {
    return this.stoppedAt !== null;
  }

  /**
   * Gets the duration of the session in milliseconds
   * @returns Duration in milliseconds, or null if session is still active
   */
  getDuration(): number | null {
    if (!this.stoppedAt) return null;
    return this.stoppedAt.getTime() - this.startedAt.getTime();
  }

  /**
   * Gets the duration of the session in minutes
   * @returns Duration in minutes, or null if session is still active
   */
  getDurationInMinutes(): number | null {
    const duration = this.getDuration();
    if (duration === null) return null;
    return Math.floor(duration / (1000 * 60));
  }

  /**
   * Gets the duration of the session in hours
   * @returns Duration in hours, or null if session is still active
   */
  getDurationInHours(): number | null {
    const duration = this.getDuration();
    if (duration === null) return null;
    return Math.floor(duration / (1000 * 60 * 60));
  }

  /**
   * Checks if the session was stopped by a command
   * @returns True if session was stopped by command
   */
  wasStoppedByCommand(): boolean {
    return this.stopReason === 'COMMAND';
  }

  /**
   * Checks if the session was stopped by disconnection
   * @returns True if session was stopped by disconnection
   */
  wasStoppedByDisconnection(): boolean {
    return this.stopReason === 'DISCONNECT';
  }

  /**
   * Checks if the session is long (longer than specified hours)
   * @param maxHours - Maximum hours for a normal session
   * @returns True if session is long
   */
  isLongSession(maxHours: number = 8): boolean {
    const durationHours = this.getDurationInHours();
    if (durationHours === null) return false;
    return durationHours > maxHours;
  }

  /**
   * Checks if the session is short (shorter than specified minutes)
   * @param minMinutes - Minimum minutes for a normal session
   * @returns True if session is short
   */
  isShortSession(minMinutes: number = 5): boolean {
    const durationMinutes = this.getDurationInMinutes();
    if (durationMinutes === null) return false;
    return durationMinutes < minMinutes;
  }

  /**
   * Gets the session status as string
   * @returns Session status
   */
  getStatus(): string {
    if (this.isActive()) return 'ACTIVE';
    if (this.wasStoppedByCommand()) return 'STOPPED_BY_COMMAND';
    if (this.wasStoppedByDisconnection()) return 'STOPPED_BY_DISCONNECTION';
    return 'STOPPED';
  }

  /**
   * Gets a human-readable duration string
   * @returns Duration string
   */
  getDurationString(): string {
    if (this.isActive()) return 'Active';
    
    const hours = this.getDurationInHours();
    const minutes = this.getDurationInMinutes();
    
    if (hours && hours > 0) {
      return `${hours}h ${minutes! % 60}m`;
    } else if (minutes && minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'Less than 1 minute';
    }
  }

  /**
   * Checks if the session started recently (within specified minutes)
   * @param maxMinutes - Maximum minutes to consider recent
   * @returns True if session started recently
   */
  startedRecently(maxMinutes: number = 5): boolean {
    const ageMinutes = Math.floor((Date.now() - this.startedAt.getTime()) / (1000 * 60));
    return ageMinutes <= maxMinutes;
  }

  /**
   * Checks if the session stopped recently (within specified minutes)
   * @param maxMinutes - Maximum minutes to consider recent
   * @returns True if session stopped recently
   */
  stoppedRecently(maxMinutes: number = 5): boolean {
    if (!this.stoppedAt) return false;
    const ageMinutes = Math.floor((Date.now() - this.stoppedAt.getTime()) / (1000 * 60));
    return ageMinutes <= maxMinutes;
  }
}
