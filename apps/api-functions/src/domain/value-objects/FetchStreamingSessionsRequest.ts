/**
 * @fileoverview FetchStreamingSessionsRequest - Value Object for streaming sessions requests
 * @summary Encapsulates request data for fetching streaming sessions
 * @description Provides structured request data for streaming sessions operations
 */

import { FetchStreamingSessionsRequestPayload } from '../schemas/FetchStreamingSessionsSchema';

/**
 * Value Object for FetchStreamingSessions requests
 * No specific parameters required as it uses authenticated user context
 */
export class FetchStreamingSessionsRequest {
  /**
   * Creates a FetchStreamingSessionsRequest from payload
   * @param payload - Request payload
   * @returns FetchStreamingSessionsRequest instance
   */
  static fromPayload(payload: FetchStreamingSessionsRequestPayload): FetchStreamingSessionsRequest {
    return new FetchStreamingSessionsRequest();
  }
}
