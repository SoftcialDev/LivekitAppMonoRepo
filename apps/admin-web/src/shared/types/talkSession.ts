/**
 * @fileoverview talkSession.ts - Type definitions for talk session operations
 * @summary Defines TypeScript interfaces and enums for talk session management
 * @description Provides type definitions for talk session requests, responses,
 * WebSocket messages, and stop reasons used throughout the application.
 */

/**
 * Enum representing the reasons a talk session can be stopped.
 * Matches the backend `TalkStopReason` enum.
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
 * Interface for the payload sent to start a talk session.
 */
export interface TalkSessionStartRequest {
  psoEmail: string;
}

/**
 * Interface for the response received after starting a talk session.
 */
export interface TalkSessionStartResponse {
  message: string;
  talkSessionId: string;
}

/**
 * Interface for the payload sent to stop a talk session.
 */
export interface TalkSessionStopRequest {
  talkSessionId: string;
  stopReason: TalkStopReason;
}

/**
 * Interface for the response received after stopping a talk session.
 */
export interface TalkSessionStopResponse {
  message: string;
  talkSessionId: string;
}

/**
 * Interface for a WebSocket message indicating a talk session has started.
 */
export interface TalkSessionStartMessage {
  type: 'talk_session_start';
  psoEmail: string;
  supervisorEmail: string;
  supervisorName: string;
  talkSessionId: string;
}

