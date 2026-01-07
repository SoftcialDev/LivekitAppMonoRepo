/**
 * @fileoverview stringHelpers - Utility functions for string operations
 * @summary Provides helper functions for common string operations
 * @description Utility functions for checking string emptiness and non-emptiness
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

