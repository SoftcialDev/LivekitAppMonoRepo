/**
 * @fileoverview RecordingSessionApplicationService - Application service for recording session operations
 * @summary Orchestrates recording session lifecycle operations
 * @description Handles orchestration of recording session start, stop, and management operations
 */

import { EgressStatus, type EgressInfo } from "livekit-server-sdk";
import { getCentralAmericaTime } from '../../index';
import { tryParseBlobPathFromUrl } from '../../index';
import { RecordingStopStatus } from '../../index';
import { ILiveKitEgressClient } from '../../index';
import { IRecordingSessionRepository } from '../../index';
import { IBlobStorageService } from '../../index';
import { IBlobUrlService } from '../../index';
import { IRecordingErrorLogger } from '../../index';
import type { RecordingStopResult } from '../../index';
import { RecordingSessionNotFoundError } from '../../index';

/**
 * Extracts error details from EgressInfo or error object
 * @param info - EgressInfo object or error object
 * @returns Object with all available error context
 */
function extractEgressErrorDetails(info: any): {
  status?: string;
  statusDetail?: string;
  error?: string;
  errorMessage?: string;
  roomName?: string;
  roomId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  duration?: number;
  sourceType?: string;
  fileResults?: any;
  streamResults?: any;
  segmentResults?: any;
} {
  if (!info) return {};
  
  return {
    status: info.status || info.state || (info as any).egressStatus,
    statusDetail: info.statusDetail || (info as any).statusDetail,
    error: info.error || (info as any).error,
    errorMessage: info.errorMessage || (info as any).errorMessage || info.message,
    roomName: info.roomName || (info as any).roomName,
    roomId: info.roomId || (info as any).roomId,
    startedAt: info.startedAt || (info as any).startedAt || info.startedAtMs,
    endedAt: info.endedAt || (info as any).endedAt || info.endedAtMs,
    duration: info.duration || info.durationMs || (info as any).duration,
    sourceType: info.sourceType || (info as any).sourceType,
    fileResults: info.fileResults || (info as any).fileResults || (info as any).result?.fileResults,
    streamResults: info.streamResults || (info as any).streamResults,
    segmentResults: info.segmentResults || (info as any).segmentResults,
  };
}

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
    } catch (error: any) {
      if (sessionId) {
        try {
          await this.recordingRepository.fail(sessionId);
        } catch {
          // Failed to mark session as failed
        }
      }

      const errorDetails = extractEgressErrorDetails(error);
      const errorMessage = errorDetails.error || 
                          errorDetails.statusDetail || 
                          errorDetails.errorMessage ||
                          error?.message ||
                          'Failed to start recording egress';

      if (this.errorLogger) {
        await this.errorLogger.logError(
          {
            message: `Recording start failed: ${errorMessage}`,
            name: error?.name || 'RecordingStartError',
            stack: error?.stack,
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
          const errorMessage = errorDetails.error || 
                              errorDetails.statusDetail || 
                              'Egress failed during initialization';
          
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
  async findActiveSessions(userId: string): Promise<any[]> {
    const [byRoom, bySubject] = await Promise.all([
      this.recordingRepository.findActiveByRoom(userId),
      this.recordingRepository.findActiveBySubject(userId),
    ]);

    const map = new Map<string, any>();
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
    session: any,
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
      blobPath: (session as any).blobPath ?? undefined,
      blobUrl: finalUrl,
      sasUrl,
      roomName: session.roomName,
      initiatorUserId: session.userId,
      subjectUserId: (session as any).subjectUserId ?? null,
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
    session: any,
    egressError: string,
    clusterErrorDetails?: any
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
          subjectUserId: (session as any).subjectUserId,
          initiatorUserId: session.userId,
          egressStatus: clusterErrorDetails?.status || 'EGRESS_FAILED',
          egressError: egressError,
          clusterErrorDetails: clusterErrorDetails || undefined,
        }
      );
    }

    return {
      sessionId: session.id,
      egressId: session.egressId,
      status: RecordingStopStatus.Failed,
      blobPath: (session as any).blobPath ?? undefined,
      blobUrl: undefined,
      roomName: session.roomName,
      initiatorUserId: session.userId,
      subjectUserId: (session as any).subjectUserId ?? null,
    };
  }

  /**
   * Handles a recording session that was not found (disconnected)
   * @param session - Recording session
   * @returns RecordingStopResult for disconnected session
   */
  async handleDisconnectedSession(session: any): Promise<RecordingStopResult> {
    const blobUrl = (session as any).blobPath
      ? this.blobUrlService.buildBlobHttpsUrl((session as any).blobPath)
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
      blobPath: (session as any).blobPath ?? undefined,
      blobUrl: blobUrl ?? undefined,
      roomName: session.roomName,
      initiatorUserId: session.userId,
      subjectUserId: (session as any).subjectUserId ?? null,
    };
  }

  /**
   * Handles an error when stopping a recording session
   * @param session - Recording session
   * @param err - Error that occurred
   * @returns RecordingStopResult for failed session
   */
  async handleStopError(session: any, err: any): Promise<RecordingStopResult> {
    await this.recordingRepository.fail(session.id);

    const errorDetails = extractEgressErrorDetails(err);
    const egressErrorDetails = errorDetails.error || 
                              errorDetails.statusDetail || 
                              errorDetails.errorMessage ||
                              err.message;

    if (this.errorLogger) {
      await this.errorLogger.logError(
        {
          message: egressErrorDetails 
            ? `Recording stop failed: ${egressErrorDetails}` 
            : `Recording stop failed: ${err?.message || String(err)}`,
          name: err?.name || 'RecordingStopError',
          stack: err?.stack,
        },
        {
          sessionId: session.id,
          egressId: session.egressId,
          roomName: session.roomName,
          subjectUserId: (session as any).subjectUserId,
          initiatorUserId: session.userId,
          stopError: err?.message || String(err),
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
      blobPath: (session as any).blobPath ?? undefined,
      blobUrl: undefined,
      roomName: session.roomName,
      initiatorUserId: session.userId,
      subjectUserId: (session as any).subjectUserId ?? null,
    };
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
        let blobUrl: string | undefined;
        let egressError: string | undefined;
        let clusterErrorDetails: any;

        try {
          const egressInfo = await this.egressClient.getEgressInfo(session.egressId);
          if (egressInfo) {
            clusterErrorDetails = extractEgressErrorDetails(egressInfo);
          }
        } catch {
          // Failed to fetch cluster info
        }

        try {
          const stopResult = await this.egressClient.stopEgress(session.egressId);
          blobUrl = stopResult.blobUrl;
        } catch (err: any) {
          const message = err?.message?.toLowerCase?.() ?? "";
          
          if (message.includes("egress_failed") || message.includes("cannot be stopped")) {
            const errorDetails = extractEgressErrorDetails(err);
            
            if (clusterErrorDetails) {
              Object.assign(errorDetails, clusterErrorDetails);
            }
            
            egressError = errorDetails.error || 
                        errorDetails.statusDetail || 
                        errorDetails.errorMessage ||
                        err.message ||
                        'Egress failed but error details not available';
          } else {
            throw err;
          }
        }
        
        if (egressError) {
          const result = await this.handleFailedSession(session, egressError, clusterErrorDetails);
          results.push(result);
          continue;
        }

        const result = await this.handleCompletedSession(session, blobUrl, sasMinutes);
        completed += 1;
        results.push(result);
      } catch (err: any) {
        const message = err?.message?.toLowerCase?.() ?? "";
        const notFound = message.includes("not found") || message.includes("no active egress");
        
        if (notFound) {
          const result = await this.handleDisconnectedSession(session);
          results.push(result);
          continue;
        }

        const result = await this.handleStopError(session, err);
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
      (session as any).blobPath ?? tryParseBlobPathFromUrl(session.blobUrl) ?? null;

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

