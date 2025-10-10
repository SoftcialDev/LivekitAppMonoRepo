/**
 * @fileoverview User - Domain entity for user management
 * @description Encapsulates user business logic and state management
 */

import { UserRole } from '@prisma/client';
import { getCentralAmericaTime, formatCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Domain entity representing a User with business logic
 */
export class User {
  public readonly id: string;
  public readonly azureAdObjectId: string;
  public readonly email: string;
  public readonly fullName: string;
  public readonly role: UserRole;
  public readonly roleChangedAt: Date | null;
  public readonly supervisorId: string | null;
  public readonly assignedAt: Date | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date | null;

  /**
   * Creates a new User entity
   * @param props - User properties
   */
  constructor(props: {
    id: string;
    azureAdObjectId: string;
    email: string;
    fullName: string;
    role: UserRole;
    roleChangedAt?: Date | null;
    supervisorId?: string | null;
    assignedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
  }) {
    this.id = props.id;
    this.azureAdObjectId = props.azureAdObjectId;
    this.email = props.email.toLowerCase();
    this.fullName = props.fullName;
    this.role = props.role;
    this.roleChangedAt = props.roleChangedAt || null;
    this.supervisorId = props.supervisorId || null;
    this.assignedAt = props.assignedAt || null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt || null;
  }

  /**
   * Creates a User entity from Prisma model
   * @param prismaUser - Prisma User model
   * @returns User entity
   */
  static fromPrisma(prismaUser: any): User {
    return new User({
      id: prismaUser.id,
      azureAdObjectId: prismaUser.azureAdObjectId,
      email: prismaUser.email,
      fullName: prismaUser.fullName,
      role: prismaUser.role,
      roleChangedAt: prismaUser.roleChangedAt,
      supervisorId: prismaUser.supervisorId,
      assignedAt: prismaUser.assignedAt,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      deletedAt: prismaUser.deletedAt,
    });
  }

  /**
   * Checks if the user is active (not deleted)
   * @returns True if user is active
   */
  isActive(): boolean {
    return !this.deletedAt;
  }

  /**
   * Checks if the user is an employee
   * @returns True if user is an employee
   */
  isEmployee(): boolean {
    return this.isActive() && this.role === UserRole.Employee;
  }

  /**
   * Checks if the user is a supervisor
   * @returns True if user is a supervisor
   */
  isSupervisor(): boolean {
    return this.isActive() && this.role === UserRole.Supervisor;
  }

  /**
   * Checks if the user is an admin
   * @returns True if user is an admin
   */
  isAdmin(): boolean {
    return this.isActive() && this.role === UserRole.Admin;
  }

  /**
   * Checks if the user is a super admin
   * @returns True if user is a super admin
   */
  isSuperAdmin(): boolean {
    return this.isActive() && this.role === UserRole.SuperAdmin;
  }

  /**
   * Checks if the user is a contact manager
   * @returns True if user is a contact manager
   */
  isContactManager(): boolean {
    return this.isActive() && this.role === UserRole.ContactManager;
  }

  /**
   * Checks if the user can send commands
   * @returns True if user can send commands
   */
  canSendCommands(): boolean {
    return this.isActive() && (
      this.role === UserRole.Admin ||
      this.role === UserRole.Supervisor ||
      this.role === UserRole.SuperAdmin
    );
  }

  /**
   * Checks if the user can manage users
   * @returns True if user can manage users
   */
  canManageUsers(): boolean {
    return this.isActive() && (
      this.role === UserRole.Admin ||
      this.role === UserRole.Supervisor ||
      this.role === UserRole.SuperAdmin
    );
  }

  /**
   * Checks if the user can access admin functions
   * @returns True if user can access admin functions
   */
  canAccessAdmin(): boolean {
    return this.isActive() && this.role === UserRole.SuperAdmin;
  }

  /**
   * Checks if the user can be assigned to a supervisor
   * @returns True if user can be assigned to a supervisor
   */
  canBeAssignedToSupervisor(): boolean {
    return this.isActive() && this.role === UserRole.Employee;
  }

  /**
   * Checks if the user has a supervisor assigned
   * @returns True if user has a supervisor
   */
  hasSupervisor(): boolean {
    return this.supervisorId !== null;
  }

  /**
   * Checks if the user can be a supervisor for others
   * @returns True if user can be a supervisor
   */
  canBeSupervisor(): boolean {
    return this.isActive() && this.role === UserRole.Supervisor;
  }

  /**
   * Gets the user's display name
   * @returns User's display name
   */
  getDisplayName(): string {
    return this.fullName || this.email.split('@')[0];
  }

  /**
   * Checks if the user has any of the specified roles
   * @param roles - Array of roles to check
   * @returns True if user has any of the roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    return this.isActive() && roles.includes(this.role);
  }

  /**
   * Checks if the user has a specific role
   * @param role - Role to check
   * @returns True if user has the role
   */
  hasRole(role: UserRole): boolean {
    return this.isActive() && this.role === role;
  }

  /**
   * Gets the creation date formatted in Central America Time
   * @returns Formatted creation date string
   */
  getCreatedAtFormatted(): string {
    return formatCentralAmericaTime(this.createdAt);
  }

  /**
   * Gets the last update date formatted in Central America Time
   * @returns Formatted update date string
   */
  getUpdatedAtFormatted(): string {
    return formatCentralAmericaTime(this.updatedAt);
  }

  /**
   * Gets the deletion date formatted in Central America Time (if deleted)
   * @returns Formatted deletion date string or null
   */
  getDeletedAtFormatted(): string | null {
    return this.deletedAt ? formatCentralAmericaTime(this.deletedAt) : null;
  }

  /**
   * Gets the role change date formatted in Central America Time (if changed)
   * @returns Formatted role change date string or null
   */
  getRoleChangedAtFormatted(): string | null {
    return this.roleChangedAt ? formatCentralAmericaTime(this.roleChangedAt) : null;
  }

  /**
   * Gets the assignment date formatted in Central America Time (if assigned)
   * @returns Formatted assignment date string or null
   */
  getAssignedAtFormatted(): string | null {
    return this.assignedAt ? formatCentralAmericaTime(this.assignedAt) : null;
  }

  /**
   * Gets the age of the user account in Central America Time
   * @returns Age in days
   */
  getAccountAgeInDays(): number {
    const now = getCentralAmericaTime();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Gets the time since last update in Central America Time
   * @returns Time since last update in hours
   */
  getTimeSinceLastUpdate(): number {
    const now = getCentralAmericaTime();
    const diffTime = Math.abs(now.getTime() - this.updatedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }
}
