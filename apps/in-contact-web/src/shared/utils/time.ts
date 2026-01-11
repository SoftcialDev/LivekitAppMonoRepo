import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(tz);

/** IANA timezone for Central America (Costa Rica). */
export const CR_TZ = 'America/Costa_Rica';

/**
 * Returns an ISO-8601 string with explicit -06:00 offset for Costa Rica time.
 * Example: "2025-08-12T14:03:21-06:00"
 * 
 * @returns ISO-8601 formatted string with Costa Rica timezone offset
 */
export function nowCRIso(): string {
  return dayjs().tz(CR_TZ).format();
}

/**
 * Returns the current epoch milliseconds using Costa Rica timezone wall clock.
 * 
 * @returns Epoch milliseconds in Costa Rica timezone
 */
export function nowCRMs(): number {
  return dayjs().tz(CR_TZ).valueOf();
}

/**
 * Parses an ISO string as Costa Rica wall-clock time, ignoring any trailing Z/offset.
 * Example: "2025-10-16T15:34:57.460Z" will be treated as 15:34:57 in CR, not UTC.
 * 
 * @param iso - ISO-8601 formatted date string
 * @returns Dayjs object in Costa Rica timezone
 */
export function parseIsoAsCRWallClock(iso: string): dayjs.Dayjs {
  const noOffset = iso.replace(/([+-]\d{2}:\d{2}|Z)$/i, '');
  return dayjs.tz(noOffset, CR_TZ);
}

/**
 * Formats an ISO timestamp into America/Costa_Rica time (keeps offset).
 * 
 * @param iso - ISO-8601 formatted date string
 * @returns ISO-8601 formatted string with Costa Rica timezone
 */
export function formatIsoToCR(iso: string): string {
  return parseIsoAsCRWallClock(iso).format();
}

/**
 * Returns true if (now_CR - stoppedAt) < windowMs, using precise TZ math.
 * 
 * @param iso - ISO-8601 formatted date string to compare
 * @param windowMs - Time window in milliseconds
 * @returns True if the date is within the specified time window
 */
export function isWithinCentralAmericaWindow(iso: string, windowMs: number): boolean {
  const stoppedAtMs = parseIsoAsCRWallClock(iso).valueOf();
  return nowCRMs() - stoppedAtMs < windowMs;
}

/**
 * Formats a date for display in Central America Time
 * 
 * Converts a Date, string, or undefined value to a formatted string
 * in 'YYYY-MM-DD HH:mm:ss' format using Central America timezone.
 * Returns 'N/A' if the date is invalid or undefined.
 * 
 * @param date - Date to format (Date, string, or undefined)
 * @returns Formatted date string or 'N/A' if date is invalid
 * 
 * @example
 * ```typescript
 * formatDateForDisplay(new Date()) // "2025-01-15 14:30:45"
 * formatDateForDisplay("2025-01-15T14:30:45Z") // "2025-01-15 14:30:45"
 * formatDateForDisplay(undefined) // "N/A"
 * ```
 */
export function formatDateForDisplay(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  const dateStr = typeof date === 'string' ? date : date.toISOString();
  return parseIsoAsCRWallClock(dateStr).format('YYYY-MM-DD HH:mm:ss');
}

