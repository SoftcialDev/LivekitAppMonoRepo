/**
 * @fileoverview IAuditService - Domain interface for audit operations
 * @description Defines the contract for audit logging operations
 */

/**
 * Interface for audit service operations
 */
export interface IAuditService {
  /**
   * Logs an audit entry
   * @param entry - Audit entry details
   * @returns Promise that resolves when audit is logged
   */
  logAudit(entry: {
    entity: string;
    entityId: string;
    action: string;
    changedById: string;
    dataBefore?: any;
    dataAfter?: any;
  }): Promise<void>;
}
