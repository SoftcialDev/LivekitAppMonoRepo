/**
 * @fileoverview StreamingStatusBatchResponse - Value Object for batch streaming status responses
 * @summary Encapsulates response data for batch streaming status operations
 * @description Provides structured response data for batch streaming status queries
 */

export interface StreamingStatusBatchResponsePayload {
  statuses: Array<{
    email: string;
    hasActiveSession: boolean;
    lastSession: {
      stopReason: string | null;
      stoppedAt: string | null;
    } | null;
  }>;
}

/**
 * Value Object for StreamingStatusBatch responses
 */
export class StreamingStatusBatchResponse {
  constructor(public readonly statuses: Array<{
    email: string;
    hasActiveSession: boolean;
    lastSession: {
      stopReason: string | null;
      stoppedAt: string | null;
    } | null;
  }>) {}

  /**
   * Converts to response payload
   * @returns Response payload
   */
  toPayload(): StreamingStatusBatchResponsePayload {
    return { statuses: this.statuses };
  }
}
