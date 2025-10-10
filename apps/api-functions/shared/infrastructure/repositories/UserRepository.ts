/**
 * @fileoverview UserRepository - Infrastructure repository for user data access
 * @description Handles all database operations related to users
 */

import prisma from '../../services/prismaClienService';
import { UserRole } from '@prisma/client';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { User } from '../../domain/entities/User';
import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Repository for user data access operations
 */
export class UserRepository implements IUserRepository {
  /**
   * Finds a user by Azure AD object ID
   * @param azureAdObjectId - Azure AD object ID
   * @returns Promise that resolves to user entity or null
   */
  async findByAzureAdObjectId(azureAdObjectId: string): Promise<User | null> {
    const prismaUser = await prisma.user.findUnique({
      where: { azureAdObjectId }
    });
    return prismaUser ? User.fromPrisma(prismaUser) : null;
  }

  /**
   * Finds a user by email
   * @param email - User email address
   * @returns Promise that resolves to user entity or null
   */
  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    return prismaUser ? User.fromPrisma(prismaUser) : null;
  }

  /**
   * Checks if a user exists and is not deleted
   * @param azureAdObjectId - Azure AD object ID
   * @returns Promise that resolves to true if user exists and is active
   */
  async existsAndActive(azureAdObjectId: string): Promise<boolean> {
    const user = await this.findByAzureAdObjectId(azureAdObjectId);
    return user ? user.isActive() : false;
  }

  /**
   * Checks if a user has a specific role
   * @param azureAdObjectId - Azure AD object ID
   * @param role - Role to check
   * @returns Promise that resolves to true if user has the role
   */
  async hasRole(azureAdObjectId: string, role: UserRole): Promise<boolean> {
    const user = await this.findByAzureAdObjectId(azureAdObjectId);
    return user ? user.hasRole(role) : false;
  }

  /**
   * Checks if a user has any of the specified roles
   * @param azureAdObjectId - Azure AD object ID
   * @param roles - Array of roles to check
   * @returns Promise that resolves to true if user has any of the roles
   */
  async hasAnyRole(azureAdObjectId: string, roles: UserRole[]): Promise<boolean> {
    const user = await this.findByAzureAdObjectId(azureAdObjectId);
    return user ? user.hasAnyRole(roles) : false;
  }

  /**
   * Checks if a user is an employee
   * @param email - User email
   * @returns Promise that resolves to true if user is an employee
   */
  async isEmployee(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user ? user.isEmployee() : false;
  }

  /**
   * Updates a user's supervisor assignment
   * @param email - User email
   * @param supervisorId - Supervisor ID (null for unassign)
   * @returns Promise that resolves when update is complete
   */
  async updateSupervisor(email: string, supervisorId: string | null): Promise<void> {
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        supervisorId,
        updatedAt: getCentralAmericaTime()
      }
    });
  }

  /**
   * Creates a new employee user
   * @param email - User email
   * @param fullName - User full name
   * @param supervisorId - Supervisor ID (optional)
   * @returns Promise that resolves to created user entity
   */
  async createEmployee(email: string, fullName: string, supervisorId: string | null = null): Promise<User> {
    const now = getCentralAmericaTime();
    const prismaUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        fullName,
        role: UserRole.Employee,
        supervisorId,
        azureAdObjectId: '', // Will be updated when user logs in
        createdAt: now,
        updatedAt: now
      }
    });
    return User.fromPrisma(prismaUser);
  }

  /**
   * Updates multiple users' supervisor assignments in a transaction
   * @param updates - Array of user email and supervisor ID pairs
   * @returns Promise that resolves when all updates are complete
   */
  async updateMultipleSupervisors(updates: Array<{ email: string; supervisorId: string | null }>): Promise<void> {
    const now = getCentralAmericaTime();
    await prisma.$transaction(
      updates.map(({ email, supervisorId }) =>
        prisma.user.update({
          where: { email: email.toLowerCase() },
          data: {
            supervisorId,
            updatedAt: now
          }
        })
      )
    );
  }

  /**
   * Gets users by supervisor ID
   * @param supervisorId - Supervisor ID
   * @returns Promise that resolves to array of user entities
   */
  async findBySupervisor(supervisorId: string): Promise<User[]> {
    const prismaUsers = await prisma.user.findMany({
      where: { 
        supervisorId,
        deletedAt: null
      }
    });
    return prismaUsers.map(user => User.fromPrisma(user));
  }

  /**
   * Deletes a user by ID
   * @param userId - User ID
   * @returns Promise that resolves when user is deleted
   */
  async deleteUser(userId: string): Promise<void> {
    const now = getCentralAmericaTime();
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: now,
        updatedAt: now
      }
    });
  }

  /**
   * Upserts a user (creates or updates)
   * @param userData - User data to upsert
   * @returns Promise that resolves to user entity
   */
  async upsertUser(userData: {
    email: string;
    azureAdObjectId: string;
    fullName: string;
    role: UserRole;
  }): Promise<User> {
    const now = getCentralAmericaTime();
    
    // Determine deletedAt based on role using centralized logic
    const deletedAtValue = this.getDeletedAtValueForRole(userData.role);
    
    const prismaUser = await prisma.user.upsert({
      where: { email: userData.email.toLowerCase() },
      update: {
        azureAdObjectId: userData.azureAdObjectId,
        fullName: userData.fullName,
        role: userData.role,
        deletedAt: deletedAtValue,
        updatedAt: now
      },
      create: {
        email: userData.email.toLowerCase(),
        azureAdObjectId: userData.azureAdObjectId,
        fullName: userData.fullName,
        role: userData.role,
        deletedAt: deletedAtValue,
        createdAt: now,
        updatedAt: now
      }
    });
    return User.fromPrisma(prismaUser);
  }

  /**
   * Finds users by roles
   * @param roles - Array of user roles
   * @returns Promise that resolves to array of users
   */
  async findByRoles(roles: UserRole[]): Promise<User[]> {
    const prismaUsers = await prisma.user.findMany({
      where: { 
        // Include both active and deleted users
        role: { in: roles }
      },
      include: {
        supervisor: {
          select: { azureAdObjectId: true, fullName: true }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    return prismaUsers.map(user => User.fromPrisma(user));
  }

  /**
   * Finds users with unassigned role
   * @returns Promise that resolves to array of users with unassigned role
   */
  async findUsersWithUnassignedRole(): Promise<User[]> {
    const prismaUsers = await prisma.user.findMany({
      where: { 
        // Include both active and deleted users
        role: UserRole.Unassigned
      },
      include: {
        supervisor: {
          select: { azureAdObjectId: true, fullName: true }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    return prismaUsers.map(user => User.fromPrisma(user));
  }

  /**
   * Changes user role
   * @param userId - User ID
   * @param newRole - New role to assign
   * @returns Promise that resolves when role is changed
   */
  async changeUserRole(userId: string, newRole: UserRole): Promise<void> {
    // Determine deletedAt based on role using centralized logic
    const deletedAtValue = this.getDeletedAtValueForRole(newRole);
    
    await prisma.user.update({
      where: { id: userId },
      data: { 
        role: newRole,
        deletedAt: deletedAtValue,
        roleChangedAt: getCentralAmericaTime() // Use Central America Time
      }
    });
  }

  /**
   * Determines the deletedAt value based on user role
   * @param role - User role
   * @returns deletedAt value (null for active users, undefined to keep existing value for deleted users)
   */
  private getDeletedAtValueForRole(role: UserRole): null | undefined {
    // If role is Unassigned, keep deletedAt as is (user is deleted)
    // If role is anything else, set deletedAt to null (user is alive)
    return role === UserRole.Unassigned ? undefined : null;
  }
}
