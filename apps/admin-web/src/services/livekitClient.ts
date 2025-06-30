import apiClient from './apiClient'

/**
 * Each entry contains the room’s name/ID and the JWT scoped to that single room.
 */
export interface RoomWithToken {
  /** The LiveKit room name or identifier */
  room: string
  /** JWT allowing the client to join the specified room */
  token: string
}

/**
 * New shape of the LiveKit token API response.
 */
export interface LiveKitTokenResponse {
  /** One `{ room, token }` per room the caller may join. */
  rooms: RoomWithToken[]
  /** Base URL of the LiveKit WS endpoint. */
  livekitUrl: string
}

/**
 * Fetches LiveKit access tokens from the backend.
 *
 * If `roomName` is provided, returns a single-room token for that room.
 * Otherwise, returns one entry per room the caller is allowed to join
 * (e.g. Admin/Supervisor sees all other rooms; Employee sees only their own).
 *
 * @param roomName - Optional LiveKit room identifier to scope token to.
 *                   When omitted, backend decides which rooms to return
 *                   based on the caller’s role.
 * @returns Promise resolving to:
 *   - `rooms`: array of `{ room, token }`
 *   - `livekitUrl`: base URL for the LiveKit WS endpoint
 *
 * @example
 * ```ts
 * // Employee: returns [{ room: 'user-uuid', token: '…' }]
 * const { rooms, livekitUrl } = await getLiveKitToken()
 *
 * // Admin fetching only one user’s room:
 * const { rooms: single, livekitUrl } = await getLiveKitToken('employee-uuid')
 * // single.length === 1
 * ```
 * @throws Error if the response is malformed or missing expected fields.
 */
export async function getLiveKitToken(
  roomName?: string
): Promise<LiveKitTokenResponse> {
  // Build query string if a specific room was requested
  const query = roomName
    ? `?room=${encodeURIComponent(roomName)}`
    : ''

  // Request per-room tokens from our API
  const res = await apiClient.get<LiveKitTokenResponse>(`/api/LiveKitToken${query}`)

  const { data } = res
  if (
    !data ||
    !Array.isArray(data.rooms) ||
    typeof data.livekitUrl !== 'string'
  ) {
    throw new Error('Invalid LiveKitToken response')
  }

  for (const entry of data.rooms) {
    if (typeof entry.room !== 'string' || typeof entry.token !== 'string') {
      throw new Error('Invalid room/token entry in LiveKitToken response')
    }
  }

  console.log('LiveKitToken response:', data)
  return data
}
