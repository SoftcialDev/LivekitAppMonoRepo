/**
 * @fileoverview streamingStatusBatchClient - API client for batch streaming status operations
 * @summary Provides client methods for batch streaming status queries
 * @description Handles communication with StreamingStatusBatch Azure Function endpoint
 */

import apiClient from './apiClient';

/**
 * Valid stop reasons for streaming sessions
 */
export type StopReason = 'QUICK_BREAK' | 'SHORT_BREAK' | 'LUNCH_BREAK' | 'EMERGENCY' | 'END_OF_SHIFT' | 'COMMAND' | 'DISCONNECT';

/**
 * Request payload for batch streaming status queries
 */
export interface StreamingStatusBatchRequest {
  emails: string[];
}

/**
 * Individual streaming status for a user
 */
export interface UserStreamingStatus {
  email: string;
  hasActiveSession: boolean;
  lastSession: {
    stopReason: StopReason | null;
    stoppedAt: string | null;
  } | null;
}

/**
 * Response payload for batch streaming status queries
 */
export interface StreamingStatusBatchResponse {
  statuses: UserStreamingStatus[];
}

/**
 * Fetches streaming status for multiple users in batch
 * @param emails - Array of email addresses to query
 * @returns Promise that resolves to batch streaming status response
 * @throws Error if the API request fails
 * @example
 * const response = await fetchStreamingStatusBatch(['user1@example.com', 'user2@example.com']);
 * console.log(response.statuses); // Array of user streaming statuses
 */
export async function fetchStreamingStatusBatch(emails: string[]): Promise<StreamingStatusBatchResponse> {
  try {
    const response = await apiClient.post<StreamingStatusBatchResponse>('/api/StreamingStatusBatch', {
      emails
    });
    return response.data;
  } catch (error: any) {
    throw new Error(`Failed to fetch streaming status batch: ${error.message}`);
  }
}
