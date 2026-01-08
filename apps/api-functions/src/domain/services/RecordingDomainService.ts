/**
 * @fileoverview RecordingDomainService - Domain service for recording operations
 * @summary Encapsulates recording session business logic
 * @description Handles recording session domain operations with business rules and data transformation
 */

import { IRecordingSessionRepository } from '../interfaces/IRecordingSessionRepository';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IRecordingDomainService } from '../interfaces/IRecordingDomainService';
import { GetLivekitRecordingsRequest } from '../value-objects/GetLivekitRecordingsRequest';
import { GetLivekitRecordingsResponse } from '../value-objects/GetLivekitRecordingsResponse';
import { RecordingListItemPayload } from '../value-objects/GetLivekitRecordingsResponse';
import { RecordingSession } from '../entities/RecordingSession';
import { 
  RecordingFetchError 
} from '../errors/RecordingErrors';
import { buildBlobHttpsUrl, generateReadSasUrl } from '../../infrastructure/services/blobSigner';

/**
 * Domain service for recording session operations
 * 
 * @param recordingRepository - Repository for recording session data access
 * @param userRepository - Repository for user data access
 */
export class RecordingDomainService implements IRecordingDomainService {
  constructor(
    private readonly recordingRepository: IRecordingSessionRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Lists recording sessions with UI-ready data including user resolution and SAS URLs
   * @param request - Query parameters for listing recordings
   * @returns GetLivekitRecordingsResponse with enriched recording data
   * @throws RecordingFetchError when data retrieval fails
   */
  async listRecordings(request: GetLivekitRecordingsRequest): Promise<GetLivekitRecordingsResponse> {
    try {
      const sessions = await this.recordingRepository.list({
        roomName: request.roomName,
        limit: request.limit,
        orderByCreatedAt: request.order
      });

      if (sessions.length === 0) {
        return GetLivekitRecordingsResponse.withNoItems();
      }

      // Resolve user information for display names
      const userIds = this.extractUserIds(sessions);
      const users = await this.recordingRepository.getUsersByIds(userIds);
      const userMap = new Map(users.map(u => [u.id, u]));

      // Transform sessions to UI-ready format
      const items = sessions.map(session => this.enrichSessionData(session, userMap, request));

      return GetLivekitRecordingsResponse.withItems(items);
    } catch (error) {
      throw new RecordingFetchError(`Failed to list recordings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extracts unique user IDs from recording sessions
   * @param sessions - Array of recording sessions
   * @returns Array of unique user IDs
   */
  private extractUserIds(sessions: RecordingSession[]): string[] {
    const subjectIds = sessions.map(s => s.roomName).filter(Boolean) as string[];
    const initiatorIds = sessions.map(s => s.userId).filter(Boolean) as string[];
    return Array.from(new Set([...subjectIds, ...initiatorIds]));
  }

  /**
   * Enriches session data with user information and playback URLs
   * @param session - Recording session entity
   * @param userMap - Map of user ID to user data
   * @param request - Request parameters for URL generation
   * @returns Enriched recording list item payload
   */
  private enrichSessionData(
    session: RecordingSession, 
    userMap: Map<string, {id: string; email: string; fullName: string}>, 
    request: GetLivekitRecordingsRequest
  ): RecordingListItemPayload {
    // Resolve subject (person being recorded)
    const subject = session.roomName ? userMap.get(session.roomName) : undefined;
    const username = subject?.fullName || subject?.email || undefined;

    // Resolve initiator (who started the recording)
    const initiator = userMap.get(session.userId);
    const recordedBy = initiator?.fullName || initiator?.email || undefined;

    // Generate playback URL with optional SAS
    const plainUrl = session.blobUrl || (session.blobPath ? buildBlobHttpsUrl(session.blobPath) : undefined);
    const playbackUrl = request.includeSas && session.blobPath
      ? generateReadSasUrl(session.blobPath, Math.max(request.sasMinutes, 1))
      : plainUrl;

    return {
      ...session.toPayload(),
      username,
      recordedBy,
      playbackUrl,
    };
  }
}
