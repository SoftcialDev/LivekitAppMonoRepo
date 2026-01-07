/**
 * @file IRolePermissionRepository
 * @description Repository contract for role-permission relationships.
 */
import { Permission as PermissionEntity } from "../entities/Permission";

export interface IRolePermissionRepository {
  /**
   * Lists permissions for a given role.
   * @param roleId Role identifier.
   */
  findPermissionsByRole(roleId: string, onlyGranted?: boolean): Promise<PermissionEntity[]>;
}

