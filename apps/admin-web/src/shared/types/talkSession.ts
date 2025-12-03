/**
 * @fileoverview Talk session types and enums
 * @summary Type definitions for talk session operations
 */

/**
 * Stop reason for a talk session
 */
export enum TalkStopReason {
  USER_STOP = 'USER_STOP',
  PSO_DISCONNECTED = 'PSO_DISCONNECTED',
  SUPERVISOR_DISCONNECTED = 'SUPERVISOR_DISCONNECTED',
  BROWSER_REFRESH = 'BROWSER_REFRESH',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Request payload for starting a talk session
 */
export interface TalkSessionStartRequest {
  psoEmail: string;
}

/**
 * Response from starting a talk session
 */
export interface TalkSessionStartResponse {
  message: string;
  talkSessionId: string;
}

/**
 * Request payload for stopping a talk session
 */
export interface TalkSessionStopRequest {
  talkSessionId: string;
  stopReason: TalkStopReason;
}

/**
 * Response from stopping a talk session
 */
export interface TalkSessionStopResponse {
  message: string;
  talkSessionId: string;
}

/**
 * WebSocket message payload for talk session start notification
 */
export interface TalkSessionStartMessage {
  type: 'talk_session_start';
  psoEmail: string;
  supervisorEmail: string;
  supervisorName: string;
  talkSessionId: string;
}

