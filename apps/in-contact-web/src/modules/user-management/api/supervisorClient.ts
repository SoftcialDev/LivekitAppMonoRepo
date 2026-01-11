/**
 * @fileoverview Supervisor API client
 * @summary CRUD client for Supervisor endpoints
 * @description Provides functions for managing Supervisors: transferring PSOs and changing supervisor assignments
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import type {
  ChangeSupervisorRequest,
} from '../types';

/**
 * Transfers all PSOs currently assigned to the logged-in supervisor to another supervisor
 *
 * Calls POST `/api/TransferPsos` with body `{ newSupervisorEmail }`.
 * This is a Supervisor-only action that transfers ALL their PSOs.
 *
 * @param newSupervisorEmail - Email of the supervisor who should receive the PSOs
 * @returns Promise resolving to the number of PSOs transferred
 * @throws {ApiError} if the request fails
 *
 * @example
 * ```typescript
 * const count = await transferPsos('newsupervisor@example.com');
 * ```
 */
export async function transferPsos(
  newSupervisorEmail: string
): Promise<number> {
  try {
    const response = await apiClient.post<{ transferredCount: number }>(
      '/api/TransferPsos',
      { newSupervisorEmail }
    );
    return response.data.transferredCount;
  } catch (error) {
    throw handleApiError(
      'transfer PSOs',
      error,
      'Failed to transfer PSOs',
      { newSupervisorEmail }
    );
  }
}

/**
 * Changes supervisor assignment for multiple PSOs
 *
 * Calls POST `/api/ChangeSupervisor` with body `{ userEmails, newSupervisorEmail }`.
 * Used for batch transfers in PSO page.
 *
 * @param payload - Request payload with user emails and new supervisor email
 * @returns Promise resolving to the number of records updated
 * @throws {ApiError} if the request fails
 *
 * @example
 * ```typescript
 * const count = await changeSupervisor({ userEmails: ['pso1@example.com'], newSupervisorEmail: 'supervisor@example.com' });
 * ```
 */
export async function changeSupervisor(
  payload: ChangeSupervisorRequest
): Promise<number> {
  try {
    const response = await apiClient.post<{ updatedCount: number }>(
      '/api/ChangeSupervisor',
      payload
    );
    return response.data.updatedCount;
  } catch (error) {
    throw handleApiError(
      'change supervisor',
      error,
      'Failed to change supervisor',
      { payload }
    );
  }
}

