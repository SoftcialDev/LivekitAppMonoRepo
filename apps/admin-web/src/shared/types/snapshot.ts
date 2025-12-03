/**
 * @fileoverview snapshot.ts - Type definitions for snapshot operations
 * @summary Defines TypeScript interfaces and enums for snapshot reports
 * @description Provides type definitions for snapshot requests, responses,
 * and predefined reasons used throughout the application.
 */

/**
 * Enum representing the predefined reasons for snapshot reports.
 * Matches the backend `SnapshotReason` enum.
 */
export enum SnapshotReason {
  ATTENTIVENESS_ALERTNESS = "ATTENTIVENESS_ALERTNESS",
  TIME_ATTENDANCE = "TIME_ATTENDANCE",
  PERFORMANCE = "PERFORMANCE",
  COMPLIANCE = "COMPLIANCE",
  PROFESSIONAL_APPEARANCE = "PROFESSIONAL_APPEARANCE",
  OTHER = "OTHER"
}

/**
 * Human-readable labels for snapshot reasons.
 */
export const SNAPSHOT_REASON_LABELS: Record<SnapshotReason, string> = {
  [SnapshotReason.ATTENTIVENESS_ALERTNESS]: "Attentiveness / Alertness",
  [SnapshotReason.TIME_ATTENDANCE]: "Time & Attendance (unjustified absence, no show, late)",
  [SnapshotReason.PERFORMANCE]: "Performance",
  [SnapshotReason.COMPLIANCE]: "Compliance (Background / HIPAA / Uniform / Other)",
  [SnapshotReason.PROFESSIONAL_APPEARANCE]: "Professional appearance and demeanor",
  [SnapshotReason.OTHER]: "Other"
};

/**
 * Interface for the payload sent to create a snapshot report.
 */
export interface SnapshotRequest {
  psoEmail: string;
  reason: SnapshotReason;
  description?: string;
  imageBase64: string;
}

/**
 * Interface for a snapshot report response.
 */
export interface SnapshotReport {
  id: string;
  supervisorName: string;
  psoFullName: string;
  psoEmail: string;
  reason: SnapshotReason;
  description?: string | null;
  imageUrl: string;
  takenAt: string;
}

