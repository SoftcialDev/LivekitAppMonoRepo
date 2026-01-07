/**
 * @fileoverview FetchStreamingSessionHistoryResponse - Value Object for streaming session history responses
 * @summary Encapsulates response data for streaming session history operations
 * @description Provides structured response data for streaming session history
 */

import { StreamingSessionHistory } from '../entities/StreamingSessionHistory';

/**
 * Interface for streaming session history response payload
 */
export interface FetchStreamingSessionHistoryResponsePayload {
  session: {
    id: string;
    userId: string;
    startedAt: string;
    stoppedAt: string | null;
    stopReason: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

/**
 * Value Object for FetchStreamingSessionHistory responses
 */
export class FetchStreamingSessionHistoryResponse {
  constructor(public readonly session: StreamingSessionHistory | null) {}
  
  /**
   * Creates a response with a session
   * @param session - Streaming session entity
   * @returns FetchStreamingSessionHistoryResponse with session
   */
  static withSession(session: StreamingSessionHistory): FetchStreamingSessionHistoryResponse {
    return new FetchStreamingSessionHistoryResponse(session);
  }
  
  /**
   * Creates a response with no session
   * @returns FetchStreamingSessionHistoryResponse with null session
   */
  static withNoSession(): FetchStreamingSessionHistoryResponse {
    return new FetchStreamingSessionHistoryResponse(null);
  }

  /**
   * Converts to response payload
   * @returns Response payload
   */
  toPayload(): FetchStreamingSessionHistoryResponsePayload {
    return {
      session: this.session ? {
        id: this.session.id,
        userId: this.session.userId,
        startedAt: this.session.startedAt.toISOString(),
        stoppedAt: this.session.stoppedAt?.toISOString() || null,
        stopReason: this.session.stopReason,
        createdAt: this.session.createdAt.toISOString(),
        updatedAt: this.session.updatedAt.toISOString(),
      } : null,
    };
  }
}
