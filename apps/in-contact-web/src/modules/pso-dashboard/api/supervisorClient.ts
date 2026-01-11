/**
 * @fileoverview Supervisor API client for PSO Dashboard
 * @summary API client for supervisor operations
 * @description Handles fetching supervisor information for PSOs
 */

import apiClient from '@/shared/api/apiClient';
import { logError } from '@/shared/utils/logger';
import { SupervisorFetchError } from '../errors';
import type { GetSupervisorForPsoResponse } from '../types';

/**
 * Fetches the supervisor for a given PSO identifier (ID, Azure OID or email)
 * 
 * @param identifier - PSO identifier (User.id, Azure AD object ID, or email)
 * @returns Promise resolving to supervisor response
 * @throws {SupervisorFetchError} If the API request fails
 */
export async function getSupervisorForPso(
  identifier: string
): Promise<GetSupervisorForPsoResponse> {
  try {
    const url = `/api/GetSupervisorForPso?identifier=${encodeURIComponent(identifier)}`;
    const response = await apiClient.get<GetSupervisorForPsoResponse>(url);
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Failed to fetch supervisor for PSO', { identifier, error });
    throw new SupervisorFetchError(
      `Failed to fetch supervisor information: ${errorMessage}`,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

