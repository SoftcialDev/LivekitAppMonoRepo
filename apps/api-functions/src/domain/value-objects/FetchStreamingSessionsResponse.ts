/**
 * @fileoverview FetchStreamingSessionsResponse - Value Object for streaming sessions responses
 * @summary Encapsulates response data for streaming sessions operations
 * @description Provides structured response data for streaming sessions
 */

import { StreamingSessionHistory } from '../entities/StreamingSessionHistory';

/**
 * Interface for streaming sessions response payload
 */
export interface FetchStreamingSessionsResponsePayload {
  sessions: Array<{
    email: string;
    startedAt: string;
    userId: string;
  }>;
}

/**
 * Value Object for FetchStreamingSessions responses
 */
export class FetchStreamingSessionsResponse {
  constructor(public readonly sessions: StreamingSessionHistory[]) {}
  
  /**
   * Creates a response with sessions
   * @param sessions - Array of streaming session entities
   * @returns FetchStreamingSessionsResponse with sessions
   */
  static withSessions(sessions: StreamingSessionHistory[]): FetchStreamingSessionsResponse {
    return new FetchStreamingSessionsResponse(sessions);
  }
  
  /**
   * Creates a response with no sessions
   * @returns FetchStreamingSessionsResponse with empty array
   */
  static withNoSessions(): FetchStreamingSessionsResponse {
    return new FetchStreamingSessionsResponse([]);
  }

  /**
   * Converts to response payload
   * @returns Response payload
   */
  toPayload(): FetchStreamingSessionsResponsePayload {
    return {
      sessions: this.sessions.map(session => ({
        email: session.user?.email || '',
        startedAt: session.startedAt.toISOString(),
        userId: session.userId,
      })),
    };
  }
}
