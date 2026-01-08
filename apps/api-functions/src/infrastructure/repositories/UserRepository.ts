/**
 * @fileoverview UserRepository - Infrastructure repository for user data access
 * @description Handles all database operations related to users
 */

import prisma from '../database/PrismaClientService';
import { UserRole, ContactManagerStatus } from '@prisma/client';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { User } from '../../domain/entities/User';
import { ContactManagerProfile } from '../../domain/entities/ContactManagerProfile';
import { SuperAdminProfile } from '../../domain/entities/SuperAdminProfile';
import { Role } from '../../domain/entities/Role';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { wrapPsoFetchError } from '../../utils/error/ErrorHelpers';

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
   * Finds a user by database ID
   * @param id - User database ID
   * @returns Promise that resolves to user entity or null
   */
  async findById(id: string): Promise<User | null> {
    const prismaUser = await prisma.user.findUnique({
      where: { id }
    });
    
    return prismaUser ? User.fromPrisma(prismaUser) : null;
  }

  /**
   * Finds all users in the system
   * @returns Promise that resolves to array of users
   */
  async findAllUsers(): Promise<User[]> {
    const prismaUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return prismaUsers.map(user => User.fromPrisma(user));
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
    const prismaUser = await prisma.user.findUnique({
      where: { azureAdObjectId },
      include: {
        userRoleAssignments: {
          where: { isActive: true },
          include: { role: true },
        },
      },
    });

    if (!prismaUser) return false;

    return prismaUser.userRoleAssignments.some(
      (assignment) => assignment.role?.name === role
    );
  }

  /**
   * Checks if a user has any of the specified roles
   * @param azureAdObjectId - Azure AD object ID
   * @param roles - Array of roles to check
   * @returns Promise that resolves to true if user has any of the roles
   */
  async hasAnyRole(azureAdObjectId: string, roles: UserRole[]): Promise<boolean> {
    const prismaUser = await prisma.user.findUnique({
      where: { azureAdObjectId },
      include: {
        userRoleAssignments: {
          where: { isActive: true },
          include: { role: true },
        },
      },
    });

    if (!prismaUser) return false;

    const roleSet = new Set(roles);

    return prismaUser.userRoleAssignments.some(
      (assignment) => assignment.role && roleSet.has(assignment.role.name as UserRole)
    );
  }

  /**
   * Checks if a user is a PSO
   * @param email - User email
   * @returns Promise that resolves to true if user is a PSO
   */
  async isPSO(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user ? user.isPSO() : false;
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
   * Creates a new PSO user
   * @param email - User email
   * @param fullName - User full name
   * @param supervisorId - Supervisor ID (optional)
   * @returns Promise that resolves to created user entity
   */
  async createPSO(email: string, fullName: string, supervisorId: string | null = null): Promise<User> {
    const now = getCentralAmericaTime();
    const prismaUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        fullName,
        role: UserRole.PSO,
        supervisorId,
        azureAdObjectId: '', // Will be updated when user logs in
        createdAt: getCentralAmericaTime(),
        updatedAt: getCentralAmericaTime()
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
        createdAt: getCentralAmericaTime(),
        updatedAt: getCentralAmericaTime()
      }
    });
    return User.fromPrisma(prismaUser);
  }

  /**
   * Finds active users by a specific role (excludes deleted users)
   * @param role - User role to search for
   * @returns Promise that resolves to array of users with id, email, and fullName
   */
  async findActiveUsersByRole(role: UserRole): Promise<Array<{ id: string; email: string; fullName: string }>> {
    const prismaUsers = await prisma.user.findMany({
      where: {
        role,
        deletedAt: null
      },
      select: {
        id: true,
        email: true,
        fullName: true
      }
    });

    return prismaUsers;
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
   * Finds users by roles with supervisor information (returns raw Prisma data)
   * @param roles - Array of user roles
   * @returns Promise that resolves to array of raw Prisma users with supervisor info
   */
  async findByRolesWithSupervisor(roles: UserRole[]): Promise<any[]> {
    return await prisma.user.findMany({
      where: { 
        role: { in: roles }
      },
      include: {
        supervisor: {
          select: { azureAdObjectId: true, fullName: true }
        }
      },
      orderBy: { fullName: 'asc' }
    });
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
   * Finds users with unassigned role with supervisor information (returns raw Prisma data)
   * @returns Promise that resolves to array of raw Prisma users with supervisor info
   */
  async findUsersWithUnassignedRoleWithSupervisor(): Promise<any[]> {
    return await prisma.user.findMany({
      where: { 
        role: UserRole.Unassigned
      },
      include: {
        supervisor: {
          select: { azureAdObjectId: true, fullName: true }
        }
      },
      orderBy: { fullName: 'asc' }
    });
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

  /**
   * Creates a user with ContactManager role
   * @param userData - User data to create
   * @returns Promise that resolves to the created User entity
   */
  async createContactManager(userData: {
    azureAdObjectId: string;
    email: string;
    fullName: string;
  }): Promise<User> {
    const now = getCentralAmericaTime();
    
    const prismaUser = await prisma.user.create({
      data: {
        azureAdObjectId: userData.azureAdObjectId,
        email: userData.email.toLowerCase(),
        fullName: userData.fullName,
        role: UserRole.ContactManager,
        roleChangedAt: now,
        createdAt: getCentralAmericaTime(),
        updatedAt: getCentralAmericaTime()
      }
    });

    return User.fromPrisma(prismaUser);
  }

  /**
   * Creates a contact manager profile
   * @param userId - The user ID
   * @param status - The initial status
   * @returns Promise that resolves to the created ContactManagerProfile entity
   */
  async createContactManagerProfile(userId: string, status: ContactManagerStatus): Promise<ContactManagerProfile> {
    const now = getCentralAmericaTime();
    
    const prismaProfile = await prisma.contactManagerProfile.create({
      data: {
        userId,
        status,
        createdAt: getCentralAmericaTime(),
        updatedAt: getCentralAmericaTime()
      }
    });

    return ContactManagerProfile.fromPrisma(prismaProfile);
  }

  /**
   * Creates a contact manager status history entry
   * @param data - Status history data
   * @returns Promise that resolves when history is created
   */
  async createContactManagerStatusHistory(data: {
    profileId: string;
    previousStatus: ContactManagerStatus;
    newStatus: ContactManagerStatus;
    changedById: string;
  }): Promise<void> {
    await prisma.contactManagerStatusHistory.create({
      data: {
        profileId: data.profileId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        changedById: data.changedById,
        timestamp: getCentralAmericaTime()
      }
    });
  }

  /**
   * Creates a new Super Admin user
   * @param userData - Super Admin user data
   * @returns Promise that resolves to the created user
   */
  async createSuperAdmin(userData: {
    azureAdObjectId: string;
    email: string;
    fullName: string;
  }): Promise<User> {
    const now = getCentralAmericaTime();
    
    const prismaUser = await prisma.user.create({
      data: {
        azureAdObjectId: userData.azureAdObjectId,
        email: userData.email.toLowerCase(),
        fullName: userData.fullName,
        role: UserRole.SuperAdmin,
        roleChangedAt: now,
        createdAt: getCentralAmericaTime(),
        updatedAt: getCentralAmericaTime()
      }
    });

    return User.fromPrisma(prismaUser);
  }


  /**
   * Creates a Super Admin audit log entry using the general AuditLog table
   * @param data - Audit log data
   * @returns Promise that resolves when log is created
   */
  async createSuperAdminAuditLog(data: {
    profileId: string;
    action: string;
    changedById: string;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        entity: 'SuperAdmin',
        entityId: data.profileId,
        action: data.action,
        changedById: data.changedById,
        timestamp: getCentralAmericaTime()
      }
    });
  }

  /**
   * Finds a Contact Manager profile by ID
   * @param profileId - Profile ID
   * @returns Promise that resolves to the profile or null
   */
  async findContactManagerProfile(profileId: string): Promise<ContactManagerProfile | null> {
    const prismaProfile = await prisma.contactManagerProfile.findUnique({
      where: { id: profileId },
      include: { user: true }
    });

    return prismaProfile ? ContactManagerProfile.fromPrisma(prismaProfile) : null;
  }

  /**
   * Deletes a Contact Manager profile
   * @param profileId - Profile ID
   * @returns Promise that resolves when profile is deleted
   */
  async deleteContactManagerProfile(profileId: string): Promise<void> {
    await prisma.contactManagerProfile.delete({
      where: { id: profileId }
    });
  }

  /**
   * Creates a Contact Manager audit log entry using the general AuditLog table
   * @param data - Audit log data
   * @returns Promise that resolves when log is created
   */
  async createContactManagerAuditLog(data: {
    profileId: string;
    action: string;
    changedById: string;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        entity: 'ContactManager',
        entityId: data.profileId,
        action: data.action,
        changedById: data.changedById,
        timestamp: getCentralAmericaTime()
      }
    });
  }

  /**
   * Finds all Contact Manager profiles with their associated users
   * @returns Promise that resolves to array of ContactManagerProfile entities
   */
  async findAllContactManagers(): Promise<ContactManagerProfile[]> {
    const prismaProfiles = await prisma.contactManagerProfile.findMany({
      include: { 
        user: { 
          select: { 
            email: true, 
            fullName: true 
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    return prismaProfiles.map(profile => ContactManagerProfile.fromPrisma(profile));
  }

  /**
   * Finds a Contact Manager profile by user ID
   * @param userId - User ID
   * @returns Promise that resolves to the profile or null
   */
  async findContactManagerProfileByUserId(userId: string): Promise<ContactManagerProfile | null> {
    const prismaProfile = await prisma.contactManagerProfile.findUnique({
      where: { userId },
      include: { 
        user: { 
          select: { 
            email: true, 
            fullName: true 
          } 
        } 
      }
    });

    return prismaProfile ? ContactManagerProfile.fromPrisma(prismaProfile) : null;
  }

  /**
   * Finds all Super Admin profiles with their associated users
   * @returns Promise that resolves to array of SuperAdminProfile entities
   */
  async findAllSuperAdmins(): Promise<SuperAdminProfile[]> {
    const prismaUsers = await prisma.user.findMany({
      where: { role: UserRole.SuperAdmin },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return prismaUsers.map(user => new SuperAdminProfile(
      user.id, // Use actual user ID, not prefixed
      user.id,
      user.createdAt,
      user.updatedAt,
      { email: user.email, fullName: user.fullName, role: user.role }
    ));
  }

  /**
   * Updates a Contact Manager's status
   * @param profileId - Profile ID
   * @param status - New status
   * @returns Promise that resolves when status is updated
   */
  async updateContactManagerStatus(profileId: string, status: ContactManagerStatus): Promise<void> {
    await prisma.contactManagerProfile.update({
      where: { id: profileId },
      data: { 
        status,
        updatedAt: getCentralAmericaTime()
      }
    });
  }

  /**
   * Gets PSOs by supervisor with their supervisor information
   * @param supervisorId - Optional supervisor ID to filter PSOs
   * @returns Promise that resolves to array of PSOs with supervisor information
   */
  async getPsosBySupervisor(supervisorId?: string): Promise<Array<{ email: string; supervisorName: string }>> {
    try {
      let supervisor: { id: string; email: string; fullName: string | null; role: string; azureAdObjectId: string } | null = null;
      
      // First, check if supervisor exists
      if (supervisorId) {
        // Try to find by azureAdObjectId first, then by id
        supervisor = await prisma.user.findUnique({
          where: { azureAdObjectId: supervisorId },
          select: { id: true, email: true, fullName: true, role: true, azureAdObjectId: true }
        });
        
        // If not found by azureAdObjectId, try by id
        if (!supervisor) {
          supervisor = await prisma.user.findUnique({
            where: { id: supervisorId },
            select: { id: true, email: true, fullName: true, role: true, azureAdObjectId: true }
          });
        }
        
        if (!supervisor) {
          return [];
        }
        
        if (supervisor.role !== "Supervisor") {
          return [];
        }
      }

      const baseWhere: Record<string, any> = {
        role: "PSO",
        deletedAt: null,
      };

      if (supervisorId && supervisor) {
        // Use the internal ID of the supervisor for the query
        baseWhere.supervisorId = supervisor.id;
      }

      const psos = await prisma.user.findMany({
        where: baseWhere,
        select: {
          email: true,
          supervisor: {
            select: { fullName: true }
          }
        }
      });

      return psos.map(pso => ({
        email: pso.email.toLowerCase(),
        supervisorName: pso.supervisor?.fullName || ""
      }));
    } catch (error: unknown) {
      throw wrapPsoFetchError('Failed to get PSOs by supervisor', error);
    }
  }

  /**
   * @description Returns active roles for a user by Azure AD object id.
   * @param azureAdObjectId Azure AD object id.
   */
  async getActiveRolesByAzureId(azureAdObjectId: string): Promise<Role[]> {
    const user = await prisma.user.findUnique({
      where: { azureAdObjectId },
      select: {
        id: true,
        role: true,
        userRoleAssignments: {
          where: { isActive: true },
          include: { role: true },
        },
      },
    });

    if (!user) return [];

    const roles: Role[] = [];

    // RBAC roles (assignments)
    for (const assignment of user.userRoleAssignments) {
      if (assignment.role) {
        roles.push(
          new Role(
            assignment.role.id,
            assignment.role.name,
            assignment.role.isSystem,
            assignment.role.isActive,
            assignment.role.createdAt,
            assignment.role.updatedAt,
            assignment.role.displayName ?? undefined,
            assignment.role.description ?? undefined,
            []
          )
        );
      }
    }

    return roles;
  }

  /**
   * @description Returns effective permission codes for a user (union of active roles).
   * @param azureAdObjectId Azure AD object id.
   */
  async getEffectivePermissionCodesByAzureId(azureAdObjectId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { azureAdObjectId },
      select: {
        role: true,
        userRoleAssignments: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                rolePermissions: {
                  where: { granted: true },
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return [];

    const codes = new Set<string>();

    // Permissions from explicit role assignments 
    for (const assignment of user.userRoleAssignments) {
      const rp = assignment.role?.rolePermissions || [];
      for (const link of rp) {
        if (link.permission && link.permission.isActive) {
          codes.add(link.permission.code);
        }
      }
    }

    // Fallback: permissions from the legacy single-role enum on the user record.
    if (user.role) {
      const role = await prisma.role.findUnique({
        where: { name: user.role },
        include: {
          rolePermissions: {
            where: { granted: true },
            include: { permission: true },
          },
        },
      });

      const rp = role?.rolePermissions || [];
      for (const link of rp) {
        if (link.permission && link.permission.isActive) {
          codes.add(link.permission.code);
        }
      }
    }

    return Array.from(codes);
  }
}
