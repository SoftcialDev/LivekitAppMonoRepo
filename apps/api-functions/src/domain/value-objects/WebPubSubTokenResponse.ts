/**
 * @fileoverview WebPubSubTokenResponse - Value object for WebPubSub token generation responses
 * @summary Encapsulates WebPubSub token response data
 * @description Value object representing the response after generating a WebPubSub token
 */

/**
 * Value object representing a WebPubSub token generation response
 * @description Encapsulates the generated token and connection information
 */
export class WebPubSubTokenResponse {
  /**
   * Creates a new WebPubSubTokenResponse instance
   * @param token - The generated JWT token for WebPubSub authentication
   * @param endpoint - The WebPubSub endpoint URL
   * @param hubName - The WebPubSub hub name
   * @param groups - The groups the user will be subscribed to
   */
  constructor(
    public readonly token: string,
    public readonly endpoint: string,
    public readonly hubName: string,
    public readonly groups: string[]
  ) {}

  /**
   * Converts the response to a plain object for API response
   * @returns Plain object representation of the response
   */
  toPayload() {
    return {
      token: this.token,
      endpoint: this.endpoint,
      hubName: this.hubName,
      groups: this.groups
    };
  }
}
