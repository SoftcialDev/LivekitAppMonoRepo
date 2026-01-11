/**
 * @fileoverview Contact Manager Dashboard API client
 * @summary API functions for Contact Manager Dashboard
 * @description Provides API functions for fetching and updating current user's Contact Manager status
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import type { ManagerStatus } from '../enums';
import type {
  ContactManagerStatusResponse,
  UpdateContactManagerStatusRequest,
} from '../types';

/**
 * Fetches the current user's Contact Manager status
 *
 * @returns Promise resolving to the Contact Manager profile with status
 * @throws {ApiError} If the API request fails
 *
 * @example
 * ```typescript
 * const status = await getMyContactManagerStatus();
 * console.log(status.status); // 'Available', 'Unavailable', etc.
 * ```
 */
export async function getMyContactManagerStatus(): Promise<ContactManagerStatusResponse> {
  try {
    const response = await apiClient.get<ContactManagerStatusResponse>(
      '/api/contact-managers/me/status'
    );
    return response.data;
  } catch (error) {
    throw handleApiError(
      'fetch Contact Manager status',
      error,
      'Failed to fetch your Contact Manager status'
    );
  }
}

/**
 * Updates the current user's Contact Manager status
 *
 * @param status - New status to set
 * @returns Promise resolving to the updated Contact Manager profile with status
 * @throws {ApiError} If the API request fails
 *
 * @example
 * ```typescript
 * const updated = await updateMyContactManagerStatus(ManagerStatus.Available);
 * console.log(updated.status); // 'Available'
 * ```
 */
export async function updateMyContactManagerStatus(
  status: ManagerStatus
): Promise<ContactManagerStatusResponse> {
  try {
    const payload: UpdateContactManagerStatusRequest = { status };
    const response = await apiClient.post<ContactManagerStatusResponse>(
      '/api/contact-managers/me/status',
      payload
    );
    return response.data;
  } catch (error) {
    throw handleApiError(
      'update Contact Manager status',
      error,
      'Failed to update your Contact Manager status',
      { status }
    );
  }
}

