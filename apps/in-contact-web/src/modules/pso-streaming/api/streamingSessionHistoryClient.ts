/**
 * @fileoverview Streaming session history API client
 * @summary API client for fetching streaming session history
 * @description Handles fetching streaming session history for specific users
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import { StreamingSessionsFetchError } from '../errors';
import type { IPsoStreamingSession } from '../hooks/status/types/psoStreamingStatusTypes';

/**
 * Response from FetchStreamingSessionHistory endpoint
 */
export interface IFetchStreamingSessionHistoryResponse {
  session: IPsoStreamingSession | null;
}

/**
 * Fetches the most recent streaming session history for a specific user by email
 * 
 * @param email - Email of the user to fetch session history for
 * @returns Promise resolving to the streaming session history response
 * @throws {StreamingSessionsFetchError} If the API request fails
 */
export async function fetchStreamingSessionHistoryByEmail(
  email: string
): Promise<IFetchStreamingSessionHistoryResponse> {
  try {
    const response = await apiClient.get<IFetchStreamingSessionHistoryResponse>(
      '/api/FetchStreamingSessionHistory',
      {
        params: {
          email: email.toLowerCase().trim(),
        },
      }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(
      'fetch streaming session history',
      error,
      'Failed to fetch streaming session history'
    );
  }
}

