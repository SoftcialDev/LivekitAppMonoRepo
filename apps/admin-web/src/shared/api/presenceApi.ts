import { UserStatus } from "../types/UserStatus";
import apiClient from "./apiClient";

/** Individual presence record returned by the paged API */
interface PresenceItem {
  email:      string
  fullName:   string
  status:     'online' | 'offline'
  lastSeenAt: string
  role?:         'Admin' | 'Supervisor' | 'Employee';
  supervisorId?: string | null;
  supervisorEmail?: string | null;
}

/** Shape of the paged presence response */
interface PagedPresenceResponse {
  total:    number
  page:     number
  pageSize: number
  items:    PresenceItem[]
}

/**
 * Fetches ALL presence data from the backend by paginating through all pages.
 * This ensures we get all users, not just the first page.
 *
 * GET `/api/GetWebsocketPresenceStatus` returns paginated data:
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
  
  let allItems: PresenceItem[] = []
  let currentPage = 1
  let totalPages = 1
  const pageSize = 50 // Reasonable page size
  
  // Fetch all pages
  do {
    const resp = await apiClient.get<PagedPresenceResponse>('/api/GetWebsocketPresenceStatus', {
      params: {
        page: currentPage,
        pageSize: pageSize
      }
    })
    
    const data = resp.data

    
    allItems = [...allItems, ...(data.items ?? [])]
    
    totalPages = Math.ceil((data.total ?? 0) / pageSize)

    currentPage++
  } while (currentPage <= totalPages)
  


  const online = allItems
    .filter(u => u.status === 'online')
    .map<UserStatus>(u => ({
      email:      u.email,
      fullName:   u.fullName,
      status:     u.status,
      lastSeenAt: u.lastSeenAt,
      name:       u.fullName, 
      role:            u.role,  
      azureAdObjectId: (u as any).azureAdObjectId ?? null,
      supervisorId:    u.supervisorId ?? null,
      supervisorEmail: u.supervisorEmail ?? null,
    }))

  const offline = allItems
    .filter(u => u.status === 'offline')
    .map<UserStatus>(u => ({
      email:      u.email,
      fullName:   u.fullName,
      status:     u.status,
      lastSeenAt: u.lastSeenAt,
      name:       u.fullName, 
      role:            u.role,  
      azureAdObjectId: (u as any).azureAdObjectId ?? null,
      supervisorId:    u.supervisorId ?? null,
      supervisorEmail: u.supervisorEmail ?? null,
    }))

  return { online, offline }
}
