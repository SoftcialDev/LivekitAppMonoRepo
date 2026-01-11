/**
 * @fileoverview Snapshot API client
 * @summary API client for snapshot reporting operations
 * @description Provides functions to send snapshot images and metadata to the backend
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import type { SnapshotRequest, SnapshotResponse } from './types/snapshotClientTypes';

/**
 * Sends a snapshot report to the backend
 * 
 * @param payload - Snapshot request payload containing PSO email, reason, optional description, and image data
 * @returns Promise that resolves with the new snapshot ID
 * @throws {Error} If the API request fails
 */
export async function sendSnapshotReport(payload: SnapshotRequest): Promise<string> {
  try {
    const response = await apiClient.post<SnapshotResponse>('/api/snapshots', payload);
    return response.data.snapshotId;
  } catch (error) {
    throw handleApiError(
      'send snapshot report',
      error,
      'Failed to send snapshot report'
    );
  }
}

