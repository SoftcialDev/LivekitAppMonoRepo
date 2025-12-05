/**
 * @file PermissionRepository
 * @description Prisma repository for permissions.
 */
import prisma from "../database/PrismaClientService";
import { IPermissionRepository } from "../../domain/interfaces/IPermissionRepository";
import { Permission } from "../../domain/entities/Permission";

export class PermissionRepository implements IPermissionRepository {
  /**
   * @description Maps a Prisma permission to a domain Permission.
   * @param p Prisma permission.
   */
  private toDomain(p: any): Permission {
    return new Permission(
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

  async findByCode(code: string): Promise<Permission | null> {
    const perm = await prisma.permission.findUnique({ where: { code } });
    return perm ? this.toDomain(perm) : null;
  }

  async findAll(onlyActive: boolean = false): Promise<Permission[]> {
    const perms = await prisma.permission.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });
    return perms.map((p) => this.toDomain(p));
  }
}

