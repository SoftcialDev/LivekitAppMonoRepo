/**
 * @fileoverview GetTalkSessionsResponse.ts - Value object for talk sessions query responses
 * @summary Encapsulates talk sessions query response data
 * @description Value object representing a response from talk sessions queries with pagination
 */

/**
 * Talk session DTO for API responses.
 */
export interface TalkSessionDto {
  id: string;
  supervisorId: string;
  supervisorName: string;
  supervisorEmail: string;
  psoId: string;
  psoName: string;
  psoEmail: string;
  startedAt: string;
  stoppedAt: string | null;
  stopReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Value object representing a talk sessions query response.
 * @description Encapsulates paginated talk sessions data with metadata.
 */
export class GetTalkSessionsResponse {
  /**
   * Creates a new GetTalkSessionsResponse instance.
   * @param sessions - Array of talk session DTOs
   * @param total - Total count of talk sessions (before pagination)
   * @param page - Current page number
   * @param limit - Number of items per page
   */
  constructor(
    private readonly sessions: TalkSessionDto[],
    private readonly total: number,
    private readonly page: number,
    private readonly limit: number
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a GetTalkSessionsResponse from sessions data.
   * @param sessions - Array of talk session DTOs
   * @param total - Total count of talk sessions
   * @param page - Current page number
   * @param limit - Number of items per page
   * @returns GetTalkSessionsResponse instance
   */
  static fromSessions(
    sessions: TalkSessionDto[],
    total: number,
    page: number,
    limit: number
  ): GetTalkSessionsResponse {
    return new GetTalkSessionsResponse(sessions, total, page, limit);
  }

  /**
   * Converts the response to a plain object for serialization.
   * @returns Plain object representation of the response
   */
  toPayload(): {
    sessions: TalkSessionDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  } {
    const totalPages = Math.ceil(this.total / this.limit);
    const hasMore = this.page < totalPages;

    return {
      sessions: this.sessions,
      total: this.total,
      page: this.page,
      limit: this.limit,
      totalPages,
      hasMore,
    };
  }
}

