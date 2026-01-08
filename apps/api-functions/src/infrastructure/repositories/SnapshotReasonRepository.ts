/**
 * @fileoverview SnapshotReasonRepository - Repository implementation for snapshot reason operations
 * @summary Concrete implementation of snapshot reason data access
 * @description Handles snapshot reason data operations using Prisma
 */

import { ISnapshotReasonRepository } from '../../domain/interfaces/ISnapshotReasonRepository';
import { SnapshotReasonEntity } from '../../domain/types/SnapshotReasonTypes';
import prisma from '../database/PrismaClientService';

/**
 * Repository implementation for snapshot reason operations
 * @description Handles snapshot reason data access using Prisma ORM
 */
export class SnapshotReasonRepository implements ISnapshotReasonRepository {
  /**
   * Finds all active snapshot reasons ordered by order field
   * @returns Promise that resolves to array of active snapshot reasons
   */
  async findAllActive(): Promise<SnapshotReasonEntity[]> {
    const reasons = await prisma.snapshotReason.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        order: 'asc'
      }
    });

    return reasons.map(r => ({
      id: r.id,
      label: r.label,
      code: r.code,
      isDefault: r.isDefault,
      isActive: r.isActive,
      order: r.order,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
  }

  /**
   * Finds a snapshot reason by ID
   * @param id - The ID of the snapshot reason
   * @returns Promise that resolves to the snapshot reason or null
   */
  async findById(id: string): Promise<SnapshotReasonEntity | null> {
    const reason = await prisma.snapshotReason.findUnique({
      where: { id }
    });

    if (!reason) return null;

    return {
      id: reason.id,
      label: reason.label,
      code: reason.code,
      isDefault: reason.isDefault,
      isActive: reason.isActive,
      order: reason.order,
      createdAt: reason.createdAt,
      updatedAt: reason.updatedAt
    };
  }

  /**
   * Finds a snapshot reason by code
   * @param code - The code of the snapshot reason
   * @returns Promise that resolves to the snapshot reason or null
   */
  async findByCode(code: string): Promise<SnapshotReasonEntity | null> {
    const reason = await prisma.snapshotReason.findUnique({
      where: { code }
    });

    if (!reason) return null;

    return {
      id: reason.id,
      label: reason.label,
      code: reason.code,
      isDefault: reason.isDefault,
      isActive: reason.isActive,
      order: reason.order,
      createdAt: reason.createdAt,
      updatedAt: reason.updatedAt
    };
  }

  /**
   * Creates a new snapshot reason
   * @param data - Snapshot reason data
   * @returns Promise that resolves to the created snapshot reason
   */
  async create(data: {
    label: string;
    code: string;
    isDefault?: boolean;
    order: number;
  }): Promise<SnapshotReasonEntity> {
    const reason = await prisma.snapshotReason.create({
      data: {
        label: data.label,
        code: data.code,
        isDefault: data.isDefault || false,
        order: data.order
      }
    });

    return {
      id: reason.id,
      label: reason.label,
      code: reason.code,
      isDefault: reason.isDefault,
      isActive: reason.isActive,
      order: reason.order,
      createdAt: reason.createdAt,
      updatedAt: reason.updatedAt
    };
  }

  /**
   * Updates a snapshot reason
   * @param id - The ID of the snapshot reason to update
   * @param data - Updated snapshot reason data
   * @returns Promise that resolves to the updated snapshot reason
   */
  async update(id: string, data: {
    label?: string;
    code?: string;
    order?: number;
    isActive?: boolean;
  }): Promise<SnapshotReasonEntity> {
    const reason = await prisma.snapshotReason.update({
      where: { id },
      data
    });

    return {
      id: reason.id,
      label: reason.label,
      code: reason.code,
      isDefault: reason.isDefault,
      isActive: reason.isActive,
      order: reason.order,
      createdAt: reason.createdAt,
      updatedAt: reason.updatedAt
    };
  }

  /**
   * Soft deletes a snapshot reason (sets isActive to false)
   * @param id - The ID of the snapshot reason to delete
   * @returns Promise that resolves when deletion is complete
   */
  async softDelete(id: string): Promise<void> {
    await prisma.snapshotReason.update({
      where: { id },
      data: { isActive: false }
    });
  }

  /**
   * Updates multiple snapshot reasons in batch
   * @param reasons - Array of snapshot reason updates
   * @returns Promise that resolves when batch update is complete
   */
  async updateBatch(reasons: Array<{
    id: string;
    label?: string;
    order?: number;
    isActive?: boolean;
  }>): Promise<void> {
    await Promise.all(
      reasons.map(reason =>
        prisma.snapshotReason.update({
          where: { id: reason.id },
          data: {
            label: reason.label,
            order: reason.order,
            isActive: reason.isActive
          }
        })
      )
    );
  }
}

