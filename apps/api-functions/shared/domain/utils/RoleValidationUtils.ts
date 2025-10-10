/**
 * @fileoverview RoleValidationUtils - Common role validation utilities
 * @description Provides reusable role validation functions for domain logic
 */

import { UserRole } from '@prisma/client';

/**
 * Common role validation utilities for domain operations
 */
export class RoleValidationUtils {
  /**
   * Validates if a role assignment is valid
   * @param callerRole - Role of the caller
   * @param targetRole - Role being assigned
   * @returns True if assignment is valid
   */
  static isValidRoleAssignment(callerRole: UserRole, targetRole: UserRole | null): boolean {
    // Supervisors can only assign Employee role
    if (callerRole === UserRole.Supervisor && targetRole !== UserRole.Employee && targetRole !== null) {
      return false;
    }

    // Only Admins and SuperAdmins can delete users
    if (targetRole === null && !this.canManageUsers(callerRole)) {
      return false;
    }

    return true;
  }

  /**
   * Checks if a role can manage users
   * @param role - User role
   * @returns True if role can manage users
   */
  static canManageUsers(role: UserRole): boolean {
    return role === UserRole.Admin || role === UserRole.SuperAdmin;
  }

  /**
   * Checks if a role can send commands
   * @param role - User role
   * @returns True if role can send commands
   */
  static canSendCommands(role: UserRole): boolean {
    return role === UserRole.Admin || role === UserRole.Supervisor || role === UserRole.SuperAdmin;
  }

  /**
   * Checks if a role can access admin functions
   * @param role - User role
   * @returns True if role can access admin functions
   */
  static canAccessAdmin(role: UserRole): boolean {
    return role === UserRole.SuperAdmin;
  }

  /**
   * Gets the hierarchy level of a role
   * @param role - User role
   * @returns Hierarchy level (higher number = more privileges)
   */
  static getRoleHierarchy(role: UserRole): number {
    const hierarchy: Record<UserRole, number> = {
      [UserRole.Unassigned]: 0,
      [UserRole.Employee]: 1,
      [UserRole.ContactManager]: 2,
      [UserRole.Supervisor]: 3,
      [UserRole.Admin]: 4,
      [UserRole.SuperAdmin]: 5,
    };
    return hierarchy[role];
  }

  /**
   * Checks if a caller can assign a specific role
   * @param callerRole - Role of the caller
   * @param targetRole - Role being assigned
   * @returns True if caller can assign the role
   */
  static canAssignRole(callerRole: UserRole, targetRole: UserRole): boolean {
    const callerLevel = this.getRoleHierarchy(callerRole);
    const targetLevel = this.getRoleHierarchy(targetRole);
    
    // Can only assign roles at or below caller's level
    return callerLevel >= targetLevel;
  }

  /**
   * Gets valid roles that a caller can assign
   * @param callerRole - Role of the caller
   * @returns Array of roles that can be assigned
   */
  static getAssignableRoles(callerRole: UserRole): UserRole[] {
    const allRoles = Object.values(UserRole);
    return allRoles.filter(role => this.canAssignRole(callerRole, role));
  }

  /**
   * Validates if a role change is allowed
   * @param callerRole - Role of the caller
   * @param currentTargetRole - Current role of the target
   * @param newTargetRole - New role for the target
   * @returns True if role change is allowed
   */
  static isRoleChangeAllowed(
    callerRole: UserRole, 
    currentTargetRole: UserRole, 
    newTargetRole: UserRole | null
  ): boolean {
    // Can't change to the same role
    if (currentTargetRole === newTargetRole) {
      return false;
    }

    // Validate assignment permissions
    if (newTargetRole && !this.canAssignRole(callerRole, newTargetRole)) {
      return false;
    }

    // Validate deletion permissions
    if (newTargetRole === null && !this.canManageUsers(callerRole)) {
      return false;
    }

    return true;
  }
}
