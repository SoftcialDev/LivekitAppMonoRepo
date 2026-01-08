/**
 * @fileoverview LiveKitRecordingService - Infrastructure service for LiveKit recording operations
 * @summary Facade for recording operations using domain orchestrator
 * @description Infrastructure service that delegates to domain orchestrator for business logic
 */

import { LiveKitEgressClient } from './LiveKitEgressClient';
import { RecordingSessionApplicationService } from '../../application/services/RecordingSessionApplicationService';
import { BlobUrlService } from './BlobUrlService';
import { RecordingErrorLoggerService } from './RecordingErrorLoggerService';
import { IRecordingSessionRepository } from '../../domain/interfaces/IRecordingSessionRepository';
import { IBlobStorageService } from '../../domain/interfaces/IBlobStorageService';
import { IErrorLogService } from '../../domain/interfaces/IErrorLogService';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { RecordingStopStatus } from '../../domain/enums/RecordingStopStatus';
import { EntityNotFoundError } from '../../domain/errors';
import type {
  RecordingStopResult,
  RecordingSummary
} from '../../domain/value-objects/RecordingServiceResults';

/**
 * Infrastructure service for LiveKit recording operations
 * @description Facade that delegates to application service - maintains backward compatibility
 */
export class LiveKitRecordingService {
  private readonly applicationService: RecordingSessionApplicationService;

  constructor(
    recordingRepository: IRecordingSessionRepository,
    blobStorageService: IBlobStorageService,
    errorLogService?: IErrorLogService,
    userRepository?: IUserRepository
  ) {
    const egressClient = new LiveKitEgressClient();
    const blobUrlService = new BlobUrlService();
    const errorLogger = errorLogService && userRepository 
      ? new RecordingErrorLoggerService(errorLogService, userRepository)
      : undefined;
    
    this.applicationService = new RecordingSessionApplicationService(
      egressClient,
      recordingRepository,
      blobStorageService,
      blobUrlService,
      errorLogger
    );
  }

  /**
   * Starts a recording and persists an Active session row
   * @param args - Parameters required to create the session row
   * @returns Operation details including egress id and blob path
   */
  async startAndPersist(args: {
    roomName: string;
    subjectLabel: string;
    initiatorUserId: string;
    subjectUserId: string;
  }): Promise<{ roomName: string; egressId: string; blobPath: string }> {
    return await this.applicationService.startRecordingSession(args);
  }

  /**
   * Stop recordings for the recorded user (subject)
   * @param args - Parameters for stopping recordings
   * @returns Stop results with SAS URLs
   */
  async stopAndPersist(args: {
    roomName: string;
    initiatorUserId: string;
    subjectUserId?: string;
    sasMinutes?: number;
  }): Promise<{
    message: string;
    roomName: string;
    results: Array<{
      sessionId: string;
      egressId: string;
      status: RecordingStopStatus;
      blobPath?: string;
      blobUrl?: string;
      sasUrl?: string;
    }>;
    sasUrl?: string;
  }> {
    const { roomName, subjectUserId, sasMinutes = 60 } = args;
    const targetSubjectId = subjectUserId || roomName;
    const { message, results } = await this.applicationService.stopAllRecordingsForUser(targetSubjectId, sasMinutes);

    if (!results.length) throw new EntityNotFoundError("No active recordings found for this subject");

    const singleSas = results.length === 1 && results[0].status === RecordingStopStatus.Completed ? results[0].sasUrl : undefined;

    return {
      message,
      roomName,
      results: results.map(r => ({
        sessionId: r.sessionId,
        egressId: r.egressId,
        status: r.status,
        blobPath: r.blobPath,
        blobUrl: r.blobUrl,
        sasUrl: r.sasUrl,
      })),
      sasUrl: singleSas,
    };
  }

  /**
   * Stops all active recordings for the RECORDED USER (subject)
   * @param userId - The RECORDED user's id (subject)
   * @param sasMinutes - SAS validity for generated playback URLs (default 60)
   * @returns Stop summary with results
   */
  async stopAllForUser(
    userId: string,
    sasMinutes = 60
  ): Promise<RecordingSummary & { message: string; total: number; completed: number }> {
    return await this.applicationService.stopAllRecordingsForUser(userId, sasMinutes);
  }

  /**
   * Deletes a recording: removes the blob in Azure (if present) and deletes the DB row
   * @param sessionId - Recording session id
   * @returns Deletion summary including whether the blob was deleted or missing
   */
  async deleteRecordingById(sessionId: string): Promise<{
    sessionId: string;
    blobPath?: string | null;
    blobDeleted: boolean;
    blobMissing: boolean;
    dbDeleted: boolean;
  }> {
    return await this.applicationService.deleteRecording(sessionId);
  }
}
