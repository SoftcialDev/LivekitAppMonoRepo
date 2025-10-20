/**
 * @fileoverview User entity - unit tests
 */

// Mock UserRole enum globally
jest.mock('@prisma/client', () => ({
  UserRole: {
    Admin: 'Admin',
    Supervisor: 'Supervisor',
    Employee: 'Employee',
    SuperAdmin: 'SuperAdmin',
    ContactManager: 'ContactManager',
    Unassigned: 'Unassigned'
  }
}));

// Mock dateUtils
jest.mock('../../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2023-01-01T12:00:00Z')),
  formatCentralAmericaTime: jest.fn((date: Date) => date.toISOString())
}));

import { User } from '../../../../../shared/domain/entities/User';
import { UserRole } from '@prisma/client';

describe('User', () => {
  const baseUserProps = {
    id: 'user123',
    azureAdObjectId: 'azure123',
    email: 'test@example.com',
    fullName: 'Test User',
    role: UserRole.Employee,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T11:00:00Z')
  };

  describe('constructor', () => {
    it('creates user with all required properties', () => {
      const user = new User(baseUserProps);
      
      expect(user.id).toBe('user123');
      expect(user.azureAdObjectId).toBe('azure123');
      expect(user.email).toBe('test@example.com');
      expect(user.fullName).toBe('Test User');
      expect(user.role).toBe(UserRole.Employee);
      expect(user.createdAt).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(user.updatedAt).toEqual(new Date('2023-01-01T11:00:00Z'));
    });

    it('converts email to lowercase', () => {
      const user = new User({ ...baseUserProps, email: 'TEST@EXAMPLE.COM' });
      expect(user.email).toBe('test@example.com');
    });

    it('sets optional properties to null when not provided', () => {
      const user = new User(baseUserProps);
      expect(user.roleChangedAt).toBeNull();
      expect(user.supervisorId).toBeNull();
      expect(user.assignedAt).toBeNull();
      expect(user.deletedAt).toBeNull();
    });

    it('sets optional properties when provided', () => {
      const user = new User({
        ...baseUserProps,
        roleChangedAt: new Date('2023-01-01T09:00:00Z'),
        supervisorId: 'supervisor123',
        assignedAt: new Date('2023-01-01T08:00:00Z'),
        deletedAt: new Date('2023-01-01T12:00:00Z')
      });
      
      expect(user.roleChangedAt).toEqual(new Date('2023-01-01T09:00:00Z'));
      expect(user.supervisorId).toBe('supervisor123');
      expect(user.assignedAt).toEqual(new Date('2023-01-01T08:00:00Z'));
      expect(user.deletedAt).toEqual(new Date('2023-01-01T12:00:00Z'));
    });
  });

  describe('fromPrisma', () => {
    it('creates user from Prisma model', () => {
      const prismaUser = {
        id: 'user123',
        azureAdObjectId: 'azure123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: UserRole.Employee,
        roleChangedAt: new Date('2023-01-01T09:00:00Z'),
        supervisorId: 'supervisor123',
        assignedAt: new Date('2023-01-01T08:00:00Z'),
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        deletedAt: null
      };

      const user = User.fromPrisma(prismaUser);
      
      expect(user.id).toBe('user123');
      expect(user.azureAdObjectId).toBe('azure123');
      expect(user.email).toBe('test@example.com');
      expect(user.fullName).toBe('Test User');
      expect(user.role).toBe(UserRole.Employee);
    });
  });

  describe('isActive', () => {
    it('returns true when user is not deleted', () => {
      const user = new User(baseUserProps);
      expect(user.isActive()).toBe(true);
    });

    it('returns false when user is deleted', () => {
      const user = new User({
        ...baseUserProps,
        deletedAt: new Date('2023-01-01T12:00:00Z')
      });
      expect(user.isActive()).toBe(false);
    });
  });

  describe('role checks', () => {
    it('isEmployee returns true for Employee role', () => {
      const user = new User({ ...baseUserProps, role: UserRole.Employee });
      expect(user.isEmployee()).toBe(true);
    });

    it('isEmployee returns false for other roles', () => {
      const user = new User({ ...baseUserProps, role: UserRole.Admin });
      expect(user.isEmployee()).toBe(false);
    });

    it('isSupervisor returns true for Supervisor role', () => {
      const user = new User({ ...baseUserProps, role: UserRole.Supervisor });
      expect(user.isSupervisor()).toBe(true);
    });

    it('isAdmin returns true for Admin role', () => {
      const user = new User({ ...baseUserProps, role: UserRole.Admin });
      expect(user.isAdmin()).toBe(true);
    });

    it('isSuperAdmin returns true for SuperAdmin role', () => {
      const user = new User({ ...baseUserProps, role: UserRole.SuperAdmin });
      expect(user.isSuperAdmin()).toBe(true);
    });

    it('isContactManager returns true for ContactManager role', () => {
      const user = new User({ ...baseUserProps, role: UserRole.ContactManager });
      expect(user.isContactManager()).toBe(true);
    });
  });

  describe('permission checks', () => {
    it('canSendCommands returns true for Admin, Supervisor, and SuperAdmin', () => {
      const admin = new User({ ...baseUserProps, role: UserRole.Admin });
      const supervisor = new User({ ...baseUserProps, role: UserRole.Supervisor });
      const superAdmin = new User({ ...baseUserProps, role: UserRole.SuperAdmin });
      
      expect(admin.canSendCommands()).toBe(true);
      expect(supervisor.canSendCommands()).toBe(true);
      expect(superAdmin.canSendCommands()).toBe(true);
    });

    it('canSendCommands returns false for Employee and ContactManager', () => {
      const employee = new User({ ...baseUserProps, role: UserRole.Employee });
      const contactManager = new User({ ...baseUserProps, role: UserRole.ContactManager });
      
      expect(employee.canSendCommands()).toBe(false);
      expect(contactManager.canSendCommands()).toBe(false);
    });

    it('canManageUsers returns true for Admin, Supervisor, and SuperAdmin', () => {
      const admin = new User({ ...baseUserProps, role: UserRole.Admin });
      const supervisor = new User({ ...baseUserProps, role: UserRole.Supervisor });
      const superAdmin = new User({ ...baseUserProps, role: UserRole.SuperAdmin });
      
      expect(admin.canManageUsers()).toBe(true);
      expect(supervisor.canManageUsers()).toBe(true);
      expect(superAdmin.canManageUsers()).toBe(true);
    });

    it('canAccessAdmin returns true only for SuperAdmin', () => {
      const superAdmin = new User({ ...baseUserProps, role: UserRole.SuperAdmin });
      const admin = new User({ ...baseUserProps, role: UserRole.Admin });
      
      expect(superAdmin.canAccessAdmin()).toBe(true);
      expect(admin.canAccessAdmin()).toBe(false);
    });

    it('canBeAssignedToSupervisor returns true only for Employee', () => {
      const employee = new User({ ...baseUserProps, role: UserRole.Employee });
      const admin = new User({ ...baseUserProps, role: UserRole.Admin });
      
      expect(employee.canBeAssignedToSupervisor()).toBe(true);
      expect(admin.canBeAssignedToSupervisor()).toBe(false);
    });

    it('canBeSupervisor returns true only for Supervisor', () => {
      const supervisor = new User({ ...baseUserProps, role: UserRole.Supervisor });
      const admin = new User({ ...baseUserProps, role: UserRole.Admin });
      
      expect(supervisor.canBeSupervisor()).toBe(true);
      expect(admin.canBeSupervisor()).toBe(false);
    });
  });

  describe('supervisor relationships', () => {
    it('hasSupervisor returns true when supervisorId is set', () => {
      const user = new User({ ...baseUserProps, supervisorId: 'supervisor123' });
      expect(user.hasSupervisor()).toBe(true);
    });

    it('hasSupervisor returns false when supervisorId is null', () => {
      const user = new User(baseUserProps);
      expect(user.hasSupervisor()).toBe(false);
    });
  });

  describe('display methods', () => {
    it('getDisplayName returns fullName when available', () => {
      const user = new User({ ...baseUserProps, fullName: 'John Doe' });
      expect(user.getDisplayName()).toBe('John Doe');
    });

    it('getDisplayName returns email prefix when fullName is empty', () => {
      const user = new User({ ...baseUserProps, fullName: '' });
      expect(user.getDisplayName()).toBe('test');
    });

    it('hasAnyRole returns true when user has one of the specified roles', () => {
      const user = new User({ ...baseUserProps, role: UserRole.Admin });
      expect(user.hasAnyRole([UserRole.Admin, UserRole.Supervisor])).toBe(true);
    });

    it('hasAnyRole returns false when user does not have any of the specified roles', () => {
      const user = new User({ ...baseUserProps, role: UserRole.Employee });
      expect(user.hasAnyRole([UserRole.Admin, UserRole.Supervisor])).toBe(false);
    });

    it('hasRole returns true when user has the specified role', () => {
      const user = new User({ ...baseUserProps, role: UserRole.Admin });
      expect(user.hasRole(UserRole.Admin)).toBe(true);
    });

    it('hasRole returns false when user does not have the specified role', () => {
      const user = new User({ ...baseUserProps, role: UserRole.Employee });
      expect(user.hasRole(UserRole.Admin)).toBe(false);
    });
  });

  describe('date formatting methods', () => {
    it('getCreatedAtFormatted returns formatted date', () => {
      const user = new User(baseUserProps);
      const result = user.getCreatedAtFormatted();
      expect(result).toBeDefined();
    });

    it('getUpdatedAtFormatted returns formatted date', () => {
      const user = new User(baseUserProps);
      const result = user.getUpdatedAtFormatted();
      expect(result).toBeDefined();
    });

    it('getDeletedAtFormatted returns null when not deleted', () => {
      const user = new User(baseUserProps);
      expect(user.getDeletedAtFormatted()).toBeNull();
    });

    it('getDeletedAtFormatted returns formatted date when deleted', () => {
      const user = new User({
        ...baseUserProps,
        deletedAt: new Date('2023-01-01T12:00:00Z')
      });
      const result = user.getDeletedAtFormatted();
      expect(result).toBeDefined();
    });

    it('getRoleChangedAtFormatted returns null when not changed', () => {
      const user = new User(baseUserProps);
      expect(user.getRoleChangedAtFormatted()).toBeNull();
    });

    it('getRoleChangedAtFormatted returns formatted date when changed', () => {
      const user = new User({
        ...baseUserProps,
        roleChangedAt: new Date('2023-01-01T09:00:00Z')
      });
      const result = user.getRoleChangedAtFormatted();
      expect(result).toBeDefined();
    });

    it('getAssignedAtFormatted returns null when not assigned', () => {
      const user = new User(baseUserProps);
      expect(user.getAssignedAtFormatted()).toBeNull();
    });

    it('getAssignedAtFormatted returns formatted date when assigned', () => {
      const user = new User({
        ...baseUserProps,
        assignedAt: new Date('2023-01-01T08:00:00Z')
      });
      const result = user.getAssignedAtFormatted();
      expect(result).toBeDefined();
    });
  });

  describe('time calculations', () => {
    it('getAccountAgeInDays returns positive number', () => {
      const user = new User(baseUserProps);
      const age = user.getAccountAgeInDays();
      expect(age).toBeGreaterThanOrEqual(0);
    });

    it('getTimeSinceLastUpdate returns positive number', () => {
      const user = new User(baseUserProps);
      const time = user.getTimeSinceLastUpdate();
      expect(time).toBeGreaterThanOrEqual(0);
    });
  });

  describe('inactive user behavior', () => {
    it('role checks return false for inactive users', () => {
      const user = new User({
        ...baseUserProps,
        role: UserRole.Admin,
        deletedAt: new Date('2023-01-01T12:00:00Z')
      });
      
      expect(user.isAdmin()).toBe(false);
      expect(user.canSendCommands()).toBe(false);
      expect(user.canManageUsers()).toBe(false);
    });

    it('hasAnyRole returns false for inactive users', () => {
      const user = new User({
        ...baseUserProps,
        role: UserRole.Admin,
        deletedAt: new Date('2023-01-01T12:00:00Z')
      });
      
      expect(user.hasAnyRole([UserRole.Admin])).toBe(false);
    });
  });
});
