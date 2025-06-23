import apiClient from '../../../services/apiClient'
import type { UserStatus } from '../types/types'

/**
 * Response shape for presence endpoint.
 */
interface PresenceResponse {
  online: UserStatus[]
  offline: UserStatus[]
}

/**
 * Fetches presence data (online and offline users) from the backend.
 *
 * Assumes GET /presence returns JSON:
 *   { online: UserStatus[], offline: UserStatus[] }
 * Adjust if your API differs.
 *
 * @returns A promise resolving to an object with `online` and `offline` arrays.
 * @throws If the request fails.
 */
export async function fetchPresence(): Promise<PresenceResponse> {
  const resp = await apiClient.get<PresenceResponse>('/presence')
  return {
    online: resp.data.online ?? [],
    offline: resp.data.offline ?? [],
  }
}
