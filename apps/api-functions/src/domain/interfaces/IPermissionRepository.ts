/**
 * @file IPermissionRepository
 * @description Repository contract for permissions.
 */
import { Permission as PermissionEntity } from "../entities/Permission";

export interface IPermissionRepository {
  /**
   * Finds a permission by its unique code.
   * @param code Permission code.
   */
  findByCode(code: string): Promise<PermissionEntity | null>;

  /**
   * Lists permissions, optionally filtering by active state.
   * @param onlyActive When true, returns only active permissions.
   */
  findAll(onlyActive?: boolean): Promise<PermissionEntity[]>;
}

