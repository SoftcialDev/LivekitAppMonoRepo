/**
 * Canonical result values for per-device attempt outcomes during camera start.
 */
export enum AttemptResult {
  OK = 'ok',
  NotReadableError = 'NotReadableError',
  Other = 'other',
}

/**
 * Normalized representation of a single device attempt outcome.
 */
export interface NormalizedAttempt {
  label?: string | null;
  deviceIdHash?: string | null;
  result: AttemptResult;
  errorName?: string;
  errorMessage?: string;
}

/**
 * Normalized representation of a media device snapshot entry.
 */
export interface NormalizedDevice {
  label: string | null;
  deviceIdHash: string | null;
  vendorId?: string;
  productId?: string;
}


