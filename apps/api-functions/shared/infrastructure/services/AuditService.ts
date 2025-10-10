/**
 * @fileoverview AuditService - Infrastructure service for audit operations
 * @description Implements audit logging operations
 */

import { IAuditService } from '../../domain/interfaces/IAuditService';
import { logAudit, AuditAction } from '../../services/auditService';

/**
 * Service for audit operations
 */
export class AuditService implements IAuditService {
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
      await logAudit({
        entity: entry.entity,
        entityId: entry.entityId,
        action: entry.action as AuditAction,
        changedById: entry.changedById,
        dataBefore: entry.dataBefore,
        dataAfter: entry.dataAfter,
      });
    } catch (error) {
      // Log error but don't throw - audit failures shouldn't break the main operation
      console.error('Audit logging failed:', error);
    }
  }
}
