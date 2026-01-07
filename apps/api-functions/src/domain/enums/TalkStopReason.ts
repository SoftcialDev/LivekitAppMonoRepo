/**
 * @fileoverview TalkStopReason - Enum for talk session stop reasons
 * @summary Defines talk session stop reason values matching Prisma schema
 * @description Enum representing the different reasons a talk session can be stopped
 */

/**
 * Enum representing talk session stop reasons in the system
 * @description Matches the TalkStopReason enum in Prisma schema
 */
export enum TalkStopReason {
  USER_STOP = "USER_STOP",
  PSO_DISCONNECTED = "PSO_DISCONNECTED",
  SUPERVISOR_DISCONNECTED = "SUPERVISOR_DISCONNECTED",
  BROWSER_REFRESH = "BROWSER_REFRESH",
  CONNECTION_ERROR = "CONNECTION_ERROR",
  UNKNOWN = "UNKNOWN"
}

