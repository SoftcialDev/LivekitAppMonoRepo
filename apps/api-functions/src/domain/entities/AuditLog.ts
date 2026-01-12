/**
 * @fileoverview AuditLog - Domain entity for audit logging
 * @description Encapsulates audit log business logic and state management
 */

import { getCentralAmericaTime, formatCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Domain entity representing an AuditLog with business logic
 */
export class AuditLog {
  public readonly id: string;
  public readonly entity: string;
  public readonly entityId: string;
  public readonly action: string;
  public readonly changedById: string;
  public readonly timestamp: Date;
  public readonly dataBefore: Record<string, unknown> | null;
  public readonly dataAfter: Record<string, unknown> | null;

  /**
   * Creates a new AuditLog entity
   * @param props - AuditLog properties
   */
  constructor(props: {
    id: string;
    entity: string;
    entityId: string;
    action: string;
    changedById: string;
    timestamp: Date;
    dataBefore?: Record<string, unknown> | null;
    dataAfter?: Record<string, unknown> | null;
  }) {
    this.id = props.id;
    this.entity = props.entity;
    this.entityId = props.entityId;
    this.action = props.action;
    this.changedById = props.changedById;
    this.timestamp = props.timestamp;
    this.dataBefore = props.dataBefore || null;
    this.dataAfter = props.dataAfter || null;
  }

  /**
   * Creates an AuditLog entity from Prisma model
   * @param prismaAuditLog - Prisma AuditLog model
   * @returns AuditLog entity
   */
  static fromPrisma(prismaAuditLog: {
    id: string;
    entity: string;
    entityId: string;
    action: string;
    changedById: string;
    timestamp: Date;
    dataBefore: Record<string, unknown> | null;
    dataAfter: Record<string, unknown> | null;
  }): AuditLog {
    return new AuditLog({
      id: prismaAuditLog.id,
      entity: prismaAuditLog.entity,
      entityId: prismaAuditLog.entityId,
      action: prismaAuditLog.action,
      changedById: prismaAuditLog.changedById,
      timestamp: prismaAuditLog.timestamp,
      dataBefore: prismaAuditLog.dataBefore,
      dataAfter: prismaAuditLog.dataAfter,
    });
  }

  /**
   * Checks if the audit log has data changes
   * @returns True if audit log has data changes
   */
  hasDataChanges(): boolean {
    return this.dataBefore !== null && this.dataAfter !== null;
  }

  /**
   * Checks if the audit log is a creation action
   * @returns True if audit log is a creation action
   */
  isCreation(): boolean {
    return this.action.toLowerCase().includes('create') || 
           this.action.toLowerCase().includes('insert');
  }

  /**
   * Checks if the audit log is an update action
   * @returns True if audit log is an update action
   */
  isUpdate(): boolean {
    return this.action.toLowerCase().includes('update') || 
           this.action.toLowerCase().includes('modify');
  }

  /**
   * Checks if the audit log is a deletion action
   * @returns True if audit log is a deletion action
   */
  isDeletion(): boolean {
    return this.action.toLowerCase().includes('delete') || 
           this.action.toLowerCase().includes('remove');
  }

  /**
   * Checks if the audit log is a status change action
   * @returns True if audit log is a status change action
   */
  isStatusChange(): boolean {
    return this.action.toLowerCase().includes('status') || 
           this.action.toLowerCase().includes('activate') ||
           this.action.toLowerCase().includes('deactivate');
  }

  /**
   * Checks if the audit log is a role change action
   * @returns True if audit log is a role change action
   */
  isRoleChange(): boolean {
    return this.action.toLowerCase().includes('role') || 
           this.action.toLowerCase().includes('promote') ||
           this.action.toLowerCase().includes('demote');
  }

  /**
   * Checks if the audit log is a supervisor assignment action
   * @returns True if audit log is a supervisor assignment action
   */
  isSupervisorAssignment(): boolean {
    return this.action.toLowerCase().includes('supervisor') || 
           this.action.toLowerCase().includes('assign');
  }

  /**
   * Gets the age of the audit log in milliseconds
   * @returns Age in milliseconds
   */
  getAge(): number {
    return Date.now() - this.timestamp.getTime();
  }

  /**
   * Gets the age of the audit log in minutes
   * @returns Age in minutes
   */
  getAgeInMinutes(): number {
    return Math.floor(this.getAge() / (1000 * 60));
  }


  /**
   * Gets the age of the audit log in days
   * @returns Age in days
   */
  getAgeInDays(): number {
    return Math.floor(this.getAge() / (1000 * 60 * 60 * 24));
  }

  /**
   * Checks if the audit log is recent (within specified minutes)
   * @param maxMinutes - Maximum minutes to consider recent
   * @returns True if audit log is recent
   */
  isRecent(maxMinutes: number = 60): boolean {
    return this.getAgeInMinutes() <= maxMinutes;
  }

  /**
   * Checks if the audit log is old (older than specified days)
   * @param maxDays - Maximum days to consider old
   * @returns True if audit log is old
   */
  isOld(maxDays: number = 30): boolean {
    return this.getAgeInDays() > maxDays;
  }

  /**
   * Gets a human-readable age string
   * @returns Age string
   */
  getAgeString(): string {
    const days = this.getAgeInDays();
    const hours = this.getAgeInHours();
    const minutes = this.getAgeInMinutes();
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  /**
   * Gets the action type category
   * @returns Action category
   */
  getActionCategory(): string {
    if (this.isCreation()) return 'CREATE';
    if (this.isUpdate()) return 'UPDATE';
    if (this.isDeletion()) return 'DELETE';
    if (this.isStatusChange()) return 'STATUS_CHANGE';
    if (this.isRoleChange()) return 'ROLE_CHANGE';
    if (this.isSupervisorAssignment()) return 'SUPERVISOR_ASSIGNMENT';
    return 'OTHER';
  }

  /**
   * Gets the priority level for the audit log (higher number = higher priority)
   * @returns Priority level
   */
  getPriority(): number {
    if (this.isDeletion()) return 4; // Highest priority
    if (this.isRoleChange()) return 3; // High priority
    if (this.isSupervisorAssignment()) return 2; // Medium priority
    if (this.isStatusChange()) return 1; // Low priority
    return 0; // Normal priority
  }

  /**
   * Checks if the audit log is high priority
   * @returns True if audit log is high priority
   */
  isHighPriority(): boolean {
    return this.getPriority() >= 3;
  }

  /**
   * Gets a summary of the audit log
   * @returns Summary string
   */
  getSummary(): string {
    const category = this.getActionCategory();
    const age = this.getAgeString();
    return `${category} on ${this.entity} (${this.entityId}) - ${age}`;
  }

  /**
   * Gets the timestamp formatted in Central America Time
   * @returns Formatted timestamp string
   */
  getTimestampFormatted(): string {
    return formatCentralAmericaTime(this.timestamp);
  }

  /**
   * Gets the age of the audit log in Central America Time
   * @returns Age in hours
   */
  getAgeInHours(): number {
    const now = getCentralAmericaTime();
    const diffTime = Math.abs(now.getTime() - this.timestamp.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  /**
   * Gets the age of the audit log in Central America Time as formatted string
   * @returns Age string (e.g., "2 hours ago", "1 day ago")
   */
  getAgeFormatted(): string {
    const hours = this.getAgeInHours();
    if (hours < 1) {
      return 'Just now';
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }
}
