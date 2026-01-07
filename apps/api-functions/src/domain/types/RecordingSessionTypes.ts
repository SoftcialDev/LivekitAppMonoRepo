/**
 * @fileoverview RecordingSessionTypes - Type definitions for recording session operations
 * @summary Defines types and interfaces for recording session data structures
 * @description Encapsulates recording session creation and query data structures
 */

/**
 * Parameters for creating a new recording session
 * @description Represents the data needed to create a recording session
 */
export interface CreateRecordingSessionData {
  /**
   * LiveKit room name
   */
  roomName: string;

  /**
   * Egress identifier from LiveKit
   */
  egressId: string;

  /**
   * User identifier who initiated the recording
   */
  userId: string;

  /**
   * User identifier of the person being recorded
   */
  subjectUserId: string;

  /**
   * Human-readable label for the subject
   */
  subjectLabel: string;

  /**
   * Blob storage path for the recording
   */
  blobPath: string;

  /**
   * ISO string of when recording started
   */
  startedAt: string;
}

/**
 * Parameters for listing recording sessions
 * @description Represents filter and pagination criteria for listing recordings
 */
export interface ListRecordingsParams {
  /**
   * Filter by room name
   */
  roomName?: string;

  /**
   * Maximum number of results
   */
  limit: number;

  /**
   * Sort order by creation date
   */
  orderByCreatedAt: 'asc' | 'desc';
}

