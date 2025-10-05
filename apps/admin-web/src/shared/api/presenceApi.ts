import { UserStatus } from "../types/UserStatus";
import apiClient from "./apiClient";

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
  console.log('[DEBUG] Starting to fetch ALL presence data...')
  
  let allItems: PresenceItem[] = []
  let currentPage = 1
  let totalPages = 1
  const pageSize = 50 // Reasonable page size
  
  // Fetch all pages
  do {
    console.log(`[DEBUG] Fetching page ${currentPage}...`)
    const resp = await apiClient.get<PagedPresenceResponse>('/api/GetWebsocketPresenceStatus', {
      params: {
        page: currentPage,
        pageSize: pageSize
      }
    })
    
    const data = resp.data
    console.log(`[DEBUG] API Response for page ${currentPage}:`, {
      total: data.total,
      page: data.page,
      pageSize: data.pageSize,
      itemsCount: data.items?.length ?? 0,
      items: data.items?.map(i => ({ email: i.email, status: i.status }))
    })
    
    allItems = [...allItems, ...(data.items ?? [])]
    
    totalPages = Math.ceil((data.total ?? 0) / pageSize)
    console.log(`[DEBUG] Page ${currentPage}/${totalPages}: ${data.items?.length ?? 0} items (total so far: ${allItems.length})`)
    
    currentPage++
  } while (currentPage <= totalPages)
  
  console.log(`[DEBUG] Fetched all pages: ${allItems.length} total users`)

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
    }))

  console.log(`[DEBUG] Final result: ${online.length} online, ${offline.length} offline`)
  return { online, offline }
}
