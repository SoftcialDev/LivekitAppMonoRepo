/**
 * @fileoverview Super Admin API client
 * @summary CRUD client for Super Admin user management endpoints
 * @description Provides functions for managing Super Admin users: fetching, creating, and deleting
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import type {
  SuperAdminDto,
  BackendSuperAdminDto,
  ListSuperAdminsResponse,
  CreateSuperAdminRequest,
  CreateSuperAdminResponse,
} from '../types';
import { BackendUserRole, mapBackendSuperAdminDto } from '../types';

/**
 * Fetches Super Admin users with pagination support
 *
 * @param limit - Number of items to fetch (ignored, API returns all)
 * @param offset - Starting offset (ignored, API returns all)
 * @returns Promise resolving to an array of SuperAdminDto with role as "Super Admin"
 * @throws {ApiError} if the request fails
 *
 * @example
 * ```typescript
 * const items = await getSuperAdmins(100, 0);
 * ```
 */
export async function getSuperAdmins(
  limit?: number,
  offset?: number
): Promise<{ items: SuperAdminDto[]; totalCount: number }> {
  try {
    // Backend returns raw DTOs with string role values that match BackendUserRole enum
    // Note: API currently returns all items, pagination is handled client-side
    const response = await apiClient.get<ListSuperAdminsResponse>('/api/superAdmins');
    const list = Array.isArray(response.data?.superAdmins)
      ? response.data.superAdmins
      : [];
    const totalCount = response.data?.totalCount ?? list.length;
    
    // Map and validate: ensure role values match enum, with type assertion
    const items = list.map((dto) =>
      mapBackendSuperAdminDto({
        ...dto,
        role: dto.role as BackendUserRole, // Type assertion: backend returns valid enum values
      })
    );

    // Client-side pagination: apply limit and offset if provided
    if (limit !== undefined && offset !== undefined) {
      const paginatedItems = items.slice(offset, offset + limit);
      return { items: paginatedItems, totalCount };
    }

    return { items, totalCount };
  } catch (error) {
    throw handleApiError(
      'fetch super admins',
      error,
      'Failed to fetch super admins'
    );
  }
}

/**
 * Promotes a user to Super Admin by email
 *
 * @param email - Target user's email (case-insensitive)
 * @returns Promise resolving to the created/updated user's internal ID
 * @throws {ApiError} if the request fails
 *
 * @example
 * ```typescript
 * const id = await createSuperAdmin('user@example.com');
 * ```
 */
export async function createSuperAdmin(email: string): Promise<string> {
  try {
    const payload: CreateSuperAdminRequest = { email };
    const response = await apiClient.post<CreateSuperAdminResponse>(
      '/api/superAdmins',
      payload
    );
    return response.data.id;
  } catch (error) {
    throw handleApiError(
      'create super admin',
      error,
      'Failed to create super admin',
      { email }
    );
  }
}

/**
 * Revokes Super Admin privileges for the given user ID (server demotes role)
 *
 * @param id - Internal user ID to revoke
 * @returns Promise that resolves when the operation completes
 * @throws {ApiError} if the request fails
 *
 * @example
 * ```typescript
 * await deleteSuperAdmin('a1b2c3d4-...');
 * ```
 */
export async function deleteSuperAdmin(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/superAdmins/${encodeURIComponent(id)}`);
  } catch (error) {
    throw handleApiError(
      'delete super admin',
      error,
      'Failed to delete super admin',
      { id }
    );
  }
}

