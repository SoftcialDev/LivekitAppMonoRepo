import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(tz);

/**
 * IANA timezone for Central America (Costa Rica).
 */
export const CR_TZ = "America/Costa_Rica";

/**
 * Returns an ISO-8601 string with explicit -06:00 offset for Costa Rica time.
 *
 * @example "2025-08-12T14:03:21-06:00"
 */
export function nowCRIso(): string {
  return dayjs().tz(CR_TZ).format(); // keeps offset in the string
}
