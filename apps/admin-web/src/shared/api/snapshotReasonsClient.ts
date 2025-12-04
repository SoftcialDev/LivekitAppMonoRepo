/**
 * @fileoverview snapshotReasonsClient.ts - Client for snapshot reason API operations
 * @summary Provides methods to interact with snapshot reason endpoints
 * @description Client for managing snapshot reasons (GET, POST, PUT, DELETE, BATCH)
 */

import apiClient from "./apiClient";

/**
 * Snapshot reason interface matching backend response
 */
export interface SnapshotReason {
  id: string;
  label: string;
  code: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
}

/**
 * Response from GetSnapshotReasons endpoint
 */
export interface GetSnapshotReasonsResponse {
  reasons: SnapshotReason[];
}

/**
 * Request for creating a snapshot reason
 */
export interface CreateSnapshotReasonRequest {
  label: string;
  code: string;
  order: number;
}

/**
 * Request for updating a snapshot reason
 */
export interface UpdateSnapshotReasonRequest {
  id: string;
  label?: string;
  code?: string;
  order?: number;
  isActive?: boolean;
}

/**
 * Request for batch updating snapshot reasons
 */
export interface UpdateSnapshotReasonsBatchRequest {
  reasons: Array<{
    id: string;
    label?: string;
    order?: number;
    isActive?: boolean;
  }>;
}

/**
 * Client for snapshot reason API operations
 */
export class SnapshotReasonsClient {
  private readonly baseEndpoint = '/api/GetSnapshotReasons';

  /**
   * Gets all active snapshot reasons
   * @returns Promise that resolves to array of snapshot reasons
   */
  async getSnapshotReasons(): Promise<SnapshotReason[]> {
    const response = await apiClient.get<GetSnapshotReasonsResponse>(this.baseEndpoint);
    return response.data.reasons;
  }

  /**
   * Creates a new snapshot reason
   * @param data - Snapshot reason creation data
   * @returns Promise that resolves to the created snapshot reason
   */
  async createSnapshotReason(data: CreateSnapshotReasonRequest): Promise<SnapshotReason> {
    const response = await apiClient.post<SnapshotReason>('/api/CreateSnapshotReason', data);
    return response.data;
  }

  /**
   * Updates a snapshot reason
   * @param data - Snapshot reason update data
   * @returns Promise that resolves to the updated snapshot reason
   */
  async updateSnapshotReason(data: UpdateSnapshotReasonRequest): Promise<SnapshotReason> {
    const response = await apiClient.put<SnapshotReason>('/api/UpdateSnapshotReason', data);
    return response.data;
  }

  /**
   * Soft deletes a snapshot reason
   * @param id - ID of the snapshot reason to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteSnapshotReason(id: string): Promise<void> {
    await apiClient.delete('/api/DeleteSnapshotReason', { data: { id } });
  }

  /**
   * Updates multiple snapshot reasons in batch
   * @param data - Batch update data
   * @returns Promise that resolves when batch update is complete
   */
  async updateSnapshotReasonsBatch(data: UpdateSnapshotReasonsBatchRequest): Promise<void> {
    await apiClient.put('/api/UpdateSnapshotReasonsBatch', data);
  }
}

