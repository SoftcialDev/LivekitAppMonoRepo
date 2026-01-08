/**
 * @fileoverview AuditRepository - Infrastructure repository for audit data access
 * @summary Handles all database operations related to audit logs
 * @description Repository for audit data access operations
 */

import prisma from '../database/PrismaClientService';
import { IAuditRepository } from '../../domain/interfaces/IAuditRepository';
import { AuditLog } from '../../domain/entities/AuditLog';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { wrapEntityCreationError, wrapDatabaseQueryError } from '../../utils/error/ErrorHelpers';

/**
 * Repository for audit data access operations
 * @description Handles all database operations related to audit logs
 */
export class AuditRepository implements IAuditRepository {
  /**
   * Creates a new audit log entry
   * @param auditLog - Audit log entity to create
   * @returns Promise that resolves to the created audit log
   */
  async create(auditLog: AuditLog): Promise<AuditLog> {
    try {
      const prismaAuditLog = await prisma.auditLog.create({
        data: {
          id: auditLog.id,
          entity: auditLog.entity,
          entityId: auditLog.entityId,
          action: auditLog.action,
          changedById: auditLog.changedById,
          timestamp: getCentralAmericaTime(),
          dataBefore: auditLog.dataBefore,
          dataAfter: auditLog.dataAfter,
        }
      });

      return AuditLog.fromPrisma({
        ...prismaAuditLog,
        dataBefore: prismaAuditLog.dataBefore as Record<string, unknown> | null,
        dataAfter: prismaAuditLog.dataAfter as Record<string, unknown> | null
      });
    } catch (error: unknown) {
      throw wrapEntityCreationError('Failed to create audit log', error);
    }
  }

  /**
   * Finds audit logs by entity
   * @param entity - Entity name to search for
   * @param entityId - Entity ID to search for
   * @returns Promise that resolves to array of audit logs
   */
  async findByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    try {
      const prismaAuditLogs = await prisma.auditLog.findMany({
        where: {
          entity,
          entityId
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      return prismaAuditLogs.map(auditLog => AuditLog.fromPrisma({
        ...auditLog,
        dataBefore: auditLog.dataBefore as Record<string, unknown> | null,
        dataAfter: auditLog.dataAfter as Record<string, unknown> | null
      }));
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to find audit logs by entity', error);
    }
  }

  /**
   * Finds audit logs by user
   * @param changedById - User ID who made the changes
   * @returns Promise that resolves to array of audit logs
   */
  async findByUser(changedById: string): Promise<AuditLog[]> {
    try {
      const prismaAuditLogs = await prisma.auditLog.findMany({
        where: {
          changedById
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      return prismaAuditLogs.map(auditLog => AuditLog.fromPrisma({
        ...auditLog,
        dataBefore: auditLog.dataBefore as Record<string, unknown> | null,
        dataAfter: auditLog.dataAfter as Record<string, unknown> | null
      }));
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to find audit logs by user', error);
    }
  }

  /**
   * Finds audit logs by date range
   * @param startDate - Start date for the range
   * @param endDate - End date for the range
   * @returns Promise that resolves to array of audit logs
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    try {
      const prismaAuditLogs = await prisma.auditLog.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      return prismaAuditLogs.map(auditLog => AuditLog.fromPrisma({
        ...auditLog,
        dataBefore: auditLog.dataBefore as Record<string, unknown> | null,
        dataAfter: auditLog.dataAfter as Record<string, unknown> | null
      }));
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to find audit logs by date range', error);
    }
  }
}
