/**
 * @file IUserRoleAssignmentRepository
 * @description Repository contract for user-role assignments.
 */
import { Role } from "../entities/Role";

export interface IUserRoleAssignmentRepository {
  /**
   * Gets active roles for a user.
   * @param userId User identifier.
   */
  findActiveRolesByUserId(userId: string): Promise<Role[]>;
}

