/**
 * @fileoverview createRoleBasedClient Factory Function
 * @summary Factory function for creating role-based API clients
 * @description Creates API client configuration for user management pages based on roles
 */

import { getUsersByRole, changeUserRole, deleteUser } from '../adminClient';
import type {
  BaseUserManagementItem,
  UserManagementApiConfig,
} from '../../types';
import type { RoleBasedClientConfig } from './types';

/**
 * Creates a role-based API client configuration
 *
 * Factory function that generates API client configuration for user management
 * pages that use getUsersByRole, changeUserRole, and deleteUser endpoints.
 * This eliminates duplication for Admin, Supervisor, PSO, and ContactManager pages.
 *
 * @template T - Type of items being managed (must extend BaseUserManagementItem)
 * @param config - Configuration for the role-based client
 * @returns UserManagementApiConfig configured for the specified role
 *
 * @example
 * ```typescript
 * const adminConfig = createRoleBasedClient<UserByRole>({
 *   mainRole: 'Admin',
 *   candidateRoles: 'Supervisor,PSO,Unassigned',
 *   newRole: 'Admin',
 *   deleteReason: 'Admin role removed'
 * });
 * ```
 */
export function createRoleBasedClient<T extends BaseUserManagementItem>(
  config: RoleBasedClientConfig
): UserManagementApiConfig<T> {
  const { mainRole, candidateRoles, newRole, deleteReason } = config;

  return {
    fetchTotalCount: async () => {
      // Fetch first page with pageSize=1 to get totalCount
      const response = await getUsersByRole(mainRole, 1, 1);
      return response.total;
    },
    onFetch: async (limit: number, offset: number) => {
      // Convert limit/offset to page/pageSize (API uses 1-based page numbers)
      const page = Math.floor(offset / limit) + 1;
      const pageSize = limit;
      const response = await getUsersByRole(mainRole, page, pageSize);
      return response.users.map((user) => ({
        ...user,
        id: user.azureAdObjectId || user.email,
      })) as T[];
    },
    fetchCandidates: async () => {
      const response = await getUsersByRole(candidateRoles, 1, 1000);
      return response.users.map((user) => ({
        ...user,
        id: user.azureAdObjectId || user.email,
      }));
    },
    addItems: async (emails: string[]) => {
      await Promise.all(
        emails.map((email) =>
          changeUserRole({ userEmail: email, newRole })
        )
      );
    },
    removeItem: async (item: T) => {
      await deleteUser({
        userEmail: item.email,
        reason: deleteReason,
      });
    },
  };
}

