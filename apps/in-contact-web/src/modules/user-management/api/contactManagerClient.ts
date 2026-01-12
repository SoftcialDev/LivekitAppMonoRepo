/**
 * @fileoverview Contact Manager API client
 * @summary CRUD client for Contact Manager endpoints
 * @description Provides functions for managing Contact Managers: fetching, creating, and deleting
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import type {
  ContactManagerDto,
  ListContactManagersResponse,
  CreateContactManagerRequest,
} from '../types';

/**
 * Fetches all Contact Manager profiles with pagination support
 *
 * @param limit - Number of items to fetch (ignored, API returns all)
 * @param offset - Starting offset (ignored, API returns all)
 * @returns Promise resolving to items and totalCount
 * @throws {ApiError} if the request fails
 *
 * @example
 * ```typescript
 * const result = await getContactManagers(100, 0);
 * ```
 */
export async function getContactManagers(
  limit?: number,
  offset?: number
): Promise<{ items: ContactManagerDto[]; totalCount: number }> {
  try {
    const response = await apiClient.get<ListContactManagersResponse>('/api/contactManagers');
    const list = Array.isArray(response.data?.contactManagers)
      ? response.data.contactManagers
      : [];
    const totalCount = list.length; // API doesn't return totalCount, use length
    
    // Map DTOs to include id field
    const items = list.map((dto: ContactManagerDto) => ({
      ...dto,
      id: dto.id,
    }));

    // Client-side pagination: apply limit and offset if provided
    if (limit !== undefined && offset !== undefined) {
      const paginatedItems = items.slice(offset, offset + limit);
      return { items: paginatedItems, totalCount };
    }

    return { items, totalCount };
  } catch (error) {
    throw handleApiError(
      'fetch contact managers',
      error,
      'Failed to fetch contact managers'
    );
  }
}

/**
 * Creates or updates a Contact Manager profile
 *
 * @param payload - Request payload with email and status
 * @returns Promise resolving to the created/updated Contact Manager profile
 * @throws {ApiError} if the request fails
 *
 * @example
 * ```typescript
 * const profile = await upsertContactManager({ email: 'user@example.com', status: 'Available' });
 * ```
 */
export async function upsertContactManager(
  payload: CreateContactManagerRequest
): Promise<ContactManagerDto> {
  try {
    const response = await apiClient.post<ContactManagerDto>(
      '/api/contactManagers',
      payload
    );
    return response.data;
  } catch (error) {
    throw handleApiError(
      'create contact manager',
      error,
      'Failed to create contact manager',
      { email: payload.email }
    );
  }
}

/**
 * Revokes Contact Manager privileges (deletes profile)
 *
 * @param id - Profile ID to revoke
 * @returns Promise that resolves when the operation completes
 * @throws {ApiError} if the request fails
 *
 * @example
 * ```typescript
 * await revokeContactManager('a1b2c3d4-...');
 * ```
 */
export async function revokeContactManager(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/contactManagers/${encodeURIComponent(id)}`);
  } catch (error) {
    throw handleApiError(
      'delete contact manager',
      error,
      'Failed to delete contact manager',
      { id }
    );
  }
}

