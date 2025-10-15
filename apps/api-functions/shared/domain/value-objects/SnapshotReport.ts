/**
 * @fileoverview SnapshotReport - Value object for snapshot report data
 * @summary Encapsulates snapshot report information
 * @description Value object representing a snapshot report with all related data
 */

/**
 * Value object representing a snapshot report
 * @description Encapsulates all snapshot report data including supervisor and PSO information
 */
export interface SnapshotReport {
  /** Unique identifier of the snapshot */
  id: string;
  
  /** Full name of the supervisor who took the snapshot */
  supervisorName: string;
  
  /** Full name of the PSO who was photographed */
  psoFullName: string;
  
  /** Email address of the PSO */
  psoEmail: string;
  
  /** Reason for taking the snapshot */
  reason: string;
  
  /** URL of the stored image */
  imageUrl: string;
  
  /** ISO timestamp when the snapshot was taken */
  takenAt: string;
}
