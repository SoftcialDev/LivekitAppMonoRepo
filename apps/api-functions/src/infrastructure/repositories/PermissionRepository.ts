/**
 * @file PermissionRepository
 * @description Prisma repository for permissions.
 */
import prisma from "../database/PrismaClientService";
import { IPermissionRepository, PermissionEntity } from '../../index';

export class PermissionRepository implements IPermissionRepository {
  /**
   * @description Maps a Prisma permission to a domain Permission.
   * @param p Prisma permission.
   */
  private toDomain(p: any): PermissionEntity {
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

  async findByCode(code: string): Promise<PermissionEntity | null> {
    const perm = await prisma.permission.findUnique({ where: { code } });
    return perm ? this.toDomain(perm) : null;
  }

  async findAll(onlyActive: boolean = false): Promise<PermissionEntity[]> {
    const perms = await prisma.permission.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });
    return perms.map((p: any) => this.toDomain(p));
  }
}

