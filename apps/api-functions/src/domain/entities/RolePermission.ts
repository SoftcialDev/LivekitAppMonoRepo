/**
 * @file RolePermission entity
 * @description Represents the link between a role and a permission.
 */
import { MissingRequiredFieldsError } from "../errors/EntityValidationErrors";
export class RolePermission {
  /**
   * @description Creates a RolePermission entity.
   * @param id Identifier.
   * @param roleId Role identifier.
   * @param permissionId Permission identifier.
   * @param granted Whether the permission is granted.
   * @param createdAt Creation timestamp.
   * @param updatedAt Update timestamp.
   */
  constructor(
    public readonly id: string,
    public readonly roleId: string,
    public readonly permissionId: string,
    public readonly granted: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    if (!roleId || !permissionId) {
      throw new MissingRequiredFieldsError("RolePermission requires roleId and permissionId");
    }
  }
}

