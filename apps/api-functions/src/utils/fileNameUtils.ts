/**
 * @fileoverview fileNameUtils - Utility functions for file name sanitization
 * @description Provides functions to sanitize file names for safe storage
 */

/**
 * Sanitizes a string to be used in file names
 * @description Removes or replaces characters that are not safe for file systems.
 * Replaces spaces with underscores, removes special characters, and truncates to max length.
 * @param input - String to sanitize
 * @param maxLength - Maximum length of the output (default: 50)
 * @returns Sanitized string safe for file names
 */
export function sanitizeFileName(input: string, maxLength: number = 50): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove leading/trailing whitespace
  let sanitized = input.trim();

  // Replace spaces with underscores
  sanitized = sanitized.replaceAll(/\s+/g, '_');

  // Remove or replace special characters
  // Keep: letters, numbers, underscores, hyphens, dots
  sanitized = sanitized.replaceAll(/[^a-zA-Z0-9._-]/g, '');

  // Remove multiple consecutive underscores
  sanitized = sanitized.replaceAll(/_+/g, '_');

  // Remove leading/trailing underscores, dots, or hyphens
  // Split into two replace calls to avoid alternation and ensure safe execution
  sanitized = sanitized.replace(/^[._-]+/, '');
  sanitized = sanitized.replace(/[._-]+$/, '');

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    // Remove trailing underscore if truncated (anchored pattern - safe from ReDoS)
    sanitized = sanitized.replace(/[._-]+$/, '');
  }

  // If empty after sanitization, return a default value
  if (sanitized.length === 0) {
    return 'unknown';
  }

  return sanitized;
}

/**
 * Generates a descriptive file name for snapshot images
 * @description Creates a readable file name with format: {psoName}_{reasonCode}_{date}_{time}_{shortId}.jpg.
 * Sanitizes PSO name and reason code, formats date/time, and appends short snapshot ID for uniqueness.
 * @param psoName - Name of the PSO
 * @param reasonCode - Code of the snapshot reason
 * @param timestamp - Date when the snapshot was taken
 * @param snapshotId - ID of the snapshot (for uniqueness)
 * @returns Formatted file name
 */
export function generateSnapshotFileName(
  psoName: string,
  reasonCode: string,
  timestamp: Date,
  snapshotId: string
): string {
  // Sanitize PSO name (max 20 chars)
  const sanitizedPsoName = sanitizeFileName(psoName, 20);

  // Sanitize reason code (max 15 chars)
  const sanitizedReasonCode = sanitizeFileName(reasonCode, 15).toUpperCase();

  // Format date as YYYYMMDD
  const dateStr = timestamp.toISOString().slice(0, 10).replaceAll('-', '');

  // Format time as HHMMSS
  const hours = String(timestamp.getHours()).padStart(2, '0');
  const minutes = String(timestamp.getMinutes()).padStart(2, '0');
  const seconds = String(timestamp.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}${minutes}${seconds}`;

  // Get last 6 characters of snapshot ID for uniqueness
  const shortId = snapshotId.slice(-6);

  // Combine all parts
  return `${sanitizedPsoName}_${sanitizedReasonCode}_${dateStr}_${timeStr}_${shortId}.jpg`;
}

/**
 * Generates the folder path for organizing snapshots by date
 * @description Creates a folder path in format YYYY-MM-DD to organize snapshots chronologically in blob storage.
 * @param timestamp - Date when the snapshot was taken
 * @returns Folder path string in format YYYY-MM-DD
 */
export function generateSnapshotFolderPath(timestamp: Date): string {
  return timestamp.toISOString().slice(0, 10);
}

/**
 * Converts an arbitrary label into a URL/path-safe slug
 * @param input - String to convert to slug
 * @returns URL-safe slug string
 */
export function slugify(input: string): string {
  let slug = (input || "user")
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-");
  
  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+/, "");
  slug = slug.replace(/-+$/, "");
  
  return slug;
}

/**
 * Builds a UTC date prefix in `YYYY/MM/DD` format
 * @param d - Date to format (defaults to current date)
 * @returns Date string in YYYY/MM/DD format
 */
export function datePrefixUTC(d: Date = new Date()): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

