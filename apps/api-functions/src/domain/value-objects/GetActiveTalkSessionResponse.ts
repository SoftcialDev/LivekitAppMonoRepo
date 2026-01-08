/**
 * @fileoverview GetActiveTalkSessionResponse - Value object for GetActiveTalkSession responses
 * @summary Encapsulates GetActiveTalkSession response data
 * @description Represents the response when checking if a PSO has an active talk session
 */

import { TalkSession } from '../types/TalkSessionTypes';

/**
 * Value object representing a GetActiveTalkSession response
 * @description Encapsulates active session information
 */
export class GetActiveTalkSessionResponse {
  /**
   * Creates a new GetActiveTalkSessionResponse instance
   * @param hasActiveSession - Whether the PSO has an active talk session
   * @param session - Optional active session data
   * @param supervisorEmail - Optional supervisor email if session exists
   * @param supervisorName - Optional supervisor name if session exists
   */
  constructor(
    public readonly hasActiveSession: boolean,
    public readonly sessionId?: string,
    public readonly supervisorEmail?: string,
    public readonly supervisorName?: string,
    public readonly startedAt?: string
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a GetActiveTalkSessionResponse from a TalkSession
   * @param session - The active talk session or null
   * @returns A new GetActiveTalkSessionResponse instance
   */
  static fromSession(session: TalkSession | null, supervisorEmail?: string, supervisorName?: string): GetActiveTalkSessionResponse {
    if (!session) {
      return new GetActiveTalkSessionResponse(false);
    }

    return new GetActiveTalkSessionResponse(
      true,
      session.id,
      supervisorEmail,
      supervisorName,
      session.startedAt.toISOString()
    );
  }

  /**
   * Converts the response to a plain object for serialization
   * @returns Plain object representation of the response
   */
  toPayload(): {
    hasActiveSession: boolean;
    sessionId?: string;
    supervisorEmail?: string;
    supervisorName?: string;
    startedAt?: string;
  } {
    return {
      hasActiveSession: this.hasActiveSession,
      sessionId: this.sessionId,
      supervisorEmail: this.supervisorEmail,
      supervisorName: this.supervisorName,
      startedAt: this.startedAt
    };
  }
}

