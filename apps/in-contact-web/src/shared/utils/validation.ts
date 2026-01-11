/**
 * @fileoverview Validation utilities
 * @summary Common validation functions for data validation
 * @description Reusable validation utilities for URLs, strings, and other common data types
 */

/**
 * Validates that a URL string is well-formed and valid
 * 
 * Uses the browser's URL constructor to validate the URL format.
 * Returns true if the URL is valid, false otherwise.
 * 
 * @param url - URL string to validate
 * @returns True if the URL is valid, false otherwise
 * 
 * @example
 * ```typescript
 * if (isValidUrl(apiUrl)) {
 *   // Use the URL
 * } else {
 *   throw new ConfigurationError('Invalid URL format');
 * }
 * ```
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a string is not empty after trimming
 * 
 * @param value - String value to validate
 * @returns True if the string has content after trimming, false otherwise
 */
export function isNonEmptyString(value: string): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

