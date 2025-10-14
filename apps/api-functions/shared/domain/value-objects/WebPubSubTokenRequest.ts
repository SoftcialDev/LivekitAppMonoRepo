/**
 * @fileoverview WebPubSubTokenRequest - Value object for WebPubSub token generation requests
 * @summary Encapsulates WebPubSub token request data
 * @description Value object representing a request to generate a WebPubSub token
 */

import { WebPubSubTokenParams } from "../schemas/WebPubSubTokenSchema";

/**
 * Value object representing a WebPubSub token generation request
 * @description Encapsulates the caller ID for token generation
 */
export class WebPubSubTokenRequest {
  /**
   * Creates a new WebPubSubTokenRequest instance
   * @param callerId - The Azure AD Object ID of the user making the request
   */
  constructor(
    public readonly callerId: string
  ) {}

  /**
   * Creates a WebPubSubTokenRequest from validated parameters
   * @param callerId - The Azure AD Object ID of the user making the request
   * @param params - Validated request parameters (empty for this endpoint)
   * @returns WebPubSubTokenRequest instance
   */
  static fromParams(callerId: string, params: WebPubSubTokenParams): WebPubSubTokenRequest {
    return new WebPubSubTokenRequest(callerId);
  }
}
