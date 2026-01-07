/**
 * @fileoverview TalkSessionStopRequest - Value object for talk session stop requests
 * @summary Encapsulates talk session stop request data
 * @description Represents a request to stop a talk session
 */

import { TalkSessionStopParams } from "../schemas/TalkSessionStopSchema";
import { TalkStopReason } from "../enums/TalkStopReason";

/**
 * Value object representing a talk session stop request
 * @description Encapsulates the talk session ID and stop reason
 */
export class TalkSessionStopRequest {
  /**
   * Creates a new TalkSessionStopRequest instance
   * @param talkSessionId - The ID of the talk session to stop
   * @param stopReason - The reason for stopping the talk session
   */
  constructor(
    public readonly talkSessionId: string,
    public readonly stopReason: TalkStopReason
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a TalkSessionStopRequest from validated body parameters
   * @param params - Validated body parameters
   * @returns A new TalkSessionStopRequest instance
   */
  static fromBody(params: TalkSessionStopParams): TalkSessionStopRequest {
    return new TalkSessionStopRequest(
      params.talkSessionId,
      params.stopReason
    );
  }

  /**
   * Converts the request to a plain object for serialization
   * @returns Plain object representation of the request
   */
  toPayload(): { talkSessionId: string; stopReason: TalkStopReason } {
    return {
      talkSessionId: this.talkSessionId,
      stopReason: this.stopReason
    };
  }
}

