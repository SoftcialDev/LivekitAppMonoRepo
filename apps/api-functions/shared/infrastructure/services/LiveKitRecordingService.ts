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
  EncodingOptions,
  type RoomCompositeOptions,
} from "livekit-server-sdk";
import { config } from '../../config';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { buildBlobHttpsUrl, generateReadSasUrl } from './blobSigner';
import { IRecordingSessionRepository } from '../../domain/interfaces/IRecordingSessionRepository';
import { IBlobStorageService } from '../../domain/interfaces/IBlobStorageService';

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

  constructor(
    recordingRepository: IRecordingSessionRepository,
    blobStorageService: IBlobStorageService
  ) {
    this.egressClient = new EgressClient(
      config.livekitApiUrl,
      config.livekitApiKey,
      config.livekitApiSecret
    );
    this.recordingRepository = recordingRepository;
    this.blobStorageService = blobStorageService;
  }

  /**
   * Starts a Room-Composite egress and uploads directly to Azure Blob Storage
   * @param roomName - LiveKit room identifier
   * @param ownerLabel - Human-friendly label used to build the folder prefix
   * @returns Egress identifier and the relative blob path (object key)
   */
  private async startRecording(
    roomName: string,
    ownerLabel: string
  ): Promise<{ egressId: string; objectKey: string }> {
    const accountName = config.accountName;
    const accountKey = config.accountKey;
    const containerName = process.env.RECORDINGS_CONTAINER_NAME || "recordings";

    if (!accountName || !accountKey) {
      throw new Error(
        "AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY are required for direct Azure upload."
      );
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
          accountName,
          accountKey,
          containerName,
        }),
      },
    });

    const outputs: EncodedOutputs = { file: fileOutput };

    const opts: RoomCompositeOptions = {
      layout: "speaker-dark",
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

    const info = await this.egressClient.startRoomCompositeEgress(roomName, outputs, opts);

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
    const { egressId, objectKey } = await this.startRecording(
      args.roomName,
      args.subjectLabel
    );

    await this.recordingRepository.createActive({
      roomName: args.roomName,
      egressId,
      userId: args.initiatorUserId,
      subjectUserId: args.subjectUserId,
      subjectLabel: args.subjectLabel,
      blobPath: objectKey,
      startedAt: getCentralAmericaTime().toISOString(),
    });

    return { roomName: args.roomName, egressId, blobPath: objectKey };
  }

  /**
   * Stops an active egress
   * @param egressId - Identifier returned by startRecording
   * @returns Raw egress info and, if reported by LiveKit, the destination URL
   */
  private async stopRecording(
    egressId: string
  ): Promise<{ info: EgressInfo; blobUrl?: string }> {
    const info = await this.egressClient.stopEgress(egressId);

    const blobUrl =
      (info as any)?.fileResults?.[0]?.location ??
      (info as any)?.result?.fileResults?.[0]?.location ??
      (info as any)?.results?.[0]?.location ??
      undefined;

    return { info, blobUrl };
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
      status: "Completed" | "Failed";
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

    const singleSas =
      results.length === 1 && results[0].status === "Completed" ? results[0].sasUrl : undefined;

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
      status: "Completed" | "Failed";
      blobPath?: string;
      blobUrl?: string;
      sasUrl?: string;
      roomName: string;
      initiatorUserId: string;
      subjectUserId?: string | null;
    }>;
  }> {
    // Find active sessions where this user is the SUBJECT
    const [byRoom, bySubject] = await Promise.all([
      this.recordingRepository.findActiveByRoom(userId),
      this.recordingRepository.findActiveBySubject(userId),
    ]);

    // De-duplicate by id
    const map = new Map<string, any>();
    for (const s of [...byRoom, ...bySubject]) map.set(s.id, s);
    const sessions = Array.from(map.values());

    if (!sessions.length) {
      return { message: "No active recordings to stop", total: 0, completed: 0, results: [] };
    }

    const results: Array<{
      sessionId: string;
      egressId: string;
      status: "Completed" | "Failed";
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
        const { blobUrl } = await this.stopRecording(session.egressId);
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
      } catch {
        await this.recordingRepository.fail(session.id);
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
