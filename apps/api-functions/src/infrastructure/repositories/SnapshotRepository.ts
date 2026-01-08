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
   * @description Creates a new snapshot record in the database with the provided metadata
   * @param supervisorId - The ID of the supervisor
   * @param psoId - The ID of the PSO
   * @param reasonId - The ID of the snapshot reason
   * @param description - Optional description for the snapshot
   * @param imageUrl - The URL of the uploaded image
   * @param snapshotId - Optional pre-generated UUID for the snapshot (for file naming consistency)
   * @returns Promise that resolves to the created snapshot record
   */
  async create(
    supervisorId: string,
    psoId: string,
    reasonId: string,
    description: string | undefined,
    imageUrl: string,
    snapshotId?: string
  ): Promise<{ id: string }> {
    const snapshot = await prisma.snapshot.create({
      data: {
        id: snapshotId, // Use provided ID if available, otherwise Prisma will generate one
        supervisorId,
        psoId,
        reasonId,
        description: description || null,
        imageUrl,
        takenAt: getCentralAmericaTime(),
      },
    });

    return { id: snapshot.id };
  }

  /**
   * Finds a snapshot by ID
   * @description Retrieves a snapshot record by its unique identifier
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
   * @description Removes a snapshot record from the database
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
   * @description Retrieves all snapshots with their related supervisor, PSO, and reason data
   * @returns Promise that resolves to Snapshot entities with relations
   */
  async findAllWithRelations(): Promise<Array<{
    id: string;
    reason: {
      id: string;
      label: string;
      code: string;
    };
    description: string | null;
    imageUrl: string;
    takenAt: Date;
    supervisor: { fullName: string };
    pso: { fullName: string; email: string };
  }>> {
    const snapshots = await prisma.snapshot.findMany({
      select: {
        id: true,
        reason: {
          select: {
            id: true,
            label: true,
            code: true
          }
        },
        description: true,
        imageUrl: true,
        takenAt: true,
        supervisor: { select: { fullName: true } },
        pso: { select: { fullName: true, email: true } },
      },
      orderBy: { takenAt: "desc" },
    });

    return snapshots;
  }
}
