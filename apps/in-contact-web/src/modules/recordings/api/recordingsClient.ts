/**
 * @fileoverview Recordings API client
 * @summary API functions for recording reports
 * @description Provides API functions for fetching and deleting recording reports
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import type {
  RecordingReport,
  ListRecordingsParams,
  ListRecordingsResponse,
  DeleteRecordingResponse,
} from '../types/recordingTypes';

/**
 * Fetches all recording reports from the API
 * 
 * @param params - Optional filters and output controls
 * @returns Response with items array and total count
 * @throws {ApiError} If the API request fails
 */
export async function getRecordings(
  params: ListRecordingsParams = {}
): Promise<RecordingReport[]> {
  try {
    const response = await apiClient.get<ListRecordingsResponse>('/api/recordings', {
      params,
    });
    return Array.isArray(response.data?.items) ? response.data.items : [];
  } catch (error) {
    throw handleApiError(
      'fetch recordings',
      error,
      'Failed to fetch recording reports',
      { params }
    );
  }
}

/**
 * Deletes a recording report by ID
 * 
 * Removes both the blob storage file (if found) and the database record.
 * 
 * @param id - Recording ID to delete
 * @returns Deletion summary response
 * @throws {ApiError} If the API request fails
 */
export async function deleteRecording(id: string): Promise<DeleteRecordingResponse> {
  try {
    const response = await apiClient.delete<DeleteRecordingResponse>(
      `/api/recordings/${encodeURIComponent(id)}`
    );
    return response.data;
  } catch (error) {
    throw handleApiError(
      'delete recording',
      error,
      'Failed to delete recording report',
      { id }
    );
  }
}

