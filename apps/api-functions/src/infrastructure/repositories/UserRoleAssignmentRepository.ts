/**
 * @file UserRoleAssignmentRepository
 * @description Prisma repository for user-role assignments.
 */
import prisma from "../database/PrismaClientService";
import { IUserRoleAssignmentRepository } from '../../domain/interfaces/IUserRoleAssignmentRepository';
import { RoleAssignmentData } from '../../domain/types/UserDebugTypes';
import { Role } from '../../domain/entities/Role';
import { wrapDatabaseQueryError } from '../../utils/error/ErrorHelpers';
import { Role as PrismaRole } from '@prisma/client';
import { EntityNotFoundError } from '../../domain/errors/RepositoryErrors';

export class UserRoleAssignmentRepository implements IUserRoleAssignmentRepository {
  /**
   * @description Maps a Prisma role to a domain Role.
   * @param r Prisma role.
   */
  private toRole(r: PrismaRole): Role {
    return new Role(
      r.id,
      r.name,
      r.isSystem,
      r.isActive,
      r.createdAt,
      r.updatedAt,
      r.displayName ?? undefined,
      r.description ?? undefined,
      []
    );
  }

  async findActiveRolesByUserId(userId: string): Promise<Role[]> {
    const assignments = await prisma.userRoleAssignment.findMany({
      where: { userId, isActive: true },
      include: { role: true },
    });

    return assignments
      .filter((a) => a.role)
      .map((a) => this.toRole(a.role));
  }

  async findActiveRoleAssignmentsByUserId(userId: string): Promise<RoleAssignmentData[]> {
    try {
      const assignments = await prisma.userRoleAssignment.findMany({
        where: { userId, isActive: true },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
              isSystem: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
              description: true
            }
          }
        },
        orderBy: { assignedAt: 'asc' }
      });

      return assignments
        .filter((a) => a.role !== null)
        .map((a) => {
          if (!a.role) {
            throw new EntityNotFoundError('Role not found in assignment');
          }
          return {
            roleId: a.role.id,
            role: this.toRole(a.role),
            assignedAt: a.assignedAt
          };
        });
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to get role assignments', error);
    }
  }
}

