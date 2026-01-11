/**
 * @fileoverview Admin API client
 * @summary CRUD client for Admin user management endpoints
 * @description Provides functions for managing Admin users: fetching, adding, and removing
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import type {
  UserByRole,
  UserRoleParam,
  PagedResponse,
  ChangeUserRoleRequest,
  DeleteUserRequest,
} from '../types';

/**
 * Fetches users by role with pagination
 *
 * @param role - Role filter (can be single role or comma-separated list)
 * @param page - Page number (1-based)
 * @param pageSize - Number of items per page
 * @returns Promise resolving to paged response with users
 * @throws {ApiError} if the request fails
 *
 * @example
 * ```typescript
 * const response = await getUsersByRole('Admin', 1, 100);
 * ```
 */
export async function getUsersByRole(
  role: UserRoleParam,
  page: number = 1,
  pageSize: number = 1000
): Promise<PagedResponse<UserByRole>> {
  try {
    const response = await apiClient.get<PagedResponse<UserByRole>>(
      '/api/GetUsersByRole',
      {
        params: {
          role,
          page,
          pageSize,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(
      'fetch users by role',
      error,
      'Failed to fetch users by role',
      { role, page, pageSize }
    );
  }
}

/**
 * Changes a user's role
 *
 * @param payload - Request payload with user email and new role
 * @returns Promise that resolves when the operation completes
 * @throws {ApiError} if the request fails
 *
 * @example
 * ```typescript
 * await changeUserRole({ userEmail: 'user@example.com', newRole: 'Admin' });
 * ```
 */
export async function changeUserRole(
  payload: ChangeUserRoleRequest
): Promise<void> {
  try {
    await apiClient.post('/api/ChangeUserRole', payload);
  } catch (error) {
    throw handleApiError(
      'change user role',
      error,
      'Failed to change user role',
      { payload }
    );
  }
}

/**
 * Deletes a user (removes role)
 *
 * @param payload - Request payload with user email and reason
 * @returns Promise that resolves when the operation completes
 * @throws {ApiError} if the request fails
 *
 * @example
 * ```typescript
 * await deleteUser({ userEmail: 'user@example.com', reason: 'Role removed' });
 * ```
 */
export async function deleteUser(payload: DeleteUserRequest): Promise<void> {
  try {
    await apiClient.post('/api/DeleteUser', payload);
  } catch (error) {
    throw handleApiError(
      'delete user',
      error,
      'Failed to delete user',
      { payload }
    );
  }
}

