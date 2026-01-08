/**
 * @file UserRoleAssignmentRepository
 * @description Prisma repository for user-role assignments.
 */
import prisma from "../database/PrismaClientService";
import { IUserRoleAssignmentRepository } from '../../domain/interfaces/IUserRoleAssignmentRepository';
import { Role } from '../../domain/entities/Role';

export class UserRoleAssignmentRepository implements IUserRoleAssignmentRepository {
  /**
   * @description Maps a Prisma role to a domain Role.
   * @param r Prisma role.
   */
  private toRole(r: any): Role {
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
}

