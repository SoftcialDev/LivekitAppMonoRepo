/**
 * @fileoverview Streaming Status Batch API client
 * @summary API client for batch streaming status operations
 * @description Handles communication with StreamingStatusBatch Azure Function endpoint
 */

/**
 * @fileoverview Streaming Status Batch API client
 * @summary API client for batch streaming status operations
 * @description Handles communication with StreamingStatusBatch Azure Function endpoint
 */

import apiClient from '@/shared/api/apiClient';
import { extractErrorMessage } from '@/shared/utils/errorUtils';
import { StreamingStatusBatchError } from '../errors';
import type { StreamingStatusBatchResponse } from './types';

/**
 * Fetches streaming status for multiple users in batch
 * @param emails - Array of email addresses to query
 * @returns Promise that resolves to batch streaming status response
 * @throws {StreamingStatusBatchError} if the API request fails
 */
export async function fetchStreamingStatusBatch(emails: string[]): Promise<StreamingStatusBatchResponse> {
  try {
    const response = await apiClient.post<StreamingStatusBatchResponse>('/api/StreamingStatusBatch', {
      emails
    });
    return response.data;
  } catch (error) {
    const errorMessage = extractErrorMessage(error, 'Failed to fetch streaming status batch');
    throw new StreamingStatusBatchError(errorMessage, error instanceof Error ? error : new Error(errorMessage));
  }
}

