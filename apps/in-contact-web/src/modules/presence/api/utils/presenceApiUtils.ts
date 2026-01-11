/**
 * @fileoverview Presence API utility functions
 */

import { PresenceStatus } from '../../enums';
import { PRESENCE_PAGE_SIZE } from '../../constants/presenceConstants';
import type { PresenceItem, PagedPresenceResponse, UserStatus } from '../../types/presenceTypes';
import apiClient from '@/shared/api/apiClient';

/**
 * Timeout for presence API requests in milliseconds (90 seconds)
 * 
 * Increased timeout for serverless cold starts which can take 10-60+ seconds
 */
const PRESENCE_API_TIMEOUT_MS = 90000;

/**
 * Fetches a single page of presence data from the API
 * 
 * Uses extended timeout (90s) to handle serverless cold starts.
 * 
 * @param page - Page number to fetch
 * @returns Promise resolving to paginated presence response
 */
export async function fetchPresencePage(page: number): Promise<PagedPresenceResponse> {
  const resp = await apiClient.get<PagedPresenceResponse>(
    '/api/GetWebsocketPresenceStatus',
    {
      params: {
        page,
        pageSize: PRESENCE_PAGE_SIZE,
      },
      timeout: PRESENCE_API_TIMEOUT_MS,
    }
  );
  return resp.data;
}

/**
 * Filters presence items to only include online users
 * 
 * @param items - Array of presence items to filter
 * @returns Filtered array containing only online users
 */
export function filterOnlineItems(items: PresenceItem[]): PresenceItem[] {
  return items.filter((item) => {
    const status = item.status as string;
    return status === PresenceStatus.Online || status === 'online';
  });
}

/**
 * Transforms a PresenceItem into a UserStatus
 * 
 * @param item - Presence item from API
 * @returns Transformed user status object
 */
export function transformToUserStatus(item: PresenceItem): UserStatus {
  const status = item.status as string;
  const isOnline = status === PresenceStatus.Online || status === 'online';

  return {
    email: item.email,
    fullName: item.fullName,
    status: isOnline ? PresenceStatus.Online : PresenceStatus.Offline,
    lastSeenAt: item.lastSeenAt,
    name: item.fullName,
    role: item.role,
    azureAdObjectId: null,
    supervisorId: item.supervisorId ?? null,
    supervisorEmail: item.supervisorEmail ?? null,
  };
}

/**
 * Separates user statuses into online and offline arrays
 * 
 * @param items - Array of presence items to separate
 * @returns Object with online and offline user arrays
 */
export function separateUsersByStatus(items: PresenceItem[]): {
  online: UserStatus[];
  offline: UserStatus[];
} {
  const online: UserStatus[] = [];
  const offline: UserStatus[] = [];

  for (const item of items) {
    const userStatus = transformToUserStatus(item);
    (userStatus.status === PresenceStatus.Online ? online : offline).push(userStatus);
  }

  return { online, offline };
}

/**
 * Collects all presence items by paginating through the API
 * 
 * @param onlyOnline - If true, only fetch online users
 * @param maxUsers - Maximum number of users to fetch
 * @returns Promise resolving to array of presence items
 */
export async function collectAllPresenceItems(
  onlyOnline: boolean,
  maxUsers?: number
): Promise<PresenceItem[]> {
  let allItems: PresenceItem[] = [];
  let currentPage = 1;
  let totalPages = 1;
  let hasMore = true;

  while (hasMore && currentPage <= totalPages) {
    const { items = [], total = 0 } = await fetchPresencePage(currentPage);

    const filteredItems = onlyOnline ? filterOnlineItems(items) : items;

    allItems = [...allItems, ...filteredItems];
    totalPages = Math.ceil(total / PRESENCE_PAGE_SIZE);

    if (maxUsers !== undefined && allItems.length >= maxUsers) {
      allItems = allItems.slice(0, maxUsers);
      break;
    }

    if (items.length < PRESENCE_PAGE_SIZE) {
      hasMore = false;
    }

    currentPage++;
  }

  return allItems;
}

