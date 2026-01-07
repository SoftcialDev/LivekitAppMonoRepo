/**
 * @fileoverview SnapshotReason.ts - Enum for snapshot report reasons
 * @summary Defines predefined reasons for snapshot reports in InContact
 * @description Enum representing the different reasons a snapshot can be taken
 * for intervention tracking purposes.
 */

/**
 * Enum representing snapshot report reasons in the system.
 * @description Matches the predefined reasons for InContact intervention tracking.
 * These reasons are used to categorize snapshot reports for compliance and performance monitoring.
 */
export enum SnapshotReason {
  ATTENTIVENESS_ALERTNESS = "ATTENTIVENESS_ALERTNESS",
  TIME_ATTENDANCE = "TIME_ATTENDANCE",
  PERFORMANCE = "PERFORMANCE",
  COMPLIANCE = "COMPLIANCE",
  PROFESSIONAL_APPEARANCE = "PROFESSIONAL_APPEARANCE",
  OTHER = "OTHER"
}

