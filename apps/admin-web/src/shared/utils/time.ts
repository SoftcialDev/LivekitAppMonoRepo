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
 */
export function nowCRIso(): string {
  return dayjs().tz(CR_TZ).format();
}

/**
 * Returns the current epoch milliseconds using Costa Rica timezone wall clock.
 */
export function nowCRMs(): number {
  return dayjs().tz(CR_TZ).valueOf();
}

/**
 * Parses an ISO string as Costa Rica wall-clock time, ignoring any trailing Z/offset.
 * Example: "2025-10-16T15:34:57.460Z" will be treated as 15:34:57 in CR, not UTC.
 */
export function parseIsoAsCRWallClock(iso: string): dayjs.Dayjs {
  const noOffset = iso.replace(/([+-]\d{2}:\d{2}|Z)$/i, '');
  return dayjs.tz(noOffset, CR_TZ);
}

/**
 * Formats an ISO timestamp into America/Costa_Rica time (keeps offset).
 */
export function formatIsoToCR(iso: string): string {
  return parseIsoAsCRWallClock(iso).format();
}

/**
 * Returns true if (now_CR - stoppedAt) < windowMs, using precise TZ math.
 */
export function isWithinCentralAmericaWindow(iso: string, windowMs: number): boolean {
  const stoppedAtMs = parseIsoAsCRWallClock(iso).valueOf();
  return nowCRMs() - stoppedAtMs < windowMs;
}


