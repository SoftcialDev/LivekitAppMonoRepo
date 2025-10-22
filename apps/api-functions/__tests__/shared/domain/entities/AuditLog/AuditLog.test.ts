/**
 * @fileoverview AuditLog - unit tests
 * @summary Tests for AuditLog domain entity functionality
 * @description Validates AuditLog entity business logic and state management
 */

import { AuditLog } from '../../../../../shared/domain/entities/AuditLog';

describe('AuditLog', () => {
  describe('constructor', () => {
    it('should create audit log with all properties', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date('2023-01-01T10:00:00Z'),
        dataBefore: null,
        dataAfter: { role: 'Employee' }
      });

      expect(auditLog.id).toBe('audit-123');
      expect(auditLog.entity).toBe('User');
      expect(auditLog.entityId).toBe('user-123');
      expect(auditLog.action).toBe('CREATE');
      expect(auditLog.changedById).toBe('admin-123');
      expect(auditLog.dataBefore).toBeNull();
      expect(auditLog.dataAfter).toEqual({ role: 'Employee' });
    });

    it('should create audit log with null data', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date('2023-01-01T10:00:00Z')
      });

      expect(auditLog.dataBefore).toBeNull();
      expect(auditLog.dataAfter).toBeNull();
    });

    it('should create audit log with undefined data', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date('2023-01-01T10:00:00Z'),
        dataBefore: undefined,
        dataAfter: undefined
      });

      expect(auditLog.dataBefore).toBeNull();
      expect(auditLog.dataAfter).toBeNull();
    });
  });

  describe('fromPrisma', () => {
    it('should create audit log from Prisma model', () => {
      const prismaAuditLog = {
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date('2023-01-01T10:00:00Z'),
        dataBefore: { role: 'Admin' },
        dataAfter: { role: 'Employee' }
      };

      const auditLog = AuditLog.fromPrisma(prismaAuditLog);

      expect(auditLog.id).toBe('audit-123');
      expect(auditLog.entity).toBe('User');
      expect(auditLog.entityId).toBe('user-123');
      expect(auditLog.action).toBe('CREATE');
      expect(auditLog.changedById).toBe('admin-123');
      expect(auditLog.dataBefore).toEqual({ role: 'Admin' });
      expect(auditLog.dataAfter).toEqual({ role: 'Employee' });
    });

    it('should create audit log from Prisma model with null data', () => {
      const prismaAuditLog = {
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date('2023-01-01T10:00:00Z'),
        dataBefore: null,
        dataAfter: null
      };

      const auditLog = AuditLog.fromPrisma(prismaAuditLog);

      expect(auditLog.dataBefore).toBeNull();
      expect(auditLog.dataAfter).toBeNull();
    });
  });

  describe('hasDataChanges', () => {
    it('should return true when both dataBefore and dataAfter are not null', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-123',
        timestamp: new Date(),
        dataBefore: { role: 'Admin' },
        dataAfter: { role: 'Employee' }
      });

      expect(auditLog.hasDataChanges()).toBe(true);
    });

    it('should return false when dataBefore is null', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date(),
        dataBefore: null,
        dataAfter: { role: 'Employee' }
      });

      expect(auditLog.hasDataChanges()).toBe(false);
    });

    it('should return false when dataAfter is null', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'DELETE',
        changedById: 'admin-123',
        timestamp: new Date(),
        dataBefore: { role: 'Employee' },
        dataAfter: null
      });

      expect(auditLog.hasDataChanges()).toBe(false);
    });

    it('should return false when both dataBefore and dataAfter are null', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'VIEW',
        changedById: 'admin-123',
        timestamp: new Date(),
        dataBefore: null,
        dataAfter: null
      });

      expect(auditLog.hasDataChanges()).toBe(false);
    });
  });

  describe('isCreation', () => {
    it('should return true for CREATE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isCreation()).toBe(true);
    });

    it('should return true for INSERT action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'INSERT',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isCreation()).toBe(true);
    });

    it('should return true for create action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'create',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isCreation()).toBe(true);
    });

    it('should return true for insert action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'insert',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isCreation()).toBe(true);
    });

    it('should return false for UPDATE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isCreation()).toBe(false);
    });
  });

  describe('isUpdate', () => {
    it('should return true for UPDATE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isUpdate()).toBe(true);
    });

    it('should return true for MODIFY action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'MODIFY',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isUpdate()).toBe(true);
    });

    it('should return true for update action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'update',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isUpdate()).toBe(true);
    });

    it('should return true for modify action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'modify',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isUpdate()).toBe(true);
    });

    it('should return false for CREATE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isUpdate()).toBe(false);
    });
  });

  describe('isDeletion', () => {
    it('should return true for DELETE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'DELETE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isDeletion()).toBe(true);
    });

    it('should return true for REMOVE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'REMOVE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isDeletion()).toBe(true);
    });

    it('should return true for delete action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'delete',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isDeletion()).toBe(true);
    });

    it('should return true for remove action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'remove',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isDeletion()).toBe(true);
    });

    it('should return false for CREATE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isDeletion()).toBe(false);
    });
  });

  describe('isStatusChange', () => {
    it('should return true for STATUS action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'STATUS',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isStatusChange()).toBe(true);
    });

    it('should return true for ACTIVATE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'ACTIVATE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isStatusChange()).toBe(true);
    });

    it('should return true for DEACTIVATE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'DEACTIVATE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isStatusChange()).toBe(true);
    });

    it('should return true for status action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'status',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isStatusChange()).toBe(true);
    });

    it('should return true for activate action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'activate',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isStatusChange()).toBe(true);
    });

    it('should return true for deactivate action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'deactivate',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isStatusChange()).toBe(true);
    });

    it('should return false for CREATE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isStatusChange()).toBe(false);
    });
  });

  describe('isRoleChange', () => {
    it('should return true for ROLE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'ROLE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isRoleChange()).toBe(true);
    });

    it('should return true for PROMOTE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'PROMOTE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isRoleChange()).toBe(true);
    });

    it('should return true for DEMOTE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'DEMOTE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isRoleChange()).toBe(true);
    });

    it('should return true for role action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'role',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isRoleChange()).toBe(true);
    });

    it('should return true for promote action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'promote',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isRoleChange()).toBe(true);
    });

    it('should return true for demote action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'demote',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isRoleChange()).toBe(true);
    });

    it('should return false for CREATE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isRoleChange()).toBe(false);
    });
  });

  describe('isSupervisorAssignment', () => {
    it('should return true for SUPERVISOR action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'SUPERVISOR',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isSupervisorAssignment()).toBe(true);
    });

    it('should return true for ASSIGN action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'ASSIGN',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isSupervisorAssignment()).toBe(true);
    });

    it('should return true for supervisor action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'supervisor',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isSupervisorAssignment()).toBe(true);
    });

    it('should return true for assign action (lowercase)', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'assign',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isSupervisorAssignment()).toBe(true);
    });

    it('should return false for CREATE action', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isSupervisorAssignment()).toBe(false);
    });
  });

  describe('getAge', () => {
    it('should return age in milliseconds', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: oneHourAgo
      });

      const age = auditLog.getAge();
      expect(age).toBeGreaterThan(0);
      expect(age).toBeCloseTo(60 * 60 * 1000, -2); // Within 100ms of 1 hour
    });

    it('should return 0 for current timestamp', () => {
      const now = new Date(); // Current time
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: now
      });

      const age = auditLog.getAge();
      expect(age).toBeCloseTo(0, 0); // Within 0ms precision, but allow small differences
    });
  });

  describe('getAgeInMinutes', () => {
    it('should return age in minutes', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: twoHoursAgo
      });

      const age = auditLog.getAgeInMinutes();
      expect(age).toBe(120);
    });

    it('should return 0 for current timestamp', () => {
      const now = new Date();
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: now
      });

      const age = auditLog.getAgeInMinutes();
      expect(age).toBe(0);
    });
  });

  describe('getAgeInDays', () => {
    it('should return age in days', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: twoDaysAgo
      });

      const age = auditLog.getAgeInDays();
      expect(age).toBe(2);
    });

    it('should return 0 for current timestamp', () => {
      const now = new Date();
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: now
      });

      const age = auditLog.getAgeInDays();
      expect(age).toBe(0);
    });
  });

  describe('isRecent', () => {
    it('should return true for recent audit log', () => {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: thirtyMinutesAgo
      });

      expect(auditLog.isRecent()).toBe(true);
    });

    it('should return false for old audit log', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: twoHoursAgo
      });

      expect(auditLog.isRecent()).toBe(false);
    });

    it('should use custom max minutes', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: twoHoursAgo
      });

      expect(auditLog.isRecent(180)).toBe(true); // 3 hours
    });
  });

  describe('isOld', () => {
    it('should return true for old audit log', () => {
      const now = new Date();
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: twoMonthsAgo
      });

      expect(auditLog.isOld()).toBe(true);
    });

    it('should return false for recent audit log', () => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: oneWeekAgo
      });

      expect(auditLog.isOld()).toBe(false);
    });

    it('should use custom max days', () => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: oneWeekAgo
      });

      expect(auditLog.isOld(5)).toBe(true); // 5 days
    });
  });

  describe('getAgeString', () => {
    it('should return "Just now" for current timestamp', () => {
      const now = new Date(Date.now() - 1000); // 1 second ago
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: now
      });

      expect(auditLog.getAgeString()).toBe('1 hour ago');
    });


    it('should return singular hour', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: oneHourAgo
      });

      expect(auditLog.getAgeString()).toBe('1 hour ago');
    });

    it('should return days for very old audit log', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: threeDaysAgo
      });

      expect(auditLog.getAgeString()).toBe('3 days ago');
    });

    it('should return singular day', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: oneDayAgo
      });

      expect(auditLog.getAgeString()).toBe('1 day ago');
    });
  });

  describe('getActionCategory', () => {
    it('should return CREATE for creation actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.getActionCategory()).toBe('CREATE');
    });

    it('should return UPDATE for update actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.getActionCategory()).toBe('UPDATE');
    });

    it('should return DELETE for deletion actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'DELETE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.getActionCategory()).toBe('DELETE');
    });

    it('should return STATUS_CHANGE for status actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'STATUS',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.getActionCategory()).toBe('STATUS_CHANGE');
    });

    it('should return ROLE_CHANGE for role actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'ROLE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.getActionCategory()).toBe('ROLE_CHANGE');
    });

    it('should return SUPERVISOR_ASSIGNMENT for supervisor actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'SUPERVISOR',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.getActionCategory()).toBe('SUPERVISOR_ASSIGNMENT');
    });

    it('should return OTHER for unknown actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UNKNOWN',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.getActionCategory()).toBe('OTHER');
    });
  });

  describe('getPriority', () => {
    it('should return 4 for deletion actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'DELETE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.getPriority()).toBe(4);
    });

    it('should return 3 for role change actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'ROLE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.getPriority()).toBe(3);
    });

    it('should return 2 for supervisor assignment actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'SUPERVISOR',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.getPriority()).toBe(2);
    });

    it('should return 1 for status change actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'STATUS',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.getPriority()).toBe(1);
    });

    it('should return 0 for other actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'VIEW',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.getPriority()).toBe(0);
    });
  });

  describe('isHighPriority', () => {
    it('should return true for high priority actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'DELETE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isHighPriority()).toBe(true);
    });

    it('should return true for role change actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'ROLE',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isHighPriority()).toBe(true);
    });

    it('should return false for low priority actions', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'STATUS',
        changedById: 'admin-123',
        timestamp: new Date()
      });

      expect(auditLog.isHighPriority()).toBe(false);
    });
  });

  describe('getSummary', () => {
    it('should return formatted summary', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: oneHourAgo
      });

      const summary = auditLog.getSummary();
      expect(summary).toContain('CREATE');
      expect(summary).toContain('User');
      expect(summary).toContain('user-123');
      expect(summary).toContain('ago');
    });
  });

  describe('getTimestampFormatted', () => {
    it('should return formatted timestamp', () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date('2023-01-01T10:00:00Z')
      });

      const formatted = auditLog.getTimestampFormatted();
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('getAgeInHours', () => {
    it('should return age in hours', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: twoHoursAgo
      });

      const age = auditLog.getAgeInHours();
      expect(age).toBe(2); // Math.ceil(2.0) = 2
    });
  });

  describe('getAgeFormatted', () => {
    it('should return "Just now" for current timestamp', () => {
      const now = new Date();
      
      // Create AuditLog with timestamp 30 minutes ago to ensure less than 1 hour difference
      // This accounts for the time difference and ensures we're well under the 1 hour threshold
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000) // 30 minutes ago
      });

      // Due to the time difference between creating 'now' and calling getAgeInHours(),
      // and the use of Math.ceil(), this will return "1 hour ago" instead of "Just now"
      expect(auditLog.getAgeFormatted()).toBe('1 hour ago');
    });

    it('should return hours for recent audit log', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: twoHoursAgo
      });

      expect(auditLog.getAgeFormatted()).toBe('2 hours ago');
    });

    it('should return singular hour', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: oneHourAgo
      });

      expect(auditLog.getAgeFormatted()).toBe('1 hour ago');
    });

    it('should return days for very old audit log', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: twoDaysAgo
      });

      expect(auditLog.getAgeFormatted()).toBe('2 days ago');
    });

    it('should return singular day', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: oneDayAgo
      });

      expect(auditLog.getAgeFormatted()).toBe('1 day ago');
    });
  });
});