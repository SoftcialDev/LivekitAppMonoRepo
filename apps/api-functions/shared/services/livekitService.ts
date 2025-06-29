import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';
import { config } from '../config';

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
 * If a room with the given name already exists, the 409 conflict error is ignored.
 *
 * @param roomName - The unique name for the room to create or verify.
 * @returns A promise that resolves once the room is ensured to exist.
 * @throws Any error other than a 409 conflict.
 */
export async function ensureRoom(roomName: string): Promise<void> {
  try {
    await adminClient.createRoom({
      name:         roomName,
      emptyTimeout: 0,
    });
  } catch (err: any) {
    if (err.code !== 409) throw err;
  }
}

/**
 * Retrieves a list of all existing LiveKit rooms.
 *
 * @returns A promise that resolves to an array of room identifiers. 
 *          If a room has a name, that name is used; otherwise, its SID is returned.
 */
export async function listRooms(): Promise<string[]> {
  const rooms = await adminClient.listRooms();
  return rooms.map(r => r.name ?? r.sid);
}

/**
 * Generates a JWT access token for a participant to join a LiveKit room.
 *
 * The token grants:
 *  - For an admin/supervisor: join and subscribe permissions, but cannot publish.
 *  - For a regular employee: join, subscribe, and publish permissions.
 *
 * @param identity - A unique identifier for the user (e.g., an Azure AD object ID).
 * @param isAdmin  - Whether the token should grant admin-level permissions.
 * @param room     - The name or ID of the room the token applies to.
 * @returns A promise that resolves to the signed JWT access token.
 */
export async function generateToken(
  identity: string,
  isAdmin: boolean,
  room: string,
): Promise<string> {
  const at = new AccessToken(
    config.livekitApiKey,
    config.livekitApiSecret,
    { identity },
  );

  if (isAdmin) {
    at.addGrant({
      roomJoin:     true,
      room,
      canSubscribe: true,
      canPublish:   false,
    });
  } else {
    at.addGrant({
      roomJoin:     true,
      room,
      canSubscribe: true,
      canPublish:   true,
    });
  }

  return at.toJwt();
}
