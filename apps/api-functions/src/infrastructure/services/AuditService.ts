/**
 * @fileoverview AuditService - Infrastructure service for audit operations
 * @description Implements audit logging operations
 */

import { IAuditService } from '../../index';
import { IAuditRepository } from '../../index';
import { AuditLog } from '../../index';
import { getCentralAmericaTime } from '../../index';

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
    } catch {
      // Audit failures shouldn't break the main operation
    }
  }
}
