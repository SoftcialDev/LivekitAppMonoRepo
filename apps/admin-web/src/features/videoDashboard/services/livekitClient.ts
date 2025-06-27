// ui/src/services/livekitClient.ts
import apiClient from '../../../services/apiClient'

/**
 * Each entry contains the room’s name/ID and the JWT scoped to that single room.
 */
export interface RoomWithToken {
  room:  string
  token: string
}

/**
 * New shape of the LiveKit token API response.
 */
export interface LiveKitTokenResponse {
  /** One `{ room, token }` per room the caller may join. */
  rooms:      RoomWithToken[]
  /** Base URL of the LiveKit WS endpoint. */
  livekitUrl: string
}

/**
 * Fetches per-room tokens for Admins/Supervisors or a single-room token for Employees.
 *
 * @returns Promise resolving to:
 *   - `rooms`: array of `{ room, token }`
 *   - `livekitUrl`
 *
 * @example
 * ```ts
 * const { rooms, livekitUrl } = await getLiveKitToken()
 * // rooms = [ { room: 'uuid-1', token: 'eyJ…' }, … ]
 * ```
 */
export async function getLiveKitToken(): Promise<LiveKitTokenResponse> {
  const res = await apiClient.get<LiveKitTokenResponse>('/api/LiveKitToken')

  if (
    !res.data ||
    !Array.isArray(res.data.rooms) ||
    typeof res.data.livekitUrl !== 'string'
  ) {
    throw new Error('Invalid LiveKitToken response')
  }

  for (const entry of res.data.rooms) {
    if (typeof entry.room !== 'string' || typeof entry.token !== 'string') {
      throw new Error('Invalid room/token entry in LiveKitToken response')
    }
  }

  return res.data
}
