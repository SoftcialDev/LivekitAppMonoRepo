/**
 * @fileoverview Cryptographic utilities
 * @summary Secure random number generation utilities
 * @description Provides cryptographically secure random number generation functions
 * using the Web Crypto API instead of Math.random() for better security
 */

/**
 * Generates a cryptographically secure random integer within a specified range
 *
 * Uses the Web Crypto API's `crypto.getRandomValues()` which provides
 * cryptographically strong random values suitable for security-sensitive
 * operations. This is preferred over `Math.random()` which uses a
 * pseudorandom number generator that is not cryptographically secure.
 *
 * The function generates a random 32-bit unsigned integer and normalizes
 * it to the specified range [0, max) using modulo arithmetic.
 *
 * @param max - Maximum value (exclusive). Must be greater than 0
 * @returns A random integer in the range [0, max)
 * @throws {RangeError} If max is less than or equal to 0
 */
export function getSecureRandomInt(max: number): number {
  if (max <= 0) {
    throw new RangeError('max must be greater than 0');
  }

  // Generate a cryptographically secure random 32-bit unsigned integer
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);

  // Normalize the random value to the range [0, max)
  // Using division by (0xFFFFFFFF + 1) to get a value in [0, 1)
  // then multiply by max and floor to get an integer in [0, max)
  const normalized = array[0] / (0xffffffff + 1);
  return Math.floor(normalized * max);
}

/**
 * Generates a cryptographically secure random floating-point number in [0, 1)
 *
 * Uses the Web Crypto API to generate a secure random value. This is useful
 * when you need a random float for calculations that require cryptographic
 * security guarantees.
 *
 * @returns A random floating-point number in the range [0, 1)
 *
 * ```
 */
export function getSecureRandomFloat(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
}

