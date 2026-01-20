/**
 * @fileoverview Presence - Domain entity for user presence
 * @summary Represents a user's presence status
 * @description Encapsulates a user's presence information including status and timestamps
 */

import { Status } from "../enums/Status";
import { Platform } from "../enums/Platform";

/**
 * Domain entity representing user presence
 * @description Encapsulates a user's presence status, platform, and related timestamps
 */
export class Presence {
  /**
   * Creates a new Presence instance
   * @param userId - The unique identifier of the user
   * @param status - The current presence status
   * @param lastSeenAt - When the user was last seen
   * @param updatedAt - When the presence was last updated
   * @param platform - Optional platform identifier (electron or browser)
   */
  constructor(
    public readonly userId: string,
    public readonly status: Status,
    public readonly lastSeenAt: Date,
    public readonly updatedAt: Date,
    public readonly platform?: Platform
  ) {}

  /**
   * Creates a Presence entity from Prisma data
   * @param data - Prisma presence data
   * @returns A new Presence entity
   */
  static fromPrisma(data: {
    userId: string;
    status: string;
    lastSeenAt: Date;
    updatedAt: Date;
    platform?: string | null;
  }): Presence {
    return new Presence(
      data.userId,
      data.status as Status,
      data.lastSeenAt,
      data.updatedAt,
      data.platform as Platform | undefined
    );
  }

  /**
   * Converts the presence to a plain object for serialization
   * @returns Plain object representation of the presence
   */
  toPayload(): {
    userId: string;
    status: Status;
    lastSeenAt: Date;
    updatedAt: Date;
    platform?: Platform;
  } {
    return {
      userId: this.userId,
      status: this.status,
      lastSeenAt: this.lastSeenAt,
      updatedAt: this.updatedAt,
      platform: this.platform,
    };
  }
}