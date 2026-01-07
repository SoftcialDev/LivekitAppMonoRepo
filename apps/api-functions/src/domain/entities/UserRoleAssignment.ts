/**
 * @file UserRoleAssignment entity
 * @description Represents an assignment of a role to a user.
 */
import { MissingRequiredFieldsError } from "../errors/EntityValidationErrors";
export class UserRoleAssignment {
  /**
   * @description Creates a UserRoleAssignment entity.
   * @param id Identifier.
   * @param userId User identifier.
   * @param roleId Role identifier.
   * @param assignedAt Assignment timestamp.
   * @param isActive Active flag.
   * @param createdAt Creation timestamp.
   * @param updatedAt Update timestamp.
   * @param assignedBy Optional assigner identifier.
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly roleId: string,
    public readonly assignedAt: Date,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly assignedBy?: string
  ) {
    if (!userId || !roleId) {
      throw new MissingRequiredFieldsError("UserRoleAssignment requires userId and roleId");
    }
  }
}

