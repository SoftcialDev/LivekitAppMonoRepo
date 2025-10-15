/**
 * @fileoverview AuditService - Infrastructure service for audit operations
 * @description Implements audit logging operations
 */

import { IAuditService } from '../../domain/interfaces/IAuditService';
import { IAuditRepository } from '../../domain/interfaces/IAuditRepository';
import { AuditLog } from '../../domain/entities/AuditLog';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Service for audit operations
 * @description Implements audit logging operations using repository pattern
 */
export class AuditService implements IAuditService {
  /**
   * Creates a new AuditService instance
   * @param auditRepository - Repository for audit data access
   */
  constructor(
    private readonly auditRepository: IAuditRepository
  ) {}

  /**
   * Logs an audit entry
   * @param entry - Audit entry details
   * @returns Promise that resolves when audit is logged
   */
  async logAudit(entry: {
    entity: string;
    entityId: string;
    action: string;
    changedById: string;
    dataBefore?: any;
    dataAfter?: any;
  }): Promise<void> {
    try {
      const auditLog = new AuditLog({
        id: crypto.randomUUID(),
        entity: entry.entity,
        entityId: entry.entityId,
        action: entry.action,
        changedById: entry.changedById,
        timestamp: getCentralAmericaTime(),
        dataBefore: entry.dataBefore,
        dataAfter: entry.dataAfter,
      });

      await this.auditRepository.create(auditLog);
      console.log(`Audit log created: ${entry.action} on ${entry.entity}:${entry.entityId}`);
    } catch (error) {
      // Log error but don't throw - audit failures shouldn't break the main operation
      console.error('Audit logging failed:', error);
    }
  }
}
