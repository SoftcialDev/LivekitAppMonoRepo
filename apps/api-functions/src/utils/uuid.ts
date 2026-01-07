/**
 * Returns true if `value` is a valid UUID v4 (case-insensitive).
 * Used to decide whether we’re allowed to compare a string against UUID columns.
 */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}
