/**
 * @fileoverview RecordingStopStatus - Enum for recording stop operation status
 * @summary Defines recording stop status values
 * @description Enum representing the different statuses when stopping a recording session
 */

/**
 * Enum representing recording stop operation status
 * @description Defines the possible statuses when a recording is stopped
 */
export enum RecordingStopStatus {
  /** Recording completed successfully */
  Completed = "Completed",
  /** Recording completed due to disconnection */
  CompletedDisconnection = "Completed (disconnection)",
  /** Recording failed to stop or was already failed */
  Failed = "Failed"
}

