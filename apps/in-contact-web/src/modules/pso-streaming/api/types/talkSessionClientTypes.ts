/**
 * @fileoverview Talk session client types
 * @summary Type definitions for talk session API client
 * @description Types for talk session requests and responses
 */

import { TalkStopReason } from '../../../talk-sessions/enums/talkStopReason';

/**
 * Interface for the payload sent to start a talk session
 */
export interface TalkSessionStartRequest {
  psoEmail: string;
}

/**
 * Interface for the response received after starting a talk session
 */
export interface TalkSessionStartResponse {
  message: string;
  talkSessionId: string;
}

/**
 * Interface for the payload sent to stop a talk session
 */
export interface TalkSessionStopRequest {
  talkSessionId: string;
  stopReason: TalkStopReason;
}

/**
 * Interface for the response received after stopping a talk session
 */
export interface TalkSessionStopResponse {
  message: string;
  talkSessionId: string;
}

/**
 * Response from checking active talk session
 */
export interface CheckActiveSessionResponse {
  hasActiveSession: boolean;
  sessionId?: string;
  supervisorEmail?: string;
  supervisorName?: string;
  startedAt?: string;
}

