/**
 * @fileoverview LiveKitTokenRequest - Value object for LiveKit token requests
 * @summary Encapsulates LiveKit token request data
 * @description Represents a request to generate LiveKit tokens with optional target user
 */

import { LiveKitTokenParams } from "../schemas/LiveKitTokenSchema";

/**
 * Value object representing a LiveKit token request
 * @description Encapsulates the caller ID and optional target user ID for token generation
 */
export class LiveKitTokenRequest {
  /**
   * Creates a new LiveKitTokenRequest instance
   * @param callerId - The ID of the user making the request
   * @param targetUserId - Optional target user ID for specific room access
   */
  constructor(
    public readonly callerId: string,
    public readonly targetUserId?: string
  ) {}

  /**
   * Creates a LiveKitTokenRequest from validated query parameters
   * @param callerId - The ID of the user making the request
   * @param params - Validated query parameters
   * @returns A new LiveKitTokenRequest instance
   */
  static fromParams(callerId: string, params: LiveKitTokenParams): LiveKitTokenRequest {
    return new LiveKitTokenRequest(callerId, params.userId);
  }

  /**
   * Converts the request to a plain object for serialization
   * @returns Plain object representation of the request
   */
  toPayload(): { callerId: string; targetUserId?: string } {
    return {
      callerId: this.callerId,
      targetUserId: this.targetUserId,
    };
  }
}
