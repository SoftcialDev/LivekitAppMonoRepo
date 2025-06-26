import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';
import { config } from '../config';

/** Admin client for LiveKit REST API */
const adminClient = new RoomServiceClient(
  config.livekitApiUrl,
  config.livekitApiKey,
  config.livekitApiSecret,
);

/**
 * Ensure that a room exists with emptyTimeout = 0 (never auto-delete).
 * If already existe, ignora el error.
 */
export async function ensureRoom(roomName: string): Promise<void> {
  try {
    await adminClient.createRoom({
      name:         roomName,
      emptyTimeout: 0,
    });
  } catch (err: any) {
    // Código 409 = sala ya existe
    if ((err as any).code !== 409) {
      throw err;
    }
  }
}

/**
 * List all existing LiveKit room names (o SIDs si no tienen nombre).
 */
export async function listRooms(): Promise<string[]> {
  const rooms = await adminClient.listRooms();
  return rooms.map(r => r.name ?? r.sid);
}

/**
 * Generate a LiveKit access token (JWT) para un usuario dado.
 *
 * - Admin/Supervisor:
 *   • roomAdmin: true
 *   • canSubscribe: true
 *   • canPublish: false
 *
 * - Employee:
 *   • roomJoin: true
 *   • room: su propia sala
 *   • canSubscribe: true
 *   • canPublish: true
 *
 * @param identity  Identidad única (e.g. Azure AD object ID).
 * @param isAdmin   true para Admin/Supervisor, false para Employee.
 * @param room      Nombre de sala (requerido si !isAdmin).
 */
export async function generateToken(
  identity: string,
  isAdmin: boolean,
  room?: string
): Promise<string> {
  const at = new AccessToken(
    config.livekitApiKey,
    config.livekitApiSecret,
    { identity },
  );

  if (isAdmin) {
    at.addGrant({
      roomAdmin:    true,
      canSubscribe: true,
      canPublish:   false,
    });
  } else {
    if (!room) {
      throw new Error('Employees must specify their room name');
    }
    at.addGrant({
      roomJoin:     true,
      room,
      canSubscribe: true,
      canPublish:   true,
    });
  }

  return await at.toJwt();
}
