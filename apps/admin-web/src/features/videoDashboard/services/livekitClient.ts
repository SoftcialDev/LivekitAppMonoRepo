import apiClient from '../../../services/apiClient';

export interface LiveKitTokenResponse {
  /** Names/IDs of rooms the token permits the client to join. */
  rooms: string[];
  /** LiveKit access token (JWT) for connecting to the room(s). */
  accessToken: string;
}

/**
 * Fetches a LiveKit access token and the list of permitted rooms.
 *
 * - **Admins/Supervisors**: backend returns all report‐rooms plus a roomAdmin token.
 * - **Employees**: backend returns `[ownRoom]` plus a roomJoin token.
 *
 * @returns Promise resolving to:
 *   - `rooms`: array of allowed room names/IDs
 *   - `accessToken`: JWT to pass to the LiveKit JS client
 * @throws Error if the HTTP request fails or the response shape is invalid.
 *
 * @example
 * ```ts
 * // Admin or Supervisor:
 * const { rooms, accessToken } = await getLiveKitToken();
 *
 * // Employee:
 * const { rooms, accessToken } = await getLiveKitToken();
 * ```
 */
export async function getLiveKitToken(): Promise<LiveKitTokenResponse> {
  const res = await apiClient.get<LiveKitTokenResponse>('/api/LiveKitToken');

  if (
    !res.data ||
    !Array.isArray(res.data.rooms) ||
    typeof res.data.accessToken !== 'string'
  ) {
    throw new Error('Invalid LiveKitToken response');
  }

  return res.data;
}
