/**
 * @fileoverview FetchStreamingSessionHistoryRequest - Value Object for streaming session history requests
 * @summary Encapsulates request data for fetching streaming session history
 * @description Provides structured request data for streaming session history operations
 */

import { FetchStreamingSessionHistoryRequestPayload } from '../schemas/FetchStreamingSessionHistorySchema';

/**
 * Value Object for FetchStreamingSessionHistory requests
 * No specific parameters required as it uses authenticated user context
 */
export class FetchStreamingSessionHistoryRequest {
  /**
   * Creates a new FetchStreamingSessionHistoryRequest
   */
  constructor() {
  }

  /**
   * Creates a FetchStreamingSessionHistoryRequest from payload
   * @param payload - Request payload
   * @returns FetchStreamingSessionHistoryRequest instance
   */
  static fromPayload(payload: FetchStreamingSessionHistoryRequestPayload): FetchStreamingSessionHistoryRequest {
    return new FetchStreamingSessionHistoryRequest();
  }
}
