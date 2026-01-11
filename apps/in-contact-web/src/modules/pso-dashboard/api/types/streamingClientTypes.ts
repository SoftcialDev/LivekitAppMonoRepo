/**
 * @fileoverview Types for StreamingClient
 * @summary Type definitions for streaming API client
 */

/**
 * Response from setInactive API call
 */
export interface StreamingSessionUpdateResponse {
  message: string;
  status: string;
  stopReason?: string;
  stoppedAt?: string;
}

