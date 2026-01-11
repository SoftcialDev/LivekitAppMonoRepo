/**
 * @fileoverview useEnrichedUsers types
 * @summary Type definitions for useEnrichedUsers hook
 * @description Types for useEnrichedUsers hook options and return values
 */

import type { UserStatus } from '@/modules/presence';

/**
 * Options for useEnrichedUsers hook
 */
export interface IUseEnrichedUsersOptions {
  /** Whether to fetch Contact Manager statuses */
  shouldFetch: boolean;
  /** Current user email for WebSocket authentication */
  userEmail: string;
}

/**
 * Return type for useEnrichedUsers hook
 */
export interface IUseEnrichedUsersReturn {
  /** Online users enriched with cmStatus */
  enrichedOnlineUsers: UserStatus[];
  /** Offline users enriched with cmStatus */
  enrichedOfflineUsers: UserStatus[];
}

