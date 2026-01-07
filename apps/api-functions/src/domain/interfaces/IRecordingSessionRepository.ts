/**
 * @fileoverview IRecordingSessionRepository - Interface for recording session data access
 * @summary Defines contract for recording session persistence operations
 * @description Provides abstraction for recording session data access layer
 */

import { RecordingSession } from '../entities/RecordingSession';
import { CreateRecordingSessionData, ListRecordingsParams } from '../types/RecordingSessionTypes';

/**
 * Interface for recording session repository operations
 */
export interface IRecordingSessionRepository {
  /**
   * Finds a recording session by ID
   * @param id - Recording session ID
   * @returns RecordingSession entity or null if not found
   */
  findById(id: string): Promise<RecordingSession | null>;

  /**
   * Lists recording sessions with optional filters
   * @param params - Filter and pagination parameters
   * @returns Array of RecordingSession entities
   */
  list(params: ListRecordingsParams): Promise<RecordingSession[]>;

  /**
   * Fetches users by IDs for display name resolution
   * @param ids - Array of user IDs
   * @returns Array of user data with id, email, and fullName
   */
  getUsersByIds(ids: string[]): Promise<Array<{id: string; email: string; fullName: string}>>;

  /**
   * Creates a new active recording session
   * @param data - Recording session creation data
   * @returns Created RecordingSession entity
   */
  createActive(data: CreateRecordingSessionData): Promise<RecordingSession>;

  /**
   * Marks a recording session as completed
   * @param sessionId - Recording session ID
   * @param blobUrl - Final blob storage URL
   * @param stoppedAt - ISO string of when recording stopped
   * @returns Promise that resolves when update is complete
   */
  complete(sessionId: string, blobUrl: string | null, stoppedAt: string): Promise<void>;

  /**
   * Marks a recording session as failed
   * @param sessionId - Recording session ID
   * @returns Promise that resolves when update is complete
   */
  fail(sessionId: string): Promise<void>;

  /**
   * Permanently deletes a recording session
   * @param id - Recording session ID
   * @returns Promise that resolves when deletion is complete
   */
  deleteById(id: string): Promise<void>;

  /**
   * Finds active recording sessions by room name
   * @param roomName - LiveKit room name
   * @returns Array of active RecordingSession entities
   */
  findActiveByRoom(roomName: string): Promise<RecordingSession[]>;

  /**
   * Finds active recording sessions by subject user ID
   * @param subjectUserId - User ID of the person being recorded
   * @returns Array of active RecordingSession entities
   */
  findActiveBySubject(subjectUserId: string): Promise<RecordingSession[]>;

  /**
   * Finds active recording sessions by initiator user ID
   * @param userId - User ID of the person who started the recording
   * @returns Array of active RecordingSession entities
   */
  findActiveByInitiator(userId: string): Promise<RecordingSession[]>;
}
