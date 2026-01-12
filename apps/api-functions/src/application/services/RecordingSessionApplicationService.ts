/**
 * @fileoverview RecordingSessionApplicationService - Application service for recording session operations
 * @summary Orchestrates recording session lifecycle operations
 * @description Handles orchestration of recording session start, stop, and management operations
 */

import { EgressStatus } from "livekit-server-sdk";
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { tryParseBlobPathFromUrl } from '../../utils/blobUrlParser';
import { RecordingStopStatus } from '../../domain/enums/RecordingStopStatus';
import { ILiveKitEgressClient } from '../../domain/interfaces/ILiveKitEgressClient';
import { IRecordingSessionRepository } from '../../domain/interfaces/IRecordingSessionRepository';
import { IBlobStorageService } from '../../domain/interfaces/IBlobStorageService';
import { IBlobUrlService } from '../../domain/interfaces/IBlobUrlService';
import { IRecordingErrorLogger } from '../../domain/interfaces/IRecordingErrorLogger';
import { RecordingSessionNotFoundError } from '../../domain/errors/ApplicationServiceErrors';
import { extractErrorMessage, extractEgressErrorDetails, extractEgressErrorMessage } from '../../utils/error/ErrorHelpers';
import { RecordingSession } from '../../domain/entities/RecordingSession';
import { EgressErrorDetails } from '../../domain/types/LiveKitTypes';
import { RecordingStopResult } from '../../domain/value-objects/RecordingServiceResults';

/**
 * Application service for orchestrating recording session operations
 * @description Orchestrates recording session lifecycle management across infrastructure services
 */
export class RecordingSessionApplicationService {
  constructor(
    private readonly egressClient: ILiveKitEgressClient,
    private readonly recordingRepository: IRecordingSessionRepository,
    private readonly blobStorageService: IBlobStorageService,
    private readonly blobUrlService: IBlobUrlService,
    private readonly errorLogger?: IRecordingErrorLogger
  ) {}

  /**
   * Starts a recording session with persistence and monitoring
   * @param args - Parameters required to create the session
   * @returns Operation details including egress id and blob path
   */
  async startRecordingSession(args: {
    roomName: string;
    subjectLabel: string;
    initiatorUserId: string;
    subjectUserId: string;
  }): Promise<{ roomName: string; egressId: string; blobPath: string }> {
    let egressId: string | undefined;
    let objectKey: string | undefined;
    let sessionId: string | null = null;

    try {
      const result = await this.egressClient.startEgress(
        args.roomName,
        args.subjectLabel
      );
      egressId = result.egressId;
      objectKey = result.objectKey;

      const session = await this.recordingRepository.createActive({
        roomName: args.roomName,
        egressId,
        userId: args.initiatorUserId,
        subjectUserId: args.subjectUserId,
        subjectLabel: args.subjectLabel,
        blobPath: objectKey,
        startedAt: getCentralAmericaTime().toISOString(),
      });
      sessionId = session.id;

      this.scheduleEgressStatusCheck(egressId, sessionId, args);

      return { roomName: args.roomName, egressId, blobPath: objectKey };
    } catch (error: unknown) {
      if (sessionId) {
        try {
          await this.recordingRepository.fail(sessionId);
        } catch {
          // Failed to mark session as failed
        }
      }

      const errorDetails = extractEgressErrorDetails(error);
      const errorMessage = extractEgressErrorMessage(errorDetails, error, 'Failed to start recording egress');
      const errorInstance = error instanceof Error ? error : new Error(String(error));

      if (this.errorLogger) {
        await this.errorLogger.logError(
          {
            message: `Recording start failed: ${errorMessage}`,
            name: errorInstance.name || 'RecordingStartError',
            stack: errorInstance.stack,
          },
          {
            sessionId: sessionId ?? undefined,
            egressId: egressId ?? undefined,
            roomName: args.roomName,
            subjectUserId: args.subjectUserId,
            initiatorUserId: args.initiatorUserId,
            clusterErrorDetails: errorDetails,
          }
        );
      }

      throw error;
    }
  }

  /**
   * Schedules a check for egress status after initialization
   * @param egressId - Egress identifier to check
   * @param sessionId - Session identifier
   * @param args - Original start arguments
   */
  private scheduleEgressStatusCheck(
    egressId: string,
    sessionId: string | null,
    args: {
      roomName: string;
      subjectUserId: string;
      initiatorUserId: string;
    }
  ): void {
    setTimeout(async () => {
      try {
        const egressInfo = await this.egressClient.getEgressInfo(egressId);
        if (egressInfo && (egressInfo.status === EgressStatus.EGRESS_FAILED || egressInfo.status === EgressStatus.EGRESS_ABORTED)) {
          const errorDetails = extractEgressErrorDetails(egressInfo);
          const errorMessage = extractEgressErrorMessage(errorDetails, egressInfo, 'Egress failed during initialization');
          
          if (sessionId) {
            await this.recordingRepository.fail(sessionId);
          }

          if (this.errorLogger) {
            await this.errorLogger.logError(
              {
                message: `Recording egress failed during start: ${errorMessage}`,
                name: 'EgressStartFailed',
              },
              {
                sessionId: sessionId ?? undefined,
                egressId: egressId,
                roomName: args.roomName,
                subjectUserId: args.subjectUserId,
                initiatorUserId: args.initiatorUserId,
                egressStatus: String(egressInfo.status),
                clusterErrorDetails: errorDetails,
                failureReason: 'Egress failed during initialization after start',
              }
            );
          }
        }
      } catch {
        // Failed to check egress status
      }
    }, 5000);
  }

  /**
   * Finds all active recording sessions for a user
   * @param userId - User ID to search for
   * @returns Array of unique active sessions
   */
  async findActiveSessions(userId: string): Promise<RecordingSession[]> {
    const [byRoom, bySubject] = await Promise.all([
      this.recordingRepository.findActiveByRoom(userId),
      this.recordingRepository.findActiveBySubject(userId),
    ]);

    const map = new Map<string, RecordingSession>();
    for (const s of [...byRoom, ...bySubject]) {
      map.set(s.id, s);
    }
    return Array.from(map.values());
  }

  /**
   * Handles a successfully stopped recording session
   * @param session - Recording session
   * @param blobUrl - Blob URL from egress
   * @param sasMinutes - SAS validity minutes
   * @returns RecordingStopResult for completed session
   */
  async handleCompletedSession(
    session: RecordingSession,
    blobUrl: string | undefined,
    sasMinutes: number
  ): Promise<RecordingStopResult> {
    const finalUrl = blobUrl || (session.blobPath ? this.blobUrlService.buildBlobHttpsUrl(session.blobPath) : undefined);
    await this.recordingRepository.complete(
      session.id,
      finalUrl ?? null,
      getCentralAmericaTime().toISOString()
    );

    const sasUrl = session.blobPath
      ? this.blobUrlService.generateReadSasUrl(session.blobPath, Math.max(1, sasMinutes))
      : undefined;

    return {
      sessionId: session.id,
      egressId: session.egressId,
      status: RecordingStopStatus.Completed,
      blobPath: session.blobPath ?? undefined,
      blobUrl: finalUrl,
      sasUrl,
      roomName: session.roomName,
      initiatorUserId: session.userId,
      subjectUserId: session.subjectUserId ?? null,
    };
  }

  /**
   * Handles a failed recording session
   * @param session - Recording session
   * @param egressError - Error message from egress
   * @param clusterErrorDetails - Error details from cluster
   * @returns RecordingStopResult for failed session
   */
  async handleFailedSession(
    session: RecordingSession,
    egressError: string,
    clusterErrorDetails?: unknown
  ): Promise<RecordingStopResult> {
    await this.recordingRepository.fail(session.id);

    if (this.errorLogger) {
      await this.errorLogger.logError(
        {
          message: `Recording egress failed: ${egressError}`,
          name: 'EgressFailed',
        },
        {
          sessionId: session.id,
          egressId: session.egressId,
          roomName: session.roomName,
          subjectUserId: session.subjectUserId,
          initiatorUserId: session.userId,
          egressStatus: (clusterErrorDetails && typeof clusterErrorDetails === 'object' && 'status' in clusterErrorDetails) 
                        ? String(clusterErrorDetails.status) 
                        : 'EGRESS_FAILED',
          egressError: egressError,
          clusterErrorDetails: clusterErrorDetails || undefined,
        }
      );
    }

    return {
      sessionId: session.id,
      egressId: session.egressId,
      status: RecordingStopStatus.Failed,
      blobPath: session.blobPath ?? undefined,
      blobUrl: undefined,
      roomName: session.roomName,
      initiatorUserId: session.userId,
      subjectUserId: session.subjectUserId ?? null,
    };
  }

  /**
   * Handles a recording session that was not found (disconnected)
   * @param session - Recording session
   * @returns RecordingStopResult for disconnected session
   */
  async handleDisconnectedSession(session: RecordingSession): Promise<RecordingStopResult> {
    const blobUrl = session.blobPath
      ? this.blobUrlService.buildBlobHttpsUrl(session.blobPath)
      : null;

    await this.recordingRepository.complete(
      session.id,
      blobUrl,
      getCentralAmericaTime().toISOString()
    );

    return {
      sessionId: session.id,
      egressId: session.egressId,
      status: RecordingStopStatus.CompletedDisconnection,
      blobPath: session.blobPath ?? undefined,
      blobUrl: blobUrl ?? undefined,
      roomName: session.roomName,
      initiatorUserId: session.userId,
      subjectUserId: session.subjectUserId ?? null,
    };
  }

  /**
   * Handles an error when stopping a recording session
   * @param session - Recording session
   * @param err - Error that occurred
   * @returns RecordingStopResult for failed session
   */
  async handleStopError(session: RecordingSession, err: unknown): Promise<RecordingStopResult> {
    await this.recordingRepository.fail(session.id);

    const errorDetails = extractEgressErrorDetails(err);
    const egressErrorDetails = extractEgressErrorMessage(errorDetails, err, 'Recording stop failed');

    const errorInstance = err instanceof Error ? err : new Error(String(err));
    if (this.errorLogger) {
      await this.errorLogger.logError(
        {
          message: egressErrorDetails 
            ? `Recording stop failed: ${egressErrorDetails}` 
            : `Recording stop failed: ${extractErrorMessage(err)}`,
          name: errorInstance.name || 'RecordingStopError',
          stack: errorInstance.stack,
        },
        {
          sessionId: session.id,
          egressId: session.egressId,
          roomName: session.roomName,
          subjectUserId: session.subjectUserId,
          initiatorUserId: session.userId,
          stopError: extractErrorMessage(err),
          egressStatus: errorDetails.status || 'UNKNOWN',
          egressError: egressErrorDetails,
          clusterErrorDetails: errorDetails || undefined,
        }
      );
    }

    return {
      sessionId: session.id,
      egressId: session.egressId,
      status: RecordingStopStatus.Failed,
      blobPath: session.blobPath ?? undefined,
      blobUrl: undefined,
      roomName: session.roomName,
      initiatorUserId: session.userId,
      subjectUserId: session.subjectUserId ?? null,
    };
  }

  /**
   * Gets cluster error details for an egress session
   * @param egressId - Egress identifier
   * @returns Cluster error details or undefined if unavailable
   */
  private async getClusterErrorDetails(egressId: string): Promise<EgressErrorDetails | undefined> {
    try {
      const egressInfo = await this.egressClient.getEgressInfo(egressId);
      return egressInfo ? extractEgressErrorDetails(egressInfo) : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Attempts to stop egress and returns blob URL or error
   * @param egressId - Egress identifier
   * @param clusterErrorDetails - Optional cluster error details
   * @returns Object with blobUrl or egressError
   */
  private async stopEgressWithErrorHandling(
    egressId: string,
    clusterErrorDetails: EgressErrorDetails | undefined
  ): Promise<{ blobUrl?: string; egressError?: string }> {
    try {
      const stopResult = await this.egressClient.stopEgress(egressId);
      return { blobUrl: stopResult.blobUrl };
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      const message = errorMessage.toLowerCase();
      
      if (message.includes("egress_failed") || message.includes("cannot be stopped")) {
        const errorDetails = extractEgressErrorDetails(err);
        
        if (clusterErrorDetails) {
          Object.assign(errorDetails, clusterErrorDetails);
        }
        
        const egressError = extractEgressErrorMessage(errorDetails, err, 'Egress failed but error details not available');
        return { egressError };
      }
      
      throw err;
    }
  }

  /**
   * Processes a single recording session stop attempt
   * @param session - Recording session to stop
   * @param sasMinutes - SAS validity minutes
   * @returns RecordingStopResult for the session
   */
  private async processSessionStop(
    session: RecordingSession,
    sasMinutes: number
  ): Promise<RecordingStopResult> {
    const clusterErrorDetails = await this.getClusterErrorDetails(session.egressId);
    const { blobUrl, egressError } = await this.stopEgressWithErrorHandling(session.egressId, clusterErrorDetails);
    
    if (egressError) {
      return await this.handleFailedSession(session, egressError, clusterErrorDetails);
    }

    return await this.handleCompletedSession(session, blobUrl, sasMinutes);
  }

  /**
   * Handles error when processing session stop
   * @param session - Recording session
   * @param err - Error that occurred
   * @returns RecordingStopResult for the session
   */
  private async handleSessionStopError(
    session: RecordingSession,
    err: unknown
  ): Promise<RecordingStopResult> {
    const message = (err instanceof Error ? err.message : String(err)).toLowerCase();
    const notFound = message.includes("not found") || message.includes("no active egress");
    
    if (notFound) {
      return await this.handleDisconnectedSession(session);
    }

    return await this.handleStopError(session, err);
  }

  /**
   * Stops all active recordings for a user
   * @param userId - User ID to stop recordings for
   * @param sasMinutes - SAS validity minutes
   * @returns Summary with results
   */
  async stopAllRecordingsForUser(
    userId: string,
    sasMinutes: number
  ): Promise<{
    message: string;
    total: number;
    completed: number;
    results: RecordingStopResult[];
  }> {
    const sessions = await this.findActiveSessions(userId);

    if (!sessions.length) {
      return {
        message: "No active recordings to stop",
        total: 0,
        completed: 0,
        results: [],
      };
    }

    const results: RecordingStopResult[] = [];
    let completed = 0;

    for (const session of sessions) {
      try {
        const result = await this.processSessionStop(session, sasMinutes);
        if (result.status === RecordingStopStatus.Completed) {
          completed += 1;
        }
        results.push(result);
      } catch (err: unknown) {
        const result = await this.handleSessionStopError(session, err);
        results.push(result);
      }
    }

    return {
      message: `Recording stop (subject=${userId}). ${completed}/${sessions.length} completed.`,
      total: sessions.length,
      completed,
      results,
    };
  }

  /**
   * Deletes a recording session and its associated blob
   * @param sessionId - Recording session id
   * @returns Deletion summary
   */
  async deleteRecording(sessionId: string): Promise<{
    sessionId: string;
    blobPath?: string | null;
    blobDeleted: boolean;
    blobMissing: boolean;
    dbDeleted: boolean;
  }> {
    const session = await this.recordingRepository.findById(sessionId);
    if (!session) {
      throw new RecordingSessionNotFoundError("Recording session not found");
    }

    const blobPath =
      session.blobPath ?? tryParseBlobPathFromUrl(session.blobUrl) ?? null;

    let blobDeleted = false;
    let blobMissing = false;

    if (blobPath) {
      const deleted = await this.blobStorageService.deleteRecordingByPath(blobPath);
      blobDeleted = deleted;
      blobMissing = !deleted;
    } else {
      blobMissing = true;
    }

    await this.recordingRepository.deleteById(sessionId);

    return {
      sessionId,
      blobPath,
      blobDeleted,
      blobMissing,
      dbDeleted: true,
    };
  }
}

