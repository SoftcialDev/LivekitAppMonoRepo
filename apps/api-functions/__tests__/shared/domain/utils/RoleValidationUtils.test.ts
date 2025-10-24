/**
 * @fileoverview Tests for RoleValidationUtils
 * @description Tests for role validation utilities
 */

import { RoleValidationUtils } from '../../../../shared/domain/utils/RoleValidationUtils';
import { UserRole } from '../../../../shared/domain/enums/UserRole';

describe('RoleValidationUtils', () => {
  describe('isValidRoleAssignment', () => {
    it('should return true for valid role assignments', () => {
      // SuperAdmin can assign any role
      expect(RoleValidationUtils.isValidRoleAssignment(UserRole.SuperAdmin, UserRole.Admin)).toBe(true);
      expect(RoleValidationUtils.isValidRoleAssignment(UserRole.SuperAdmin, UserRole.Supervisor)).toBe(true);
      expect(RoleValidationUtils.isValidRoleAssignment(UserRole.SuperAdmin, UserRole.Employee)).toBe(true);

      // Admin can assign roles below their level
      expect(RoleValidationUtils.isValidRoleAssignment(UserRole.Admin, UserRole.Supervisor)).toBe(true);
      expect(RoleValidationUtils.isValidRoleAssignment(UserRole.Admin, UserRole.Employee)).toBe(true);

      // Supervisor can assign Employee role
      expect(RoleValidationUtils.isValidRoleAssignment(UserRole.Supervisor, UserRole.Employee)).toBe(true);
    });

    it('should return false when supervisor tries to assign non-employee role', () => {
      expect(RoleValidationUtils.isValidRoleAssignment(UserRole.Supervisor, UserRole.Admin)).toBe(false);
      expect(RoleValidationUtils.isValidRoleAssignment(UserRole.Supervisor, UserRole.Supervisor)).toBe(false);
      expect(RoleValidationUtils.isValidRoleAssignment(UserRole.Supervisor, UserRole.SuperAdmin)).toBe(false);
    });

    it('should return false when non-admin tries to delete user', () => {
      expect(RoleValidationUtils.isValidRoleAssignment(UserRole.Supervisor, null)).toBe(false);
      expect(RoleValidationUtils.isValidRoleAssignment(UserRole.Employee, null)).toBe(false);
    });

    it('should return true when admin can delete user', () => {
      expect(RoleValidationUtils.isValidRoleAssignment(UserRole.Admin, null)).toBe(true);
      expect(RoleValidationUtils.isValidRoleAssignment(UserRole.SuperAdmin, null)).toBe(true);
    });
  });

  describe('canManageUsers', () => {
    it('should return true for admin roles', () => {
      expect(RoleValidationUtils.canManageUsers(UserRole.Admin)).toBe(true);
      expect(RoleValidationUtils.canManageUsers(UserRole.SuperAdmin)).toBe(true);
    });

    it('should return false for non-admin roles', () => {
      expect(RoleValidationUtils.canManageUsers(UserRole.Employee)).toBe(false);
      expect(RoleValidationUtils.canManageUsers(UserRole.Supervisor)).toBe(false);
      expect(RoleValidationUtils.canManageUsers(UserRole.ContactManager)).toBe(false);
      expect(RoleValidationUtils.canManageUsers(UserRole.Unassigned)).toBe(false);
    });
  });

  describe('canSendCommands', () => {
    it('should return true for roles that can send commands', () => {
      expect(RoleValidationUtils.canSendCommands(UserRole.Admin)).toBe(true);
      expect(RoleValidationUtils.canSendCommands(UserRole.Supervisor)).toBe(true);
      expect(RoleValidationUtils.canSendCommands(UserRole.SuperAdmin)).toBe(true);
    });

    it('should return false for roles that cannot send commands', () => {
      expect(RoleValidationUtils.canSendCommands(UserRole.Employee)).toBe(false);
      expect(RoleValidationUtils.canSendCommands(UserRole.ContactManager)).toBe(false);
      expect(RoleValidationUtils.canSendCommands(UserRole.Unassigned)).toBe(false);
    });
  });

  describe('canAccessAdmin', () => {
    it('should return true only for SuperAdmin', () => {
      expect(RoleValidationUtils.canAccessAdmin(UserRole.SuperAdmin)).toBe(true);
    });

    it('should return false for all other roles', () => {
      expect(RoleValidationUtils.canAccessAdmin(UserRole.Admin)).toBe(false);
      expect(RoleValidationUtils.canAccessAdmin(UserRole.Supervisor)).toBe(false);
      expect(RoleValidationUtils.canAccessAdmin(UserRole.Employee)).toBe(false);
      expect(RoleValidationUtils.canAccessAdmin(UserRole.ContactManager)).toBe(false);
      expect(RoleValidationUtils.canAccessAdmin(UserRole.Unassigned)).toBe(false);
    });
  });

  describe('getRoleHierarchy', () => {
    it('should return correct hierarchy levels', () => {
      expect(RoleValidationUtils.getRoleHierarchy(UserRole.Unassigned)).toBe(0);
      expect(RoleValidationUtils.getRoleHierarchy(UserRole.Employee)).toBe(1);
      expect(RoleValidationUtils.getRoleHierarchy(UserRole.ContactManager)).toBe(2);
      expect(RoleValidationUtils.getRoleHierarchy(UserRole.Supervisor)).toBe(3);
      expect(RoleValidationUtils.getRoleHierarchy(UserRole.Admin)).toBe(4);
      expect(RoleValidationUtils.getRoleHierarchy(UserRole.SuperAdmin)).toBe(5);
    });
  });

  describe('canAssignRole', () => {
    it('should return true when caller can assign role', () => {
      // SuperAdmin can assign any role
      expect(RoleValidationUtils.canAssignRole(UserRole.SuperAdmin, UserRole.Admin)).toBe(true);
      expect(RoleValidationUtils.canAssignRole(UserRole.SuperAdmin, UserRole.Supervisor)).toBe(true);
      expect(RoleValidationUtils.canAssignRole(UserRole.SuperAdmin, UserRole.Employee)).toBe(true);

      // Admin can assign roles below their level
      expect(RoleValidationUtils.canAssignRole(UserRole.Admin, UserRole.Supervisor)).toBe(true);
      expect(RoleValidationUtils.canAssignRole(UserRole.Admin, UserRole.Employee)).toBe(true);

      // Supervisor can assign Employee role
      expect(RoleValidationUtils.canAssignRole(UserRole.Supervisor, UserRole.Employee)).toBe(true);
    });

    it('should return false when caller cannot assign role', () => {
      // Admin cannot assign SuperAdmin role
      expect(RoleValidationUtils.canAssignRole(UserRole.Admin, UserRole.SuperAdmin)).toBe(false);

      // Supervisor cannot assign Admin role
      expect(RoleValidationUtils.canAssignRole(UserRole.Supervisor, UserRole.Admin)).toBe(false);

      // Employee cannot assign any role
      expect(RoleValidationUtils.canAssignRole(UserRole.Employee, UserRole.Supervisor)).toBe(false);
      expect(RoleValidationUtils.canAssignRole(UserRole.Employee, UserRole.Admin)).toBe(false);
    });
  });

  describe('getAssignableRoles', () => {
    it('should return correct assignable roles for SuperAdmin', () => {
      const assignableRoles = RoleValidationUtils.getAssignableRoles(UserRole.SuperAdmin);
      expect(assignableRoles).toContain(UserRole.SuperAdmin);
      expect(assignableRoles).toContain(UserRole.Admin);
      expect(assignableRoles).toContain(UserRole.Supervisor);
      expect(assignableRoles).toContain(UserRole.Employee);
      expect(assignableRoles).toContain(UserRole.ContactManager);
      expect(assignableRoles).toContain(UserRole.Unassigned);
    });

    it('should return correct assignable roles for Admin', () => {
      const assignableRoles = RoleValidationUtils.getAssignableRoles(UserRole.Admin);
      expect(assignableRoles).not.toContain(UserRole.SuperAdmin);
      expect(assignableRoles).toContain(UserRole.Admin);
      expect(assignableRoles).toContain(UserRole.Supervisor);
      expect(assignableRoles).toContain(UserRole.Employee);
      expect(assignableRoles).toContain(UserRole.ContactManager);
      expect(assignableRoles).toContain(UserRole.Unassigned);
    });

    it('should return correct assignable roles for Supervisor', () => {
      const assignableRoles = RoleValidationUtils.getAssignableRoles(UserRole.Supervisor);
      expect(assignableRoles).not.toContain(UserRole.SuperAdmin);
      expect(assignableRoles).not.toContain(UserRole.Admin);
      expect(assignableRoles).toContain(UserRole.Supervisor);
      expect(assignableRoles).toContain(UserRole.Employee);
      expect(assignableRoles).toContain(UserRole.ContactManager);
      expect(assignableRoles).toContain(UserRole.Unassigned);
    });

    it('should return correct assignable roles for Employee', () => {
      const assignableRoles = RoleValidationUtils.getAssignableRoles(UserRole.Employee);
      expect(assignableRoles).not.toContain(UserRole.SuperAdmin);
      expect(assignableRoles).not.toContain(UserRole.Admin);
      expect(assignableRoles).not.toContain(UserRole.Supervisor);
      expect(assignableRoles).not.toContain(UserRole.ContactManager);
      expect(assignableRoles).toContain(UserRole.Employee);
      expect(assignableRoles).toContain(UserRole.Unassigned);
    });
  });

  describe('isRoleChangeAllowed', () => {
    it('should return true for valid role changes', () => {
      // SuperAdmin can change Admin to Supervisor
      expect(RoleValidationUtils.isRoleChangeAllowed(
        UserRole.SuperAdmin,
        UserRole.Admin,
        UserRole.Supervisor
      )).toBe(true);

      // Admin can change Supervisor to Employee
      expect(RoleValidationUtils.isRoleChangeAllowed(
        UserRole.Admin,
        UserRole.Supervisor,
        UserRole.Employee
      )).toBe(true);

      // Admin can delete user
      expect(RoleValidationUtils.isRoleChangeAllowed(
        UserRole.Admin,
        UserRole.Employee,
        null
      )).toBe(true);
    });

    it('should return false when changing to same role', () => {
      expect(RoleValidationUtils.isRoleChangeAllowed(
        UserRole.Admin,
        UserRole.Supervisor,
        UserRole.Supervisor
      )).toBe(false);
    });

    it('should return false when caller cannot assign target role', () => {
      // Supervisor cannot change Employee to Admin
      expect(RoleValidationUtils.isRoleChangeAllowed(
        UserRole.Supervisor,
        UserRole.Employee,
        UserRole.Admin
      )).toBe(false);
    });

    it('should return false when caller cannot delete user', () => {
      // Supervisor cannot delete user
      expect(RoleValidationUtils.isRoleChangeAllowed(
        UserRole.Supervisor,
        UserRole.Employee,
        null
      )).toBe(false);
    });
  });
});
