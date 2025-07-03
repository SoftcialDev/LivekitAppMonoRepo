import apiClient from '../../../services/apiClient'
import type { UserStatus } from '../types/types'

/** Individual presence record returned by the paged API */
interface PresenceItem {
  email:      string
  fullName:   string
  status:     'online' | 'offline'
  lastSeenAt: string
  role?:         'Admin' | 'Supervisor' | 'Employee';
}

/** Shape of the paged presence response */
interface PagedPresenceResponse {
  total:    number
  page:     number
  pageSize: number
  items:    PresenceItem[]
}

/**
 * Fetches presence data from the backend and splits it into online/offline lists.
 *
 * GET `/api/GetPresenceStatus` returns:
 * ```json
 * {
 *   "total": number,
 *   "page": number,
 *   "pageSize": number,
 *   "items": [
 *     { "email": string, "fullName": string, "status": "online"|"offline", "lastSeenAt": string },
 *     …
 *   ]
 * }
 * ```
 *
 * @returns Promise resolving to:
 * ```ts
 * {
 *   online:  UserStatus[]
 *   offline: UserStatus[]
 * }
 * ```
 * where each `UserStatus` has `email`, `fullName`, `status`, and `lastSeenAt`.
 *
 * @throws If the HTTP request fails or returns unexpected data.
 */
export async function fetchPresence(): Promise<{
  online:  UserStatus[]
  offline: UserStatus[]
}> {
  const resp = await apiClient.get<PagedPresenceResponse>('/api/GetWebsocketPresenceStatus')
  const items = resp.data.items ?? []

  const online = items
    .filter(u => u.status === 'online')
    .map<UserStatus>(u => ({
      email:      u.email,
      fullName:   u.fullName,
      status:     u.status,
      lastSeenAt: u.lastSeenAt,
      name:       u.fullName, 
      role:            u.role,  
      azureAdObjectId: (u as any).azureAdObjectId ?? null,
    }))

  const offline = items
    .filter(u => u.status === 'offline')
    .map<UserStatus>(u => ({
      email:      u.email,
      fullName:   u.fullName,
      status:     u.status,
      lastSeenAt: u.lastSeenAt,
      name:       u.fullName, 
      role:            u.role,  
      azureAdObjectId: (u as any).azureAdObjectId ?? null,
    }))

  return { online, offline }
}
