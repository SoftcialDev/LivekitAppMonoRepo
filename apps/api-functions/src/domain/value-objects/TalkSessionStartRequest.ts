/**
 * @fileoverview TalkSessionStartRequest - Value object for talk session start requests
 * @summary Encapsulates talk session start request data
 * @description Represents a request to start a talk session between supervisor and PSO
 */

import { TalkSessionStartParams } from "../schemas/TalkSessionStartSchema";

/**
 * Value object representing a talk session start request
 * @description Encapsulates the caller ID and PSO email
 */
export class TalkSessionStartRequest {
  /**
   * Creates a new TalkSessionStartRequest instance
   * @param callerId - The Azure AD Object ID of the supervisor starting the talk session
   * @param psoEmail - The email of the PSO to talk to
   */
  constructor(
    public readonly callerId: string,
    public readonly psoEmail: string
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a TalkSessionStartRequest from validated body parameters
   * @param callerId - The Azure AD Object ID of the supervisor
   * @param params - Validated body parameters
   * @returns A new TalkSessionStartRequest instance
   */
  static fromBody(callerId: string, params: TalkSessionStartParams): TalkSessionStartRequest {
    return new TalkSessionStartRequest(
      callerId,
      params.psoEmail.toLowerCase().trim()
    );
  }

  /**
   * Converts the request to a plain object for serialization
   * @returns Plain object representation of the request
   */
  toPayload(): { callerId: string; psoEmail: string } {
    return {
      callerId: this.callerId,
      psoEmail: this.psoEmail
    };
  }
}

