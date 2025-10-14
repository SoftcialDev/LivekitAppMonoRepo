/**
 * @fileoverview IAuditRepository - Domain interface for audit data access
 * @summary Defines the contract for audit data operations
 * @description Interface for audit repository operations
 */

import { AuditLog } from '../entities/AuditLog';

/**
 * Interface for audit repository operations
 * @description Defines the contract for audit data access
 */
export interface IAuditRepository {
  /**
   * Creates a new audit log entry
   * @param auditLog - Audit log entity to create
   * @returns Promise that resolves to the created audit log
   */
  create(auditLog: AuditLog): Promise<AuditLog>;

  /**
   * Finds audit logs by entity
   * @param entity - Entity name to search for
   * @param entityId - Entity ID to search for
   * @returns Promise that resolves to array of audit logs
   */
  findByEntity(entity: string, entityId: string): Promise<AuditLog[]>;

  /**
   * Finds audit logs by user
   * @param changedById - User ID who made the changes
   * @returns Promise that resolves to array of audit logs
   */
  findByUser(changedById: string): Promise<AuditLog[]>;

  /**
   * Finds audit logs by date range
   * @param startDate - Start date for the range
   * @param endDate - End date for the range
   * @returns Promise that resolves to array of audit logs
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]>;
}
