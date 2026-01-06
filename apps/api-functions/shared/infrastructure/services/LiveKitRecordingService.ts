/**
 * @fileoverview LiveKitRecordingService - Infrastructure service for LiveKit recording operations
 * @summary Handles LiveKit recording start/stop operations
 * @description Service for managing LiveKit recording sessions with Azure Blob Storage integration
 */

import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  AzureBlobUpload,
  type EncodedOutputs,
  type EgressInfo,
  EgressStatus,
  EncodingOptions,
  type RoomCompositeOptions,
} from "livekit-server-sdk";
import { config } from '../../config';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { buildBlobHttpsUrl, generateReadSasUrl } from './blobSigner';
import { IRecordingSessionRepository } from '../../domain/interfaces/IRecordingSessionRepository';
import { IBlobStorageService } from '../../domain/interfaces/IBlobStorageService';
import { IErrorLogService } from '../../domain/interfaces/IErrorLogService';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { ErrorSource } from '../../domain/enums/ErrorSource';
import { ErrorSeverity } from '../../domain/enums/ErrorSeverity';

/**
 * Converts an arbitrary label into a URL/path-safe slug
 */
function slugify(input: string): string {
  return (input || "user")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Builds a UTC date prefix in `YYYY/MM/DD` format
 */
function datePrefixUTC(d: Date = new Date()): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

/**
 * Attempts to derive the relative blob path from a full Azure Blob URL
 */
function tryParseBlobPathFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const expectedHost = `${config.accountName}.blob.core.windows.net`;
    if (u.hostname !== expectedHost) return null;

    const container = process.env.RECORDINGS_CONTAINER_NAME || "recordings";
    const parts = u.pathname.replace(/^\/+/, "").split("/");
    if (parts.shift() !== container) return null;

    return decodeURI(parts.join("/"));
  } catch {
    return null;
  }
}

/**
 * Interface for recording start result
 */
export interface RecordingStartResult {
  sessionId: string;
  egressId: string;
  status: 'STARTED' | 'FAILED';
  blobPath: string;
  blobUrl: string;
}

/**
 * Interface for recording stop result
 */
export interface RecordingStopResult {
  sessionId: string;
  egressId: string;
  status: 'STOPPED' | 'FAILED';
  blobPath: string;
  blobUrl: string;
  sasUrl?: string;
}

/**
 * Interface for recording summary
 */
export interface RecordingSummary {
  results: RecordingStopResult[];
}

/**
 * Infrastructure service for LiveKit recording operations
 */
export class LiveKitRecordingService {
  private readonly egressClient: EgressClient;
  private readonly recordingRepository: IRecordingSessionRepository;
  private readonly blobStorageService: IBlobStorageService;
  private readonly errorLogService?: IErrorLogService;
  private readonly userRepository?: IUserRepository;

  constructor(
    recordingRepository: IRecordingSessionRepository,
    blobStorageService: IBlobStorageService,
    errorLogService?: IErrorLogService,
    userRepository?: IUserRepository
  ) {
    this.egressClient = new EgressClient(
      config.livekitApiUrl,
      config.livekitApiKey,
      config.livekitApiSecret
    );
    this.recordingRepository = recordingRepository;
    this.blobStorageService = blobStorageService;
    this.errorLogService = errorLogService;
    this.userRepository = userRepository;
  }

  /**
   * Starts a participant-only egress and uploads directly to Azure Blob Storage.
   * Uses the room name as the participant identity to capture only the PSO feed.
   *
   * @param roomName - LiveKit room (and participant identity) to record
   * @param ownerLabel - Human-friendly label used to build the folder prefix
   * @returns Egress identifier and the relative blob path (object key)
   */
  private async startRecording(
    roomName: string,
    ownerLabel: string
  ): Promise<{ egressId: string; objectKey: string }> {
    const accountName = config.accountName?.trim();
    const accountKey = config.accountKey?.trim();
    const containerName = process.env.RECORDINGS_CONTAINER_NAME || "recordings";

    // Diagnostic logging (partial values for security)
    const accountNamePreview = accountName 
      ? `${accountName.substring(0, 4)}...${accountName.substring(accountName.length - 4)} (length: ${accountName.length})`
      : 'MISSING';
    const accountKeyPreview = accountKey 
      ? `${accountKey.substring(0, 8)}...${accountKey.substring(accountKey.length - 8)} (length: ${accountKey.length})`
      : 'MISSING';
    
    console.log('[LiveKitRecordingService] Azure Storage credentials preview:', {
      accountName: accountNamePreview,
      accountKey: accountKeyPreview,
      containerName,
      accountNameHasValue: !!accountName,
      accountKeyHasValue: !!accountKey,
      accountNameType: typeof accountName,
      accountKeyType: typeof accountKey,
    });

    if (!accountName || !accountKey) {
      throw new Error(
        "AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY are required for direct Azure upload."
      );
    }

    // Validate accountKey is valid base64
    let validatedAccountKey = accountKey;
    let base64ValidationError: string | null = null;
    try {
      // Try to decode as base64 to validate
      const decoded = Buffer.from(accountKey, 'base64');
      console.log('[LiveKitRecordingService] Account key base64 validation: SUCCESS', {
        decodedLength: decoded.length,
        firstBytes: Array.from(decoded.slice(0, 4)).map(b => b.toString(16)).join(' '),
      });
    } catch (base64Error) {
      base64ValidationError = base64Error instanceof Error ? base64Error.message : String(base64Error);
      console.error('[LiveKitRecordingService] Account key base64 validation: FAILED', {
        error: base64ValidationError,
        keyPreview: accountKeyPreview,
        keyFirstChars: accountKey.substring(0, 20),
        keyLastChars: accountKey.substring(accountKey.length - 20),
      });
      
      // If it's not base64, it might be a connection string or raw key
      // Check if it looks like a connection string
      if (accountKey.includes('AccountKey=')) {
        throw new Error(
          "AZURE_STORAGE_KEY appears to be a connection string. Please provide only the account key (base64 encoded)."
        );
      }
      // If it's not base64 and not a connection string, try encoding it
      // Some Azure keys might be provided as plain text
      try {
        validatedAccountKey = Buffer.from(accountKey).toString('base64');
        console.log('[LiveKitRecordingService] Account key re-encoded to base64', {
          originalLength: accountKey.length,
          encodedLength: validatedAccountKey.length,
        });
      } catch {
        throw new Error(
          `AZURE_STORAGE_KEY is not valid base64. Error: ${base64ValidationError}`
        );
      }
    }

    const ownerSlug = slugify(ownerLabel);
    const prefix = `${ownerSlug}/${datePrefixUTC()}`;
    const objectKey = `${prefix}/${roomName}-${Date.now()}.mp4`;

    const fileOutput = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: objectKey,
      output: {
        case: "azure",
        value: new AzureBlobUpload({
          accountName: accountName,
          accountKey: validatedAccountKey,
          containerName: containerName,
        }),
      },
    });

    const outputs: EncodedOutputs = { file: fileOutput };

    const opts: Partial<RoomCompositeOptions> = {
      audioOnly: false,
      videoOnly: false,
      encodingOptions: new EncodingOptions({
        width: 854,
        height: 480,
        framerate: 24,
        videoBitrate: 800,
        audioBitrate: 48,
        keyFrameInterval: 2,
      }),
    };

    const info = await this.egressClient.startParticipantEgress(
      roomName,
      roomName, // participant identity == roomName (PSO)
      outputs,
      opts as any
    );

    if (!info.egressId) {
      throw new Error("LiveKit did not return an egressId.");
    }

    return { egressId: info.egressId, objectKey };
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
    let egressId: string | undefined;
    let objectKey: string | undefined;
    let sessionId: string | null = null;

    try {
      const result = await this.startRecording(
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

      setTimeout(async () => {
        try {
          if (!egressId) return;
          
          const egressInfo = await this.getEgressInfo(egressId);
          if (egressInfo && (egressInfo.status === EgressStatus.EGRESS_FAILED || egressInfo.status === EgressStatus.EGRESS_ABORTED)) {
            const errorDetails = this.extractEgressErrorDetails(egressInfo);
            const errorMessage = errorDetails.error || 
                                errorDetails.statusDetail || 
                                'Egress failed during initialization';
            
            if (sessionId) {
              await this.recordingRepository.fail(sessionId);
            }

            if (this.errorLogService) {
              let subjectUserEmail: string | undefined;
              if (this.userRepository) {
                try {
                  const subjectUser = await this.userRepository.findById(args.subjectUserId);
                  subjectUserEmail = subjectUser?.email;
                } catch (userError) {
                  console.warn('[LiveKitRecordingService] Failed to fetch subject user email for error logging:', userError);
                }
              }

              const errorObj = new Error(`Recording egress failed during start: ${errorMessage}`);
              errorObj.name = 'EgressStartFailed';

              await this.errorLogService.logError({
                source: ErrorSource.Recording,
                severity: ErrorSeverity.High,
                endpoint: '/api/recording',
                functionName: 'LivekitRecordingFunction',
                error: errorObj,
                userId: args.initiatorUserId,
                userEmail: subjectUserEmail,
                context: {
                  sessionId: sessionId,
                  egressId: egressId,
                  roomName: args.roomName,
                  subjectUserId: args.subjectUserId,
                  egressStatus: egressInfo.status,
                  clusterErrorDetails: errorDetails,
                  failureReason: 'Egress failed during initialization after start',
                  ...errorDetails,
                }
              });
            }
          }
        } catch (checkError) {
          console.warn('[LiveKitRecordingService] Failed to check egress status after start:', checkError);
        }
      }, 5000);

      return { roomName: args.roomName, egressId, blobPath: objectKey };
    } catch (error: any) {
      if (sessionId) {
        try {
          await this.recordingRepository.fail(sessionId);
        } catch (failError) {
          console.error('[LiveKitRecordingService] Failed to mark session as failed:', failError);
        }
      }

      if (this.errorLogService) {
        try {
          let subjectUserEmail: string | undefined;
          if (this.userRepository) {
            try {
              const subjectUser = await this.userRepository.findById(args.subjectUserId);
              subjectUserEmail = subjectUser?.email;
            } catch (userError) {
              console.warn('[LiveKitRecordingService] Failed to fetch subject user email for error logging:', userError);
            }
          }

          const errorDetails = this.extractEgressErrorDetails(error);
          const errorMessage = errorDetails.error || 
                              errorDetails.statusDetail || 
                              errorDetails.errorMessage ||
                              error?.message ||
                              'Failed to start recording egress';

          const errorObj = new Error(`Recording start failed: ${errorMessage}`);
          errorObj.name = error?.name || 'RecordingStartError';
          if (error?.stack) errorObj.stack = error.stack;

          const isBase64Error = errorMessage.toLowerCase().includes('base64') || 
                               errorMessage.toLowerCase().includes('illegal');
          
          const diagnosticContext: Record<string, unknown> = {
            sessionId: sessionId || undefined,
            egressId: egressId || undefined,
            roomName: args.roomName,
            subjectUserId: args.subjectUserId,
            failureReason: 'Failed to start egress',
            startError: error?.message || String(error),
            isBase64Error: isBase64Error,
            ...errorDetails,
          };

          if (isBase64Error) {
            diagnosticContext.credentialChecks = {
              hasAccountName: !!config.accountName,
              hasAccountKey: !!config.accountKey,
              accountNameLength: config.accountName?.length || 0,
              accountKeyLength: config.accountKey?.length || 0,
              accountKeyFirstChars: config.accountKey?.substring(0, 10) || 'N/A',
              hasLiveKitApiKey: !!config.livekitApiKey,
              hasLiveKitApiSecret: !!config.livekitApiSecret,
              liveKitApiKeyLength: config.livekitApiKey?.length || 0,
              liveKitApiSecretLength: config.livekitApiSecret?.length || 0,
            };
            
            if (config.accountKey) {
              try {
                Buffer.from(config.accountKey, 'base64');
                diagnosticContext.accountKeyIsValidBase64 = true;
              } catch {
                diagnosticContext.accountKeyIsValidBase64 = false;
                diagnosticContext.accountKeyBase64Error = 'Account key is not valid base64';
              }
            }
          }

          await this.errorLogService.logError({
            source: ErrorSource.Recording,
            severity: ErrorSeverity.High,
            endpoint: '/api/recording',
            functionName: 'LivekitRecordingFunction',
            error: errorObj,
            userId: args.initiatorUserId,
            userEmail: subjectUserEmail,
            context: diagnosticContext
          });
        } catch (logError) {
          console.warn('[LiveKitRecordingService] Failed to log recording start failure to error logs:', logError);
        }
      }

      throw error;
    }
  }

  /**
   * Gets the current status of an egress from LiveKit cluster
   * @param egressId - Identifier of the egress
   * @returns EgressInfo with current status and details, or null if not found
   */
  private async getEgressInfo(egressId: string): Promise<EgressInfo | null> {
    try {
      let egressList: any;
      
      try {
        egressList = await (this.egressClient as any).listEgress({ egressId });
      } catch {
        try {
          egressList = await (this.egressClient as any).listEgress();
        } catch {
          return null;
        }
      }
      
      const items = egressList?.items || egressList || [];
      
      if (Array.isArray(items)) {
        const matching = items.find((item: any) => 
          item.egressId === egressId || 
          (item as any).id === egressId ||
          item.egress_id === egressId
        );
        if (matching) return matching as EgressInfo;
      } else if (items.egressId === egressId || (items as any).id === egressId) {
        return items as EgressInfo;
      }
      
      return null;
    } catch (err: any) {
      console.warn(`[LiveKitRecordingService] Failed to get egress info for ${egressId}:`, err?.message || String(err));
      return null;
    }
  }

  /**
   * Extracts comprehensive error details from EgressInfo or error object
   * @param info - EgressInfo object or error object
   * @returns Object with all available error context
   */
  private extractEgressErrorDetails(info: any): {
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
    rawInfo?: any;
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
      rawInfo: info,
    };
  }

  /**
   * Stops an active egress
   * @param egressId - Identifier returned by startRecording
   * @returns Raw egress info and, if reported by LiveKit, the destination URL
   */
  private async stopRecording(
    egressId: string
  ): Promise<{ info: EgressInfo; blobUrl?: string; egressError?: string; clusterErrorDetails?: any }> {
    let clusterInfo: EgressInfo | null = null;
    let clusterErrorDetails: any = null;
    
    try {
      clusterInfo = await this.getEgressInfo(egressId);
      if (clusterInfo) {
        clusterErrorDetails = this.extractEgressErrorDetails(clusterInfo);
      }
    } catch (clusterErr) {
      console.warn(`[LiveKitRecordingService] Could not fetch egress info from cluster before stop:`, clusterErr);
    }

    try {
      const info = await this.egressClient.stopEgress(egressId);

      const blobUrl =
        (info as any)?.fileResults?.[0]?.location ??
        (info as any)?.result?.fileResults?.[0]?.location ??
        (info as any)?.results?.[0]?.location ??
        undefined;

      return { info, blobUrl, clusterErrorDetails };
    } catch (err: any) {
      const message = err?.message?.toLowerCase?.() ?? "";
      
      if (message.includes("egress_failed") || message.includes("cannot be stopped")) {
        const errorDetails = this.extractEgressErrorDetails(err);
        
        if (clusterErrorDetails) {
          Object.assign(errorDetails, clusterErrorDetails);
        }
        
        const errorMessage = errorDetails.error || 
                            errorDetails.statusDetail || 
                            errorDetails.errorMessage ||
                            err.message ||
                            'Egress failed but error details not available';
        
        return {
          info: (err as any).info || clusterInfo || (err as any),
          blobUrl: undefined,
          egressError: errorMessage,
          clusterErrorDetails: errorDetails
        };
      }
      
      throw err;
    }
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
      status: "Completed" | "Completed (disconnection)" | "Failed";
      blobPath?: string;
      blobUrl?: string;
      sasUrl?: string;
    }>;
    sasUrl?: string;
  }> {
    const { roomName, subjectUserId, sasMinutes = 60 } = args;
    const targetSubjectId = subjectUserId || roomName;
    const { message, results } = await this.stopAllForUser(targetSubjectId, sasMinutes);

    if (!results.length) throw new Error("No active recordings found for this subject");

    const singleSas = results.length === 1 && results[0].status === "Completed" ? results[0].sasUrl : undefined;

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
  ): Promise<{
    message: string;
    total: number;
    completed: number;
    results: Array<{
      sessionId: string;
      egressId: string;
      status: "Completed" | "Completed (disconnection)" | "Failed";
      blobPath?: string;
      blobUrl?: string;
      sasUrl?: string;
      roomName: string;
      initiatorUserId: string;
      subjectUserId?: string | null;
    }>;
  }> {
    const [byRoom, bySubject] = await Promise.all([
      this.recordingRepository.findActiveByRoom(userId),
      this.recordingRepository.findActiveBySubject(userId),
    ]);

    const map = new Map<string, any>();
    for (const s of [...byRoom, ...bySubject]) map.set(s.id, s);
    const sessions = Array.from(map.values());

    if (!sessions.length) {
      return { message: "No active recordings to stop", total: 0, completed: 0, results: [] };
    }

    const results: Array<{
      sessionId: string;
      egressId: string;
      status: "Completed" | "Completed (disconnection)" | "Failed";
      blobPath?: string;
      blobUrl?: string;
      sasUrl?: string;
      roomName: string;
      initiatorUserId: string;
      subjectUserId?: string | null;
    }> = [];

    let completed = 0;

    for (const session of sessions) {
      try {
        const { blobUrl, egressError, clusterErrorDetails } = await this.stopRecording(session.egressId);
        
        if (egressError) {
          await this.recordingRepository.fail(session.id);
          
          let subjectUserEmail: string | undefined;
          if (this.userRepository && (session as any).subjectUserId) {
            try {
              const subjectUser = await this.userRepository.findById((session as any).subjectUserId);
              subjectUserEmail = subjectUser?.email;
            } catch (userError) {
              console.warn('[LiveKitRecordingService] Failed to fetch subject user email for error logging:', userError);
            }
          }

          const errorMessage = `Recording egress failed: ${egressError}`;
          const errorObj = new Error(errorMessage);
          errorObj.name = 'EgressFailed';

          if (this.errorLogService) {
            try {
              const errorContext: Record<string, unknown> = {
                sessionId: session.id,
                egressId: session.egressId,
                roomName: session.roomName,
                subjectUserId: (session as any).subjectUserId,
                egressStatus: clusterErrorDetails?.status || 'EGRESS_FAILED',
                egressError: egressError,
                failureReason: 'Egress failed before stop attempt',
              };

              if (clusterErrorDetails) {
                errorContext.clusterErrorDetails = clusterErrorDetails;
                if (clusterErrorDetails.statusDetail) {
                  errorContext.statusDetail = clusterErrorDetails.statusDetail;
                }
                if (clusterErrorDetails.error) {
                  errorContext.clusterError = clusterErrorDetails.error;
                }
                if (clusterErrorDetails.roomId) {
                  errorContext.roomId = clusterErrorDetails.roomId;
                }
                if (clusterErrorDetails.sourceType) {
                  errorContext.sourceType = clusterErrorDetails.sourceType;
                }
                if (clusterErrorDetails.startedAt) {
                  errorContext.startedAt = clusterErrorDetails.startedAt;
                }
                if (clusterErrorDetails.endedAt) {
                  errorContext.endedAt = clusterErrorDetails.endedAt;
                }
                if (clusterErrorDetails.duration !== undefined) {
                  errorContext.duration = clusterErrorDetails.duration;
                }
              }

              await this.errorLogService.logError({
                source: ErrorSource.Recording,
                severity: ErrorSeverity.High,
                endpoint: '/api/recording',
                functionName: 'LivekitRecordingFunction',
                error: errorObj,
                userId: session.userId,
                userEmail: subjectUserEmail,
                context: errorContext
              });
            } catch (logErr) {
              console.error(`[LiveKitRecordingService] Failed to log recording failure to error logs: ${logErr instanceof Error ? logErr.message : String(logErr)}`);
            }
          }

          results.push({
            sessionId: session.id,
            egressId: session.egressId,
            status: "Failed",
            roomName: session.roomName,
            initiatorUserId: session.userId,
            subjectUserId: (session as any).subjectUserId ?? null,
          });
          continue;
        }

        const finalUrl =
          blobUrl || (session.blobPath ? buildBlobHttpsUrl(session.blobPath) : undefined);

        await this.recordingRepository.complete(session.id, finalUrl ?? null, getCentralAmericaTime().toISOString());

        const sasUrl = session.blobPath
          ? generateReadSasUrl(session.blobPath, Math.max(1, sasMinutes))
          : undefined;

        completed += 1;
        results.push({
          sessionId: session.id,
          egressId: session.egressId,
          status: "Completed",
          blobPath: (session as any).blobPath ?? undefined,
          blobUrl: finalUrl,
          sasUrl,
          roomName: session.roomName,
          initiatorUserId: session.userId,
          subjectUserId: (session as any).subjectUserId ?? null,
        });
      } catch (err: any) {
        const message = err?.message?.toLowerCase?.() ?? "";
        const notFound = message.includes("not found") || message.includes("no active egress");
        if (notFound) {
          await this.recordingRepository.complete(
            session.id,
            (session as any).blobPath ? buildBlobHttpsUrl((session as any).blobPath) : null,
            getCentralAmericaTime().toISOString()
          );
          results.push({
            sessionId: session.id,
            egressId: session.egressId,
            status: "Completed (disconnection)",
            blobPath: (session as any).blobPath ?? undefined,
            blobUrl: (session as any).blobPath ? buildBlobHttpsUrl((session as any).blobPath) : undefined,
            sasUrl: undefined,
            roomName: session.roomName,
            initiatorUserId: session.userId,
            subjectUserId: (session as any).subjectUserId ?? null,
          });
          continue;
        }

        await this.recordingRepository.fail(session.id);
        
        let subjectUserEmail: string | undefined;
        if (this.userRepository && (session as any).subjectUserId) {
          try {
            const subjectUser = await this.userRepository.findById((session as any).subjectUserId);
            subjectUserEmail = subjectUser?.email;
          } catch (userError) {
            console.warn('[LiveKitRecordingService] Failed to fetch subject user email for error logging:', userError);
          }
        }

        const errorDetails = this.extractEgressErrorDetails(err);
        const egressErrorDetails = errorDetails.error || 
                                  errorDetails.statusDetail || 
                                  errorDetails.errorMessage ||
                                  err.message;
        const egressStatus = errorDetails.status || 'UNKNOWN';

        if (this.errorLogService) {
          try {
            const errorMessage = egressErrorDetails 
              ? `Recording stop failed: ${egressErrorDetails}` 
              : `Recording stop failed: ${err?.message || String(err)}`;
            const errorObj = new Error(errorMessage);
            errorObj.name = err?.name || 'RecordingStopError';
            if (err?.stack) errorObj.stack = err.stack;

            const errorContext: Record<string, unknown> = {
              sessionId: session.id,
              egressId: session.egressId,
              roomName: session.roomName,
              subjectUserId: (session as any).subjectUserId,
              initiatorUserId: session.userId,
              stopError: err?.message || String(err),
              egressStatus: egressStatus,
              egressError: egressErrorDetails,
              failureReason: egressErrorDetails ? 'Egress failed with error' : 'Failed to stop egress',
            };

            if (errorDetails) {
              errorContext.clusterErrorDetails = errorDetails;
              if (errorDetails.statusDetail) {
                errorContext.statusDetail = errorDetails.statusDetail;
              }
              if (errorDetails.roomId) {
                errorContext.roomId = errorDetails.roomId;
              }
              if (errorDetails.sourceType) {
                errorContext.sourceType = errorDetails.sourceType;
              }
              if (errorDetails.startedAt) {
                errorContext.startedAt = errorDetails.startedAt;
              }
              if (errorDetails.endedAt) {
                errorContext.endedAt = errorDetails.endedAt;
              }
              if (errorDetails.duration !== undefined) {
                errorContext.duration = errorDetails.duration;
              }
            }

            await this.errorLogService.logError({
              source: ErrorSource.Recording,
              severity: ErrorSeverity.High,
              endpoint: '/api/recording',
              functionName: 'LivekitRecordingFunction',
              error: errorObj,
              userId: session.userId,
              userEmail: subjectUserEmail,
              context: errorContext
            });
          } catch (logError) {
            console.warn('[LiveKitRecordingService] Failed to log recording failure to error logs:', logError);
          }
        }

        results.push({
          sessionId: session.id,
          egressId: session.egressId,
          status: "Failed",
          roomName: session.roomName,
          initiatorUserId: session.userId,
          subjectUserId: (session as any).subjectUserId ?? null,
        });
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
    const session = await this.recordingRepository.findById(sessionId);
    if (!session) {
      throw new Error("Recording session not found");
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
