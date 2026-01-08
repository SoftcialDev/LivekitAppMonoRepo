/**
 * @file RoleRepository
 * @description Prisma repository for roles.
 */
import prisma from "../database/PrismaClientService";
import { IRoleRepository } from '../../domain/interfaces/IRoleRepository';
import { Role } from '../../domain/entities/Role';
import { Role as PrismaRole } from '@prisma/client';

export class RoleRepository implements IRoleRepository {
  /**
   * @description Maps a Prisma role to a domain Role.
   * @param r - Prisma role.
   * @returns Role domain entity.
   */
  private toDomain(r: PrismaRole): Role {
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

  async findById(id: string): Promise<Role | null> {
    const role = await prisma.role.findUnique({ where: { id } });
    return role ? this.toDomain(role) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const role = await prisma.role.findUnique({ where: { name } });
    return role ? this.toDomain(role) : null;
  }

  async findAll(onlyActive: boolean = false): Promise<Role[]> {
    const roles = await prisma.role.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { name: "asc" },
    });
    return roles.map((r) => this.toDomain(r));
  }
}

