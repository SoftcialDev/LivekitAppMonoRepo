/**
 * @fileoverview GetOrCreateChatRequest - Value object for chat creation requests
 * @summary Encapsulates chat creation request data
 * @description Value object representing a request to create or get a chat
 */

/**
 * Value object representing a chat creation request
 * @description Encapsulates the caller ID and PSO email for chat creation
 */
export class GetOrCreateChatRequest {
  /**
   * Creates a new GetOrCreateChatRequest instance
   * @param callerId - The Azure AD Object ID of the user making the request
   * @param psoEmail - The email address of the PSO to chat with
   */
  constructor(
    public readonly callerId: string,
    public readonly psoEmail: string
  ) {}

  /**
   * Creates a GetOrCreateChatRequest from validated body
   * @param callerId - The Azure AD Object ID of the user making the request
   * @param body - Validated request body
   * @returns GetOrCreateChatRequest instance
   */
  static fromBody(callerId: string, body: { psoEmail: string }): GetOrCreateChatRequest {
    return new GetOrCreateChatRequest(callerId, body.psoEmail);
  }
}
