/**
 * @file IUserRoleAssignmentRepository
 * @description Repository contract for user-role assignments.
 */
import { Role } from "../entities/Role";
import { RoleAssignmentData } from "../types/UserDebugTypes";

export interface IUserRoleAssignmentRepository {
  /**
   * Gets active roles for a user.
   * @param userId User identifier.
   */
  findActiveRolesByUserId(userId: string): Promise<Role[]>;

  /**
   * Gets active role assignments with metadata for a user.
   * @param userId User identifier.
   * @returns Promise that resolves to array of role assignment data with role and assignedAt
   */
  findActiveRoleAssignmentsByUserId(userId: string): Promise<RoleAssignmentData[]>;
}

