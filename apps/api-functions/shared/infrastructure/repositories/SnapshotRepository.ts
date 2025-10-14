/**
 * @fileoverview SnapshotRepository - Repository implementation for snapshot operations
 * @summary Concrete implementation of snapshot data access
 * @description Handles snapshot data operations using Prisma
 */

import { ISnapshotRepository } from '../../domain/interfaces/ISnapshotRepository';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import prisma from '../database/PrismaClientService';

/**
 * Repository implementation for snapshot operations
 * @description Handles snapshot data access using Prisma ORM
 */
export class SnapshotRepository implements ISnapshotRepository {
  /**
   * Creates a new snapshot record
   * @param supervisorId - The ID of the supervisor
   * @param psoId - The ID of the PSO
   * @param reason - The reason for the snapshot
   * @param imageUrl - The URL of the uploaded image
   * @returns Promise that resolves to the created snapshot record
   */
  async create(
    supervisorId: string,
    psoId: string,
    reason: string,
    imageUrl: string
  ): Promise<{ id: string }> {
    const snapshot = await prisma.snapshot.create({
      data: {
        supervisorId,
        psoId,
        reason,
        imageUrl,
        takenAt: getCentralAmericaTime(),
      },
    });

    return { id: snapshot.id };
  }

  /**
   * Finds a snapshot by ID
   * @param snapshotId - The ID of the snapshot to find
   * @returns Promise that resolves to the snapshot or null
   */
  async findById(snapshotId: string): Promise<{ id: string; imageUrl: string } | null> {
    const snapshot = await prisma.snapshot.findUnique({
      where: { id: snapshotId },
      select: { id: true, imageUrl: true }
    });

    return snapshot;
  }

  /**
   * Deletes a snapshot by ID
   * @param snapshotId - The ID of the snapshot to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteById(snapshotId: string): Promise<void> {
    await prisma.snapshot.delete({
      where: { id: snapshotId }
    });
  }

  /**
   * Finds all snapshots with supervisor and PSO relations
   * @returns Promise that resolves to snapshots with relations
   */
  async findAllWithRelations(): Promise<Array<{
    id: string;
    reason: string;
    imageUrl: string;
    takenAt: Date;
    supervisor: { fullName: string };
    pso: { fullName: string; email: string };
  }>> {
    const snapshots = await prisma.snapshot.findMany({
      include: {
        supervisor: { select: { fullName: true } },
        pso: { select: { fullName: true, email: true } },
      },
      orderBy: { takenAt: "desc" },
    });

    return snapshots;
  }
}
