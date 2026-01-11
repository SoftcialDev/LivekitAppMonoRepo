/**
 * @fileoverview Snapshots API client
 * @summary API functions for snapshot reports
 * @description Provides API functions for fetching and deleting snapshot reports
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import type { SnapshotReport, GetSnapshotsResponse } from '../types/snapshotTypes';

/**
 * Fetches all snapshot reports from the API
 * 
 * @returns Array of snapshot reports
 * @throws {ApiError} If the API request fails
 */
export async function getSnapshots(): Promise<SnapshotReport[]> {
  try {
    const response = await apiClient.get<GetSnapshotsResponse>('/api/snapshots');
    return Array.isArray(response.data?.reports) ? response.data.reports : [];
  } catch (error) {
    throw handleApiError(
      'fetch snapshots',
      error,
      'Failed to fetch snapshot reports'
    );
  }
}

/**
 * Deletes a snapshot report by ID
 * 
 * @param id - Snapshot report ID to delete
 * @throws {ApiError} If the API request fails
 */
export async function deleteSnapshot(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/snapshots/${id}`);
  } catch (error) {
    throw handleApiError(
      'delete snapshot',
      error,
      'Failed to delete snapshot report',
      { id }
    );
  }
}

