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
import { config } from "../config";
import { nowCRIso } from "../utils/timezone";
import { buildBlobHttpsUrl, generateReadSasUrl } from "./blobSigner";
import { RecordingSessionRepository } from "../repositories/recordingSessionRepo";
import { blobService } from "./blobStorageService";

/**
 * Converts an arbitrary label into a URL/path-safe slug.
 *
 * @param input - Arbitrary string (e.g., username or email).
 * @returns Lowercased, hyphenated slug without diacritics.
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
 * Builds a UTC date prefix in `YYYY/MM/DD` format.
 *
 * @param d - Reference date (defaults to now).
 * @returns Date path segment.
 */
function datePrefixUTC(d: Date = new Date()): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

/**
 * Attempts to derive the relative blob path from a full Azure Blob URL
 * when it targets the configured account and container.
 *
 * @param url - Absolute blob URL.
 * @returns Relative blob path or null if it cannot be parsed safely.
 */
function tryParseBlobPathFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const expectedHost = `${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`;
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
 * Describes a recording session item enriched for UI playback.
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
  createdAt: Date;
  updatedAt?: Date | null;
  /**
   * Display name for the subject being recorded (resolved from roomName === user.id).
   * Falls back to subject email when display name is not available.
   */
  username?: string;
  /**
   * Display name for the user who started the recording (initiator; userId).
   * Falls back to initiator email when display name is not available.
   */
  recordedBy?: string;
  blobPath?: string | null;
  blobUrl?: string | null;
  playbackUrl?: string;
}

/**
 * Parameters for listing recording sessions.
 */
export interface ListRecordingsParams {
  roomName?: string;
  limit?: number;
  order?: "asc" | "desc";
  includeSas?: boolean;
  sasMinutes?: number;
}

/**
 * Service responsible for LiveKit egress control and persistence orchestration.
 *
 * Responsibilities:
 * - Start a room-composite egress targeting Azure Blob Storage.
 * - Persist session lifecycle changes via repositories.
 * - Stop ongoing egresses and finalize sessions.
 * - List sessions with derived playback URLs and durations.
 */
export class LiveKitRecordingService {
  /**
   * LiveKit Egress control client.
   */
  private static client = new EgressClient(
    config.livekitApiUrl,
    config.livekitApiKey,
    config.livekitApiSecret
  );

  /**
   * Starts a Room-Composite egress and uploads directly to Azure Blob Storage.
   *
   * Output key format: `{ownerSlug}/YYYY/MM/DD/{roomName}-{timestamp}.mp4`
   *
   * @param roomName - LiveKit room identifier.
   * @param ownerLabel - Human-friendly label used to build the folder prefix.
   * @returns Egress identifier and the relative blob path (object key).
   * @throws If required Azure variables are missing or the egress cannot start.
   */
  public static async startRecording(
    roomName: string,
    ownerLabel: string
  ): Promise<{ egressId: string; objectKey: string }> {
    const accountName = config.accountName
    const accountKey = config.accountKey
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

    const info = await this.client.startRoomCompositeEgress(roomName, outputs, opts);

    if (!info.egressId) {
      throw new Error("LiveKit did not return an egressId.");
    }

    return { egressId: info.egressId, objectKey };
  }

  /**
   * Starts a recording and persists an Active session row.
   *
   * @param args - Parameters required to create the session row.
   * @returns Operation details including egress id and blob path.
   */
  public static async startAndPersist(args: {
    roomName: string;
    subjectLabel: string;
    initiatorUserId: string;
    subjectUserId: string;
  }): Promise<{ roomName: string; egressId: string; blobPath: string }> {
    const { egressId, objectKey } = await this.startRecording(
      args.roomName,
      args.subjectLabel
    );

    await RecordingSessionRepository.createActive({
      roomName: args.roomName,
      egressId,
      userId: args.initiatorUserId,
      subjectUserId: args.subjectUserId,
      subjectLabel: args.subjectLabel,
      blobPath: objectKey,
      startedAt: nowCRIso(),
    });

    return { roomName: args.roomName, egressId, blobPath: objectKey };
  }

  /**
   * Stops an active egress.
   *
   * @param egressId - Identifier returned by {@link startRecording}.
   * @returns Raw egress info and, if reported by LiveKit, the destination URL.
   */
  public static async stopRecording(
    egressId: string
  ): Promise<{ info: EgressInfo; blobUrl?: string }> {
    const info = await this.client.stopEgress(egressId);

    const blobUrl =
      (info as any)?.fileResults?.[0]?.location ??
      (info as any)?.result?.fileResults?.[0]?.location ??
      (info as any)?.results?.[0]?.location ??
      undefined;

    return { info, blobUrl };
  }
/**
 * Stop recordings for the recorded user (subject).
 * If subjectUserId is not provided, falls back to roomName (common mapping).
 */
public static async stopAndPersist(args: {
  roomName: string;
  initiatorUserId: string;   // kept for compatibility; not used to scope the stop
  subjectUserId?: string;     // <-- pass this when you can
  sasMinutes?: number;
}) {
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
 * Deletes a recording: removes the blob in Azure (if present) and deletes the DB row.
 *
 * Rules:
 * - Uses `blobPath` when available; otherwise tries to derive from `blobUrl` if it points
   *   to the configured storage account and container.
   * - If the blob does not exist, the DB row is still deleted.
   *
   * @param sessionId - Recording session id.
   * @returns Deletion summary including whether the blob was deleted or missing.
   * @throws When the session does not exist.
   */
  public static async deleteRecordingById(sessionId: string): Promise<{
    sessionId: string;
    blobPath?: string | null;
    blobDeleted: boolean;
    blobMissing: boolean;
    dbDeleted: boolean;
  }> {
    const session = await RecordingSessionRepository.findById(sessionId);
    if (!session) {
      throw new Error("Recording session not found");
    }

    const blobPath =
      (session as any).blobPath ?? tryParseBlobPathFromUrl(session.blobUrl) ?? null;

    let blobDeleted = false;
    let blobMissing = false;

    if (blobPath) {
      const deleted = await blobService.deleteRecordingByPath(blobPath);
      blobDeleted = deleted;
      blobMissing = !deleted;
    } else {
      blobMissing = true;
    }

    await RecordingSessionRepository.deleteById(sessionId);

    return {
      sessionId,
      blobPath,
      blobDeleted,
      blobMissing,
      dbDeleted: true,
    };
  }

  /**
 * Lists recording sessions with derived fields for UI playback, including duration and
 * optional SAS playback URL.
 *
 * Adds:
 * - `username`: subject display name (resolved from roomName === user.id).
 * - `recordedBy`: initiator display name (resolved from userId).
 *
 * @param params - Optional filters and output controls.
 * @returns Array of items extended with `duration` (seconds).
 */
  public static async listRecordings(
  params: ListRecordingsParams = {}
): Promise<Array<RecordingListItem & { duration: number }>> {
  const {
    roomName,
    limit = 50,
    order = "desc",
    includeSas = true,
    sasMinutes = 60,
  } = params;

  const safeLimit = Math.min(Math.max(limit, 1), 200);
  const orderBy = order === "asc" ? "asc" : "desc";

  const sessions = await RecordingSessionRepository.list({
    roomName,
    limit: safeLimit,
    orderByCreatedAt: orderBy,
  });

  if (!sessions.length) return [];

  // Collect both: subjects (roomName) and initiators (userId)
  const subjectIds = sessions.map((s) => s.roomName).filter(Boolean) as string[];
  const initiatorIds = sessions.map((s) => s.userId).filter(Boolean) as string[];
  const uniqueIds = Array.from(new Set([...subjectIds, ...initiatorIds]));

  const users = await RecordingSessionRepository.getUsersByIds(uniqueIds);
  const userMap = new Map(users.map((u) => [u.id, u]));

  return sessions.map((s) => {
    // Subject (person being recorded)
    const subject = s.roomName ? userMap.get(s.roomName) : undefined;
    const username = subject?.fullName || subject?.email || undefined;

    // Initiator (who started the recording)
    const initiator = userMap.get(s.userId);
    const recordedBy = initiator?.fullName || initiator?.email || undefined;

    const plainUrl =
      s.blobUrl || ((s as any).blobPath ? buildBlobHttpsUrl((s as any).blobPath) : undefined);

    const playbackUrl =
      includeSas && (s as any).blobPath
        ? generateReadSasUrl((s as any).blobPath, Math.max(sasMinutes, 1))
        : plainUrl;

    const startedAtIso: string =
      (s as any).startedAt
        ? String((s as any).startedAt)
        : s.createdAt instanceof Date
        ? s.createdAt.toISOString()
        : String(s.createdAt);

    const stoppedAtIso: string | null =
      (s as any).stoppedAt ? String((s as any).stoppedAt) : null;

    const effectiveEndIso = stoppedAtIso ?? nowCRIso();

    const startMs = Date.parse(startedAtIso);
    const endMs = Date.parse(effectiveEndIso);
    const duration =
      !Number.isNaN(startMs) && !Number.isNaN(endMs)
        ? Math.max(0, Math.floor((endMs - startMs) / 1000))
        : 0;

    return {
      id: s.id,
      roomName: s.roomName,
      roomId: (s as any).roomId ?? s.roomName,
      egressId: s.egressId,
      userId: s.userId,
      status: String(s.status),
      startedAt: startedAtIso,
      stoppedAt: stoppedAtIso ?? null,
      createdAt: s.createdAt,
      updatedAt: (s as any).updatedAt ?? null,
      username,         
      recordedBy,     
      blobPath: (s as any).blobPath ?? null,
      blobUrl: s.blobUrl ?? null,
      playbackUrl,
      duration,
    };
  });
}
/**
 * Stops all active recordings for the RECORDED USER (subject).
 *
 * Aggregates active sessions where the recorded user is:
 *  - the subject (subjectUserId), and
 *  - (defensive) the room owner when roomName === userId.
 *
 * For each session, it calls LiveKit stop, marks Completed/Failed,
 * and returns UI-ready results, including optional short-lived SAS URLs.
 *
 * @param userId     - The RECORDED user's id (subject).
 * @param sasMinutes - SAS validity for generated playback URLs (default 60).
 */
public static async stopAllForUser(
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
  // ✅ Only fetch sessions where this user is the SUBJECT,
  //    plus the common mapping where roomName === userId.
  const [byRoom, bySubject] = await Promise.all([
    RecordingSessionRepository.findActiveByRoom(userId),
    RecordingSessionRepository.findActiveBySubject(userId),
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

      await RecordingSessionRepository.complete(session.id, finalUrl ?? null, nowCRIso());

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
      await RecordingSessionRepository.fail(session.id);
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

}

