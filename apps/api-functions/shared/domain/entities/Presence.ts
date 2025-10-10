/**
 * @fileoverview Presence - Domain entity for user presence
 * @description Encapsulates presence business logic and state management
 */

import { Status } from '@prisma/client';

/**
 * Domain entity representing a Presence with business logic
 */
export class Presence {
  public readonly userId: string;
  public readonly status: Status;
  public readonly lastSeenAt: Date;
  public readonly updatedAt: Date;

  /**
   * Creates a new Presence entity
   * @param props - Presence properties
   */
  constructor(props: {
    userId: string;
    status: Status;
    lastSeenAt: Date;
    updatedAt: Date;
  }) {
    this.userId = props.userId;
    this.status = props.status;
    this.lastSeenAt = props.lastSeenAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Creates a Presence entity from Prisma model
   * @param prismaPresence - Prisma Presence model
   * @returns Presence entity
   */
  static fromPrisma(prismaPresence: any): Presence {
    return new Presence({
      userId: prismaPresence.userId,
      status: prismaPresence.status,
      lastSeenAt: prismaPresence.lastSeenAt,
      updatedAt: prismaPresence.updatedAt,
    });
  }

  /**
   * Checks if the user is online
   * @returns True if user is online
   */
  isOnline(): boolean {
    return this.status === Status.online;
  }

  /**
   * Checks if the user is offline
   * @returns True if user is offline
   */
  isOffline(): boolean {
    return this.status === Status.offline;
  }

  /**
   * Gets the time since last seen in milliseconds
   * @returns Time since last seen in milliseconds
   */
  getTimeSinceLastSeen(): number {
    return Date.now() - this.lastSeenAt.getTime();
  }

  /**
   * Gets the time since last seen in minutes
   * @returns Time since last seen in minutes
   */
  getTimeSinceLastSeenInMinutes(): number {
    return Math.floor(this.getTimeSinceLastSeen() / (1000 * 60));
  }

  /**
   * Gets the time since last seen in hours
   * @returns Time since last seen in hours
   */
  getTimeSinceLastSeenInHours(): number {
    return Math.floor(this.getTimeSinceLastSeen() / (1000 * 60 * 60));
  }

  /**
   * Checks if the user was seen recently (within specified minutes)
   * @param maxMinutes - Maximum minutes to consider recent
   * @returns True if user was seen recently
   */
  wasSeenRecently(maxMinutes: number = 5): boolean {
    return this.getTimeSinceLastSeenInMinutes() <= maxMinutes;
  }

  /**
   * Checks if the user has been offline for a long time (more than specified hours)
   * @param maxHours - Maximum hours to consider recent
   * @returns True if user has been offline for a long time
   */
  hasBeenOfflineForLongTime(maxHours: number = 24): boolean {
    if (this.isOnline()) return false;
    return this.getTimeSinceLastSeenInHours() > maxHours;
  }

  /**
   * Gets a human-readable last seen string
   * @returns Last seen string
   */
  getLastSeenString(): string {
    if (this.isOnline()) return 'Online now';
    
    const hours = this.getTimeSinceLastSeenInHours();
    const minutes = this.getTimeSinceLastSeenInMinutes();
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  /**
   * Checks if the presence is stale (not updated recently)
   * @param maxMinutes - Maximum minutes to consider fresh
   * @returns True if presence is stale
   */
  isStale(maxMinutes: number = 10): boolean {
    const timeSinceUpdate = Date.now() - this.updatedAt.getTime();
    const minutesSinceUpdate = Math.floor(timeSinceUpdate / (1000 * 60));
    return minutesSinceUpdate > maxMinutes;
  }

  /**
   * Gets the presence status as string
   * @returns Presence status
   */
  getStatusString(): string {
    return this.status;
  }

  /**
   * Checks if the user is considered active (online and seen recently)
   * @param maxMinutes - Maximum minutes to consider active
   * @returns True if user is active
   */
  isActive(maxMinutes: number = 5): boolean {
    return this.isOnline() && this.wasSeenRecently(maxMinutes);
  }

  /**
   * Checks if the user is considered inactive (offline or not seen recently)
   * @param maxMinutes - Maximum minutes to consider inactive
   * @returns True if user is inactive
   */
  isInactive(maxMinutes: number = 5): boolean {
    return this.isOffline() || !this.wasSeenRecently(maxMinutes);
  }
}
