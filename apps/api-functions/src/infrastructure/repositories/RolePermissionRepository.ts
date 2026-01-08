/**
 * @file RolePermissionRepository
 * @description Prisma repository for role-permission relationships.
 */
import prisma from "../database/PrismaClientService";
import { IRolePermissionRepository } from '../../domain/interfaces/IRolePermissionRepository';
import { PermissionEntity } from '../../domain/entities';
import { Permission as PrismaPermission } from '@prisma/client';

export class RolePermissionRepository implements IRolePermissionRepository {
  /**
   * @description Maps a Prisma permission to a domain Permission.
   * @param p Prisma permission.
   */
  private toPermission(p: PrismaPermission): PermissionEntity {
    return new PermissionEntity(
      p.id,
      p.code,
      p.name,
      p.resource,
      p.action,
      p.isActive,
      p.createdAt,
      p.updatedAt,
      p.description ?? undefined
    );
  }

  async findPermissionsByRole(roleId: string, onlyGranted: boolean = true): Promise<PermissionEntity[]> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          where: onlyGranted ? { granted: true } : undefined,
          include: { permission: true },
        },
      },
    });

    if (!role) return [];
    return role.rolePermissions
      .filter((rp) => rp.permission && rp.permission.isActive)
      .map((rp) => this.toPermission(rp.permission));
  }
}

