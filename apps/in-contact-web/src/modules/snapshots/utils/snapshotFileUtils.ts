/**
 * @fileoverview Snapshot file utilities
 * @summary Utilities specific to snapshot file operations
 * @description Helper functions for generating snapshot file names and handling snapshot downloads
 */

import { downloadFile, sanitizeFileName } from '@/shared/utils/fileUtils';
import type { SnapshotReport } from '../types/snapshotTypes';

/**
 * Generates a descriptive file name for snapshot download
 * 
 * Creates a human-readable file name with format:
 * `snapshot_{psoName}_{reasonCode}_{date}_{time}_{shortId}.jpg`
 * 
 * @param report - Snapshot report containing PSO name, reason, and takenAt date
 * @returns Formatted file name
 */
export function generateSnapshotFileName(report: SnapshotReport): string {
  const psoName = sanitizeFileName(
    report.psoFullName || report.psoEmail?.split('@')[0] || 'unknown',
    20
  );
  const reasonCode = sanitizeFileName(report.reason?.code || 'UNKNOWN', 15).toUpperCase();

  // Format date and time from takenAt
  const takenAt = report.takenAt ? new Date(report.takenAt) : new Date();
  const dateStr = takenAt.toISOString().slice(0, 10).replaceAll('-', '');
  const hours = String(takenAt.getHours()).padStart(2, '0');
  const minutes = String(takenAt.getMinutes()).padStart(2, '0');
  const seconds = String(takenAt.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}${minutes}${seconds}`;

  // Get last 6 characters of snapshot ID for uniqueness
  const shortId = report.id.slice(-6);

  return `snapshot_${psoName}_${reasonCode}_${dateStr}_${timeStr}_${shortId}.jpg`;
}

/**
 * Downloads a snapshot image
 * 
 * Downloads the snapshot image from the report's imageUrl with a
 * descriptive file name generated from the report metadata.
 * 
 * @param report - Snapshot report containing image URL and metadata
 * @returns Promise that resolves when download completes or rejects on error
 * @throws {Error} If the download fails
 */
export async function downloadSnapshot(report: SnapshotReport): Promise<void> {
  const fileName = generateSnapshotFileName(report);
  await downloadFile(report.imageUrl, fileName);
}

