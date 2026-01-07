/**
 * @fileoverview CommandAcknowledgmentStatus - Enum for command acknowledgment status
 * @description Defines the possible statuses for command acknowledgment operations
 */

/**
 * Enum representing the status of command acknowledgment operations
 */
export enum CommandAcknowledgmentStatus {
  /** Command is pending acknowledgment */
  PENDING = 'PENDING',
  /** Command has been acknowledged by employee */
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  /** Command acknowledgment failed */
  FAILED = 'FAILED'
}
