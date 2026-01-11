/**
 * @fileoverview Recording type definitions
 * @summary Type definitions for recording reports
 * @description Defines interfaces and types for recording reports and API responses
 */

/**
 * Query parameters for listing recordings
 */
export interface ListRecordingsParams {
  /**
   * Filter by room name (user id)
   */
  roomName?: string;

  /**
   * Maximum number of items to return (default 50, max 200)
   */
  limit?: number;

  /**
   * Sort order by createdAt (default "desc")
   */
  order?: 'asc' | 'desc';

  /**
   * Whether to include a short-lived SAS playback URL (default true)
   */
  includeSas?: boolean;

  /**
   * SAS validity in minutes (default 60, min 1)
   */
  sasMinutes?: number;
}

/**
 * Recording report item returned by the API
 */
export interface RecordingReport {
  /**
   * Unique identifier for the recording
   */
  id: string;

  /**
   * Room name (user id)
   */
  roomName: string;

  /**
   * Room ID
   */
  roomId?: string | null;

  /**
   * Egress ID from LiveKit
   */
  egressId: string;

  /**
   * User ID who was recorded
   */
  userId: string;

  /**
   * Recording status
   */
  status: string;

  /**
   * ISO-8601 timestamp when recording started
   */
  startedAt: string;

  /**
   * ISO-8601 timestamp when recording stopped
   */
  stoppedAt?: string | null;

  /**
   * ISO-8601 timestamp when recording was created
   */
  createdAt: string;

  /**
   * ISO-8601 timestamp when recording was last updated
   */
  updatedAt?: string | null;

  /**
   * Username of the recorded user
   */
  username?: string;

  /**
   * Name of the person who recorded
   */
  recordedBy?: string;

  /**
   * Blob storage path
   */
  blobPath?: string | null;

  /**
   * Blob storage URL
   */
  blobUrl?: string | null;

  /**
   * Playback URL with SAS token (short-lived)
   */
  playbackUrl?: string;

  /**
   * Recording duration in seconds
   */
  duration: number;
}

/**
 * Response from getRecordings API
 */
export interface ListRecordingsResponse {
  /**
   * Array of recording reports
   */
  items: RecordingReport[];

  /**
   * Total count of recordings
   */
  count: number;
}

/**
 * Response from deleteRecording API
 */
export interface DeleteRecordingResponse {
  /**
   * Success message
   */
  message: string;

  /**
   * Recording session ID that was deleted
   */
  sessionId: string;

  /**
   * Blob storage path that was deleted
   */
  blobPath?: string | null;

  /**
   * Whether the blob was successfully deleted
   */
  blobDeleted: boolean;

  /**
   * Whether the blob was missing (not an error)
   */
  blobMissing: boolean;

  /**
   * Whether the database record was deleted
   */
  dbDeleted: boolean;
}

