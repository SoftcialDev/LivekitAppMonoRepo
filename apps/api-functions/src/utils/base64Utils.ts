/**
 * @fileoverview Base64 utility functions
 * @description Utilities for base64 encoding/decoding operations
 */

/**
 * Normalizes base64 string by ensuring proper padding if needed.
 * Base64 padding is optional for decoding but part of the standard.
 * 
 * @param base64String - Base64 encoded string
 * @returns Base64 string with proper padding
 */
export function normalizeBase64Padding(base64String: string): string {
  const trimmed = base64String.trim();
  const remainder = trimmed.length % 4;
  
  if (remainder === 0) {
    return trimmed;
  }
  
  return trimmed + '='.repeat(4 - remainder);
}

