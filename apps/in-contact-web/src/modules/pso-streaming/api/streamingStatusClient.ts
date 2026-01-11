/**
 * @fileoverview Streaming Status API client
 * @summary API client for streaming session status operations
 * @description Handles fetching active streaming sessions
 */

/**
 * @fileoverview Streaming Status API client
 * @summary API client for streaming session status operations
 * @description Handles fetching active streaming sessions
 */

import apiClient from '@/shared/api/apiClient';
import { extractErrorMessage } from '@/shared/utils/errorUtils';
import { StreamingSessionsFetchError } from '../errors';
import type { StreamingSession } from './types';

/**
 * Retrieve all currently active streaming sessions.
 *
 * Makes a GET request to `/api/FetchStreamingSessions` and returns an array.
 * If no sessions are returned by the API, this resolves to an empty array.
 *
 * @returns A list of active streaming sessions.
 * @throws {StreamingSessionsFetchError} if the request fails or the response status is not 200.
 */
export async function fetchStreamingSessions(): Promise<StreamingSession[]> {
  try {
    const resp = await apiClient.get<{ sessions?: StreamingSession[] }>(
      '/api/FetchStreamingSessions'
    );
    return resp.data.sessions ?? [];
  } catch (error) {
    const errorMessage = extractErrorMessage(error, 'Failed to fetch streaming sessions');
    throw new StreamingSessionsFetchError(errorMessage, error instanceof Error ? error : new Error(errorMessage));
  }
}

