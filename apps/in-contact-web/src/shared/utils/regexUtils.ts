/**
 * @fileoverview Regex utilities for safe pattern matching
 * @summary Safe regex operations to prevent ReDoS attacks
 * @description Provides safe regex utilities that prevent regular expression
 * denial of service (ReDoS) by limiting input length and using optimized patterns
 */

/**
 * Maximum length for email validation to prevent ReDoS
 */
const MAX_EMAIL_LENGTH = 255;

/**
 * Safe email validation regex pattern
 * Uses anchored pattern with character class to prevent catastrophic backtracking
 */
const SAFE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates email format safely to prevent ReDoS
 * Limits input length before applying regex to prevent denial of service attacks
 * @param email - Email string to validate
 * @returns True if email format is valid, false otherwise
 */
export function isValidEmailFormat(email: string): boolean {
  if (typeof email !== 'string' || email.length === 0 || email.length > MAX_EMAIL_LENGTH) {
    return false;
  }
  return SAFE_EMAIL_REGEX.test(email);
}

