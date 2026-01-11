/**
 * @fileoverview Talk sessions API client
 * @summary API functions for talk session reports
 * @description Provides API functions for fetching talk session reports
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import type { TalkSessionReport, GetTalkSessionsResponse } from '../types/talkSessionTypes';

/**
 * Fetches all talk session reports from the API
 * 
 * Fetches all sessions by making multiple requests if needed to get all pages.
 * Uses local pagination in the DataTable component instead of external pagination.
 * 
 * @returns Array of all talk session reports
 * @throws {ApiError} If the API request fails
 */
export async function getTalkSessions(): Promise<TalkSessionReport[]> {
  try {
    const allSessions: TalkSessionReport[] = [];
    let currentPage = 1;
    let hasMore = true;
    const limit = 100;

    // Fetch all pages until we have all sessions
    while (hasMore) {
      const response = await apiClient.get<GetTalkSessionsResponse>('/api/TalkSessions', {
        params: { page: currentPage, limit },
      });

      if (response.data?.sessions) {
        allSessions.push(...response.data.sessions);
      }

      hasMore = response.data?.hasMore ?? false;
      currentPage += 1;

      // Safety limit to prevent infinite loops
      if (currentPage > 1000) {
        break;
      }
    }

    return allSessions;
  } catch (error) {
    throw handleApiError(
      'fetch talk sessions',
      error,
      'Failed to fetch talk session reports'
    );
  }
}

