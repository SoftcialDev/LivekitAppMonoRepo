/**
 * @fileoverview Snapshot reasons API client
 * @summary API client for snapshot reason operations
 * @description Provides methods to interact with snapshot reason endpoints
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import type { SnapshotReason } from '../../snapshots/types/snapshotTypes';

/**
 * Response from GetSnapshotReasons endpoint
 */
export interface GetSnapshotReasonsResponse {
  reasons: SnapshotReason[];
}

/**
 * Client for snapshot reason API operations
 */
export class SnapshotReasonsClient {
  private readonly baseEndpoint = '/api/GetSnapshotReasons';

  /**
   * Gets all active snapshot reasons
   * 
   * @returns Promise that resolves to array of snapshot reasons
   * @throws {Error} If the API request fails
   */
  async getSnapshotReasons(): Promise<SnapshotReason[]> {
    try {
      const response = await apiClient.get<GetSnapshotReasonsResponse>(this.baseEndpoint);
      return response.data.reasons;
    } catch (error) {
      throw handleApiError(
        'get snapshot reasons',
        error,
        'Failed to get snapshot reasons'
      );
    }
  }
}

