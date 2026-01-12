/**
 * @file Permission entity
 * @description Represents an application permission (resource:action).
 */
import { InvalidPermissionCodeError } from "../errors/EntityValidationErrors";
export class Permission {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly description?: string
  ) {
    Permission.validateCode(code);
  }

  /**
   * @description Validates that a permission code follows the resource:action convention.
   * @param code Permission code to validate.
   * @returns void
   */
  static validateCode(code: string): void {
    if (!code?.includes(":")) {
      throw new InvalidPermissionCodeError(`Invalid permission code: ${code}`);
    }
  }
}

