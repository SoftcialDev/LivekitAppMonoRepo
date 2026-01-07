/**
 * @fileoverview GetTalkSessionsRequest.ts - Value object for talk sessions query requests
 * @summary Encapsulates talk sessions query request data
 * @description Value object representing a request to query talk sessions with pagination
 */

import { GetTalkSessionsParams } from "../schemas/GetTalkSessionsSchema";

/**
 * Value object representing a talk sessions query request.
 * @description Encapsulates pagination parameters for querying talk sessions.
 */
export class GetTalkSessionsRequest {
  /**
   * Creates a new GetTalkSessionsRequest instance.
   * @param callerId - The Azure AD Object ID of the user making the request
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   */
  constructor(
    public readonly callerId: string,
    public readonly page: number,
    public readonly limit: number
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a GetTalkSessionsRequest from query parameters.
   * @param callerId - The Azure AD Object ID of the user making the request
   * @param params - Validated query parameters
   * @returns GetTalkSessionsRequest instance
   */
  static fromQuery(callerId: string, params: GetTalkSessionsParams): GetTalkSessionsRequest {
    return new GetTalkSessionsRequest(
      callerId,
      Math.max(1, params.page),
      Math.max(1, Math.min(100, params.limit))
    );
  }

  /**
   * Converts the request to a plain object for serialization.
   * @returns Plain object representation of the request
   */
  toPayload(): { callerId: string; page: number; limit: number } {
    return {
      callerId: this.callerId,
      page: this.page,
      limit: this.limit,
    };
  }
}

