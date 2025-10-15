/**
 * @fileoverview PresenceRepository - Infrastructure repository for presence data operations
 * @summary Handles presence data access using Prisma
 * @description Infrastructure repository that implements presence data operations using Prisma ORM
 */

import { PrismaClient } from "@prisma/client";
import { IPresenceRepository } from "../../domain/interfaces/IPresenceRepository";
import { Presence } from "../../domain/entities/Presence";
import { Status } from "../../domain/enums/Status";
import { getCentralAmericaTime } from "../../utils/dateUtils";

/**
 * Infrastructure repository for presence data operations
 * @description Handles presence data access using Prisma ORM
 */
export class PresenceRepository implements IPresenceRepository {
  /**
   * Creates a new PresenceRepository instance
   * @param prisma - Prisma client instance
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Upserts a presence record for a user
   * @param userId - The unique identifier of the user
   * @param status - The presence status to set
   * @param lastSeenAt - When the user was last seen
   * @returns Promise that resolves when the operation completes
   * @throws Error if the operation fails
   */
  async upsertPresence(userId: string, status: Status, lastSeenAt: Date): Promise<void> {
    await this.prisma.presence.upsert({
      where: { userId },
      create: { userId, status: status as any, lastSeenAt, updatedAt: getCentralAmericaTime() },
      update: { status: status as any, lastSeenAt, updatedAt: getCentralAmericaTime() },
    });
  }

  /**
   * Finds presence by user ID
   * @param userId - The unique identifier of the user
   * @returns Promise that resolves to the presence or null if not found
   * @throws Error if the operation fails
   */
  async findPresenceByUserId(userId: string): Promise<Presence | null> {
    const presence = await this.prisma.presence.findFirst({
      where: { userId },
      orderBy: { lastSeenAt: "desc" },
    });

    if (!presence) {
      return null;
    }

    return Presence.fromPrisma(presence);
  }

  /**
   * Creates a new presence history entry
   * @param userId - The unique identifier of the user
   * @param connectedAt - When the user connected
   * @returns Promise that resolves when the operation completes
   * @throws Error if the operation fails
   */
  async createPresenceHistory(userId: string, connectedAt: Date): Promise<void> {
    await this.prisma.presenceHistory.create({
      data: { 
        userId, 
        connectedAt,
        updatedAt: getCentralAmericaTime()
      },
    });
  }

  /**
   * Closes any open presence history entry for a user
   * @param userId - The unique identifier of the user
   * @param disconnectedAt - When the user disconnected
   * @returns Promise that resolves when the operation completes
   * @throws Error if the operation fails
   */
  async closeOpenPresenceHistory(userId: string, disconnectedAt: Date): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const open = await tx.presenceHistory.findFirst({
        where: { userId, disconnectedAt: null },
        orderBy: { connectedAt: "desc" },
      });

      if (open) {
        await tx.presenceHistory.update({
          where: { id: open.id },
          data: { disconnectedAt },
        });
      }
    });
  }
}
