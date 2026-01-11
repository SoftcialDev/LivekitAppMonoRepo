/**
 * @fileoverview Date formatting utilities
 * @summary Common date formatting functions
 * @description Reusable utilities for formatting dates and timestamps
 */

/**
 * Formats a timestamp string in UTC timezone without applying local timezone offset
 * 
 * Formats an ISO-8601 timestamp using UTC timezone. Falls back to the original
 * value if parsing fails. Uses Intl.DateTimeFormat for consistent formatting.
 * 
 * @param isoString - ISO-8601 timestamp string to format
 * @returns Formatted date/time string in UTC or original value if invalid
 */
export function formatUtcTimestamp(isoString: string | undefined): string {
  if (!isoString) return '—';
  const dt = new Date(isoString);
  if (Number.isNaN(dt.getTime())) return isoString;
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dt);
}

/**
 * Formats a timestamp string to DD/MM/YYYY HH:MM format using UTC timezone
 * 
 * Formats an ISO-8601 timestamp in DD/MM/YYYY HH:MM format using UTC timezone
 * to preserve the exact date/time from the API. This is a more compact format
 * compared to formatUtcTimestamp which uses locale-specific formatting.
 * 
 * @param isoString - ISO-8601 timestamp string to format
 * @returns Formatted date/time string in format "DD/MM/YYYY HH:MM", or '—' if invalid
 */
export function formatDateTimeUtc(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const dt = new Date(isoString);
  if (Number.isNaN(dt.getTime())) return isoString;
  
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  const hours = String(dt.getUTCHours()).padStart(2, '0');
  const minutes = String(dt.getUTCMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

