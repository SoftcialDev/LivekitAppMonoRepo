/**
 * @fileoverview stringHelpers - Utility functions for string operations
 * @summary Provides helper functions for common string operations
 * @description Utility functions for checking string emptiness and non-emptiness, and converting unknown values to strings
 */

/**
 * Checks if a string is empty or contains only whitespace
 * @param value - String value to check
 * @returns True if the string is empty or contains only whitespace, false otherwise
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim() === '';
}

/**
 * Checks if a string is not empty and contains non-whitespace characters
 * @param value - String value to check
 * @returns True if the string is not empty and contains non-whitespace characters, false otherwise
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  return !isEmpty(value);
}

/**
 * Converts an unknown value to a string safely
 * 
 * Handles objects by JSON.stringify, null/undefined by default value, and primitive types.
 * This function is designed to avoid uninformative object stringification (e.g., '[object Object]').
 * 
 * @param value - Value to convert to string
 * @param defaultValue - Default value to use if value is null/undefined
 * @returns String representation of the value
 */
export function unknownToString(value: unknown, defaultValue: string = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return defaultValue;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  // At this point, value is a primitive (number, boolean, symbol, bigint, function, undefined)
  // Handle each primitive type explicitly to avoid object stringification
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }
  if (typeof value === 'function') {
    return value.toString();
  }
  // This should never be reached in practice, but provide a safe fallback
  return defaultValue;
}

