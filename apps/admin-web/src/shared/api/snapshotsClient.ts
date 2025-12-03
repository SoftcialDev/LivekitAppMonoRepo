/**
 * @fileoverview snapshotsClient.ts - API client for snapshot reporting
 * @summary Handles HTTP requests for snapshot report operations
 * @description Provides functions to send snapshot images and metadata to the backend,
 * and retrieve snapshot reports.
 */

import apiClient from "./apiClient";
import { SnapshotRequest, SnapshotReport, SnapshotReason } from "../types/snapshot";

/**
 * Interface for the response after reporting a snapshot.
 */
export interface SnapshotResponse {
  snapshotId: string;
}

/**
 * Sends a snapshot report to the backend.
 * @param payload - Snapshot request payload containing PSO email, reason, optional description, and image data
 * @returns Promise that resolves with the new snapshot ID
 * @throws Propagates any AxiosError if the HTTP request fails
 */
export async function sendSnapshotReport(
  payload: SnapshotRequest
): Promise<string> {
  const response = await apiClient.post<SnapshotResponse>(
    "/api/snapshots",
    payload
  );

  return response.data.snapshotId;
}

/**
 * Fetches all snapshot reports.
 * @returns Promise that resolves to an array of snapshot reports
 */
export async function getSnapshots(): Promise<SnapshotReport[]> {
  const res = await apiClient.get<{ reports: SnapshotReport[] }>('/api/snapshots');
  return res.data.reports;
}

/**
 * Deletes a snapshot by its ID.
 * @param id The snapshot record ID.
 */
export async function deleteSnapshot(id: string): Promise<void> {
  await apiClient.delete(`/api/snapshots/${id}`);
}