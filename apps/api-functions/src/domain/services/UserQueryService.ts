/**
 * @fileoverview UserQueryService - Domain service for user queries
 * @description Handles user query operations using database only
 */

import { UserRole } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IUserQueryService } from '../interfaces/IUserQueryService';
import { UserQueryRequest } from '../value-objects/UserQueryRequest';
import { UserQueryResult } from '../value-objects/UserQueryResult';
import { UserSummary } from '../entities/UserSummary';

/**
 * Domain service for user query operations
 */
export class UserQueryService implements IUserQueryService {
  constructor(private userRepository: IUserRepository) {}

  /**
   * Finds users by roles with pagination
   * @param request - User query request
   * @returns Promise that resolves to user query result
   */
  async findUsersByRoles(request: UserQueryRequest): Promise<UserQueryResult> {
    const users: UserSummary[] = [];

    // 1. Find users with specific roles from database
    if (request.getPrismaRoles().length > 0) {
      const dbUsers = await this.userRepository.findByRolesWithSupervisor(request.getPrismaRoles());
      users.push(...dbUsers.map((user: any) => UserSummary.fromPrismaUser(user)));
    }

    // 2. Find users with unassigned role if requested
    if (request.hasNullRole()) {
      const unassignedUsers = await this.userRepository.findUsersWithUnassignedRoleWithSupervisor();
      users.push(...unassignedUsers.map((user: any) => UserSummary.fromPrismaUser(user)));
    }

    // 3. Remove duplicates based on azureAdObjectId
    const uniqueUsers = users.reduce((acc, user) => {
      if (!acc.find(u => u.azureAdObjectId === user.azureAdObjectId)) {
        acc.push(user);
      }
      return acc;
    }, [] as UserSummary[]);

    // 4. Apply pagination
    const total = uniqueUsers.length;
    const startIndex = (request.page - 1) * request.pageSize;
    const paginatedUsers = uniqueUsers.slice(startIndex, startIndex + request.pageSize);

    return UserQueryResult.create(total, request.page, request.pageSize, paginatedUsers);
  }
}
