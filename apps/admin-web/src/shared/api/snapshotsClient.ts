/**
 * @file Snapshot reporting client for InContactApp.
 *
 * Provides a function to send snapshot images and metadata to the backend.
 */

import apiClient from "./apiClient";

//
// Data Types
//

/**
 * Request payload for reporting a snapshot.
 */
export interface SnapshotRequest {
  /**
   * The UUID of the PSO (employee) being reported on.
   */
  psoEmail: string;
  /**
   * The textual reason or context for taking the snapshot.
   */
  reason: string;
  /**
   * The Base64‑encoded JPEG image data.
   */
  imageBase64: string;
}

/**
 * Response payload returned after reporting a snapshot.
 */
export interface SnapshotResponse {
  /**
   * The unique identifier of the newly created snapshot record.
   */
  snapshotId: string;
}

//
// API Function
//

/**
 * Sends a snapshot report to the backend.
 *
 * @param payload
 *   Object containing:
 *   - `psoId`: The PSO’s UUID.
 *   - `reason`: The reason for taking the snapshot.
 *   - `imageBase64`: The Base64‑encoded JPEG image.
 *
 * @returns A promise that resolves with the new `snapshotId`.
 *
 * @throws Propagates any AxiosError if the HTTP request fails.
 *
 * @example
 * ```ts
 * const payload: SnapshotRequest = {
 *   psoId: "3f8a1c2e-4b9d-4e1a-a9d2-abcdef012345",
 *   reason: "Suspected mobile violation",
 *   imageBase64: dataUrl.split(",")[1],
 * };
 *
 * sendSnapshotReport(payload)
 *   .then(id => console.log("Snapshot stored with ID:", id))
 *   .catch(err => console.error("Failed to send snapshot:", err));
 * ```
 */
export async function sendSnapshotReport(
  payload: SnapshotRequest
): Promise<string> {
  // Log outgoing payload for debugging
  console.log("[sendSnapshotReport] Request payload:", payload);

  const response = await apiClient.post<SnapshotResponse>(
    "/api/snapshots",
    payload
  );

  // Log response data
  console.log("[sendSnapshotReport] Response data:", response.data);

  return response.data.snapshotId;
}


export interface SnapshotReport {
  id:             string;
  supervisorName: string;
  psoFullName:    string;
  psoEmail:       string;
  reason:         string;
  imageUrl:       string;
  takenAt:      string;
}

/**
 * Fetches all snapshot reports.
 * @returns Array of {@link SnapshotReport}.
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