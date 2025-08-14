import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';
import { config } from '../config';

/**
 * Error thrown when a LiveKit service operation fails unexpectedly.
 * Wraps the original error and exposes any HTTP status code or details.
 */
export class LiveKitServiceError extends Error {
  /** HTTP status code returned by the LiveKit API, if available. */
  public readonly code?: number;
  /** Any additional error details or payload. */
  public readonly details?: unknown;

  /**
   * @param message – Human-readable description of what went wrong.
   * @param code – HTTP status code (e.g. 500, 404) if returned by LiveKit.
   * @param details – Raw error payload or object for deeper inspection.
   */
  constructor(message: string, code?: number, details?: unknown) {
    super(message);
    this.name = 'LiveKitServiceError';
    this.code = code;
    this.details = details;
  }
}

/** 
 * LiveKit admin client for interacting with the REST API.
 * @internal
 */
const adminClient = new RoomServiceClient(
  config.livekitApiUrl,
  config.livekitApiKey,
  config.livekitApiSecret,
);

/**
 * Ensures that a LiveKit room exists with no auto-delete timeout.
 * If a room with the given name already exists, the 409 Conflict error is ignored.
 *
 * @param roomName - The unique name for the room to create or verify.
 * @returns A promise that resolves once the room is ensured to exist.
 * @throws LiveKitServiceError for any error other than HTTP 409.
 */
export async function ensureRoom(roomName: string): Promise<void> {
  console.debug(`[LiveKit] ensureRoom: creating room "${roomName}"`);
  try {
    await adminClient.createRoom({ name: roomName, emptyTimeout: 0 });
    console.info(`[LiveKit] ensureRoom: room "${roomName}" created`);
  } catch (err: any) {
    const code = err.code ?? err.statusCode ?? err.status;
    if (code === 409) {
      console.warn(`[LiveKit] ensureRoom: room "${roomName}" already exists (409)`);
      return;
    }
    console.error(`[LiveKit] ensureRoom: unexpected error for "${roomName}"`, {
      message: err.message,
      code,
      details: err.data ?? err.details ?? err,
    });
    throw new LiveKitServiceError(
      `Failed to ensure room "${roomName}": ${err.message}`,
      code,
      err,
    );
  }
}

/**
 * Retrieves a list of all existing LiveKit rooms.
 *
 * @returns A promise resolving to an array of room identifiers:
 *          uses the room’s name if present, otherwise its SID.
 * @throws LiveKitServiceError if the operation fails.
 */
export async function listRooms(): Promise<string[]> {
  console.debug('[LiveKit] listRooms: fetching rooms');
  try {
    const rooms = await adminClient.listRooms();
    console.info(`[LiveKit] listRooms: retrieved ${rooms.length} rooms`);
    return rooms.map(r => r.name ?? r.sid);
  } catch (err: any) {
    const code = err.code ?? err.statusCode ?? err.status;
    console.error('[LiveKit] listRooms: failed to fetch rooms', {
      message: err.message,
      code,
      details: err,
    });
    throw new LiveKitServiceError(
      `Failed to list rooms: ${err.message}`,
      code,
      err,
    );
  }
}
/**
 * Generates a JWT access token for a participant to join a LiveKit room.
 *
 * Permissions are granted as follows:
 * - Admin users can join, subscribe, and publish only audio (microphone).
 * - Regular users can join, subscribe, and publish audio, video, and screen share.
 *
 * @param identity - A unique identifier for the user (e.g., Azure AD object ID).
 * @param isAdmin  - Whether to grant admin-level permissions (audio only publishing).
 * @param room     - The name or ID of the room the token applies to.
 *
 * @returns A promise that resolves to the signed JWT access token.
 *
 * @throws LiveKitServiceError
 * Thrown when token generation fails due to an internal error or invalid parameters.
 *
 * @example
 * ```ts
 * const token = await generateToken("user-123", false, "room-1");
 * // => JWT string for a regular user with full publishing permissions
 * ```
 *
 * @remarks
 * This method uses the LiveKit `AccessToken` API to sign a token with
 * specific room join and publishing permissions. Admin tokens are restricted
 * to microphone publishing to allow voice-only broadcasting without video.
 */
export async function generateToken(
  identity: string,
  isAdmin: boolean,
  room: string,
): Promise<string> {
  console.debug(
    `[LiveKit] generateToken: identity=${identity}, isAdmin=${isAdmin}, room=${room}`
  );
  try {
    const at = new AccessToken(
      config.livekitApiKey,
      config.livekitApiSecret,
      { identity },
    );

    const grant: any = {
      roomJoin: true,
      room,
      canSubscribe: true,
      canPublish: true,
      canPublishData: true,
      publishSources: isAdmin
        ? ['microphone'] // Admin can only publish audio
        : ['camera', 'microphone', 'screen_share', 'screen_share_audio'],
    };

    at.addGrant(grant);

    const token = await at.toJwt();
    console.info('[LiveKit] generateToken: token generated successfully');
    return token;
  } catch (err: any) {
    console.error('[LiveKit] generateToken: failed to create token', {
      message: err.message,
      details: err,
    });
    throw new LiveKitServiceError(
      `Failed to generate token for "${identity}": ${err.message}`,
      undefined,
      err,
    );
  }
}
