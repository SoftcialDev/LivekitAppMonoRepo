/**
 * @file LiveKit recording client for the frontend.
 * Calls:
 *  - POST  /api/recording           with { command, roomName }
 *  - GET   /api/recordings          with optional query params
 *  - DELETE/api/recordings/{id}     to delete a recording by id
 */

import apiClient from "./apiClient";

export type RecordingCommand = "start" | "stop";

export interface RecordingCommandRequest {
  command: RecordingCommand;
  roomName: string;
}

/**
 * Minimal shape for legacy POST responses.
 * Note: The backend may return additional fields (e.g., egressId, blobPath, results, sasUrl).
 */
export interface RecordingCommandResponse {
  message: string;
  roomName: string;
  stoppedCount?: number;
}

/** Generic command sender */
export async function sendRecordingCommand(
  payload: RecordingCommandRequest
): Promise<RecordingCommandResponse> {
  const res = await apiClient.post<RecordingCommandResponse>(
    "api/recording",
    payload
  );
  return res.data;
}

/** Helper: start recording */
export async function startRecording(roomName: string) {
  return sendRecordingCommand({ command: "start", roomName });
}

/** Helper: stop recording */
export async function stopRecording(roomName: string) {
  return sendRecordingCommand({ command: "stop", roomName });
}

/* ----------------------------- GET /recordings ----------------------------- */

/**
 * Query parameters supported by GET /api/recordings.
 *
 * - roomName?: filter by room name (user id)
 * - limit?: max number of items (default 50, max 200)
 * - order?: "asc" | "desc" by createdAt (default "desc")
 * - includeSas?: whether to include a short-lived SAS playback URL (default true)
 * - sasMinutes?: SAS validity in minutes (default 60, min 1)
 */
export interface ListRecordingsParams {
  roomName?: string;
  limit?: number;
  order?: "asc" | "desc";
  includeSas?: boolean;
  sasMinutes?: number;
}

/**
 * Item returned by GET /api/recordings, ready for UI display.
 * `createdAt`/`updatedAt` are serialized as ISO-8601 strings.
 */
export interface RecordingListItem {
  id: string;
  roomName: string;
  roomId?: string | null;
  egressId: string;
  userId: string;
  status: string;
  startedAt: string;
  stoppedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  username?: string;
  recordedBy?: string; 
  blobPath?: string | null;
  blobUrl?: string | null;
  playbackUrl?: string;
  duration: number;
}

/** Envelope returned by GET /api/recordings. */
export interface ListRecordingsResponse {
  items: RecordingListItem[];
  count: number;
}

/**
 * Fetches recording sessions for the table.
 *
 * @param params - Optional filters and output controls.
 * @returns Items plus total count.
 */
export async function getRecordings(
  params: ListRecordingsParams = {}
): Promise<ListRecordingsResponse> {
  const { data } = await apiClient.get<ListRecordingsResponse>("api/recordings", {
    params,
  });
  return data;
}

/* --------------------------- DELETE /recordings/{id} --------------------------- */

/**
 * Response returned by DELETE /api/recordings/{id}.
 */
export interface DeleteRecordingResponse {
  message: string;
  sessionId: string;
  blobPath?: string | null;
  blobDeleted: boolean;
  blobMissing: boolean;
  dbDeleted: boolean;
}

/**
 * Deletes a recording by id: removes the blob (when found) and deletes the DB row.
 *
 * @param id - Recording session id.
 * @returns Deletion summary.
 */
export async function deleteRecording(id: string): Promise<DeleteRecordingResponse> {
  const { data } = await apiClient.delete<DeleteRecordingResponse>(
    `api/recordings/${encodeURIComponent(id)}`
  );
  return data;
}
