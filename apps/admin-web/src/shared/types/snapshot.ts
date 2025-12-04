/**
 * @fileoverview snapshot.ts - Type definitions for snapshot operations
 * @summary Defines TypeScript interfaces for snapshot reports
 * @description Provides type definitions for snapshot requests and responses
 */

/**
 * Snapshot reason structure from API
 */
export interface SnapshotReason {
  id: string;
  label: string;
  code: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
}

/**
 * Interface for the payload sent to create a snapshot report.
 */
export interface SnapshotRequest {
  psoEmail: string;
  reasonId: string;
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
  reason: {
    id: string;
    label: string;
    code: string;
  };
  description?: string | null;
  imageUrl: string;
  takenAt: string;
}

