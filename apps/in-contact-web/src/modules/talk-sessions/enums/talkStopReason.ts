/**
 * @fileoverview TalkStopReason enum
 * @summary Enum representing the reasons a talk session can be stopped
 * @description Matches the backend TalkStopReason enum
 */

/**
 * Enum representing the reasons a talk session can be stopped
 */
export enum TalkStopReason {
  USER_STOP = 'USER_STOP',
  PSO_DISCONNECTED = 'PSO_DISCONNECTED',
  SUPERVISOR_DISCONNECTED = 'SUPERVISOR_DISCONNECTED',
  BROWSER_REFRESH = 'BROWSER_REFRESH',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  UNKNOWN = 'UNKNOWN',
}

