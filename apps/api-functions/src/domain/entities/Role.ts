/**
 * @file Role entity
 * @description Represents a role that can aggregate permissions.
 */
import { Permission as PermissionEntity } from "./Permission";
import { MissingRequiredFieldsError } from "../errors/EntityValidationErrors";

export class Role {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly isSystem: boolean,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly displayName?: string,
    public readonly description?: string,
    public permissions: PermissionEntity[] = []
  ) {
    if (!name) {
      throw new MissingRequiredFieldsError("Role name is required");
    }
  }

  /**
   * @description Adds a permission to the role if not already present.
   * @param permission Permission to add.
   */
  addPermission(permission: PermissionEntity): void {
    if (this.permissions.find((p) => p.id === permission.id)) {
      return;
    }
    this.permissions.push(permission);
  }

  /**
   * @description Removes a permission from the role if present.
   * @param permissionId Permission identifier to remove.
   */
  removePermission(permissionId: string): void {
    this.permissions = this.permissions.filter((p) => p.id !== permissionId);
  }
}

