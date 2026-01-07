/**
 * @fileoverview GetCurrentUserRequest - Value object for get current user requests
 * @description Encapsulates the request to get current user information
 */

/**
 * Request to get current user information
 */
export class GetCurrentUserRequest {
  /**
   * Creates a new GetCurrentUserRequest instance
   * @param callerId - Azure AD Object ID of the caller
   */
  constructor(
    public readonly callerId: string
  ) {}

  /**
   * Creates a GetCurrentUserRequest from caller ID
   * @param callerId - Azure AD Object ID
   * @returns GetCurrentUserRequest instance
   */
  static fromCallerId(callerId: string): GetCurrentUserRequest {
    return new GetCurrentUserRequest(callerId);
  }
}

