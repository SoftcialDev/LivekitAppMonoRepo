/**
 * @fileoverview Streaming Status Batch client types
 * @summary Type definitions for streaming status batch API client
 * @description Type definitions for batch streaming status operations
 */

import type { StreamingStopReason } from '../../enums';

/**
 * Individual streaming status for a user
 */
export interface UserStreamingStatus {
  email: string;
  hasActiveSession: boolean;
  lastSession: {
    stopReason: StreamingStopReason | null;
    stoppedAt: string | null;
  } | null;
}

/**
 * Response payload for batch streaming status queries
 */
export interface StreamingStatusBatchResponse {
  statuses: UserStreamingStatus[];
}

