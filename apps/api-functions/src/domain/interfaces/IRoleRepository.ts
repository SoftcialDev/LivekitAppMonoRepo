/**
 * @file IRoleRepository
 * @description Repository contract for roles.
 */
import { Role } from "../entities/Role";

export interface IRoleRepository {
  /**
   * Finds a role by its identifier.
   * @param id Role identifier.
   */
  findById(id: string): Promise<Role | null>;

  /**
   * Finds a role by its unique name.
   * @param name Role name.
   */
  findByName(name: string): Promise<Role | null>;

  /**
   * Returns all roles (optionally only active).
   * @param onlyActive When true, filters to active roles.
   */
  findAll(onlyActive?: boolean): Promise<Role[]>;
}

