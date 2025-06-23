import { RoomServiceClient, AccessToken, Room } from "livekit-server-sdk";
import { config } from "../config";

/**
 * LiveKit admin client configured with API URL, key, and secret.
 */
const adminClient = new RoomServiceClient(
  config.livekitApiUrl,
  config.livekitApiKey,
  config.livekitApiSecret,
);

/**
 * Retrieves the list of existing LiveKit rooms.
 *
 * @returns A promise that resolves to an array of room names or IDs.
 * @throws Error if the LiveKit API call fails.
 */
export async function listRooms(): Promise<string[]> {
  const rooms: Room[] = await adminClient.listRooms();
  return rooms.map(r => r.name ?? "unknown-room");
}

/**
 * Generates a LiveKit access token for a client identity.
 *
 * @param identity - A unique identifier for the client (e.g., Azure AD object ID).
 * @param isAdmin - If true, grants room admin privileges for any room.
 * @param room - Specific room name or ID to join when isAdmin is false.
 * @returns A promise that resolves to a JWT string for LiveKit connection.
 * @throws Error if isAdmin is false and no room is provided.
 */
export async function generateToken(
  identity: string,
  isAdmin: boolean,
  room?: string,
): Promise<string> {
  const at = new AccessToken(
    config.livekitApiKey,
    config.livekitApiSecret,
    { identity },
  );

  if (isAdmin) {
    at.addGrant({ roomAdmin: true });
  } else {
    if (!room) {
      throw new Error("Room must be specified when not an admin");
    }
    at.addGrant({ roomJoin: true, room });
  }
  return await at.toJwt();
}
