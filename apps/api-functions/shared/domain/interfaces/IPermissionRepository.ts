/**
 * @file IPermissionRepository
 * @description Repository contract for permissions.
 */
import { Permission } from "../entities/Permission";

export interface IPermissionRepository {
  /**
   * Finds a permission by its unique code.
   * @param code Permission code.
   */
  findByCode(code: string): Promise<Permission | null>;

  /**
   * Lists permissions, optionally filtering by active state.
   * @param onlyActive When true, returns only active permissions.
   */
  findAll(onlyActive?: boolean): Promise<Permission[]>;
}

