/**
 * @fileoverview Utilities for resolving the service account encryption key.
 */

const FALLBACK_KEY_BYTES = Buffer.from('incontact-svc-account-key-123xyz');

/**
 * Base64-encoded development key used when a valid key is not provided.
 */
export const DEFAULT_SERVICE_ACCOUNT_KEY = FALLBACK_KEY_BYTES.toString('base64');

/**
 * Resolves the AES key used to encrypt the service account password.
 *
 * @returns Base64 string representing a 32-byte key.
 */
export function getServiceAccountEncryptionKey(): string {
  const rawKey = process.env.SERVICE_ACCOUNT_ENCRYPTION_KEY;

  if (!rawKey) {
    console.warn(
      '[config] SERVICE_ACCOUNT_ENCRYPTION_KEY not provided. Using default development key; update this value in production.'
    );
    return DEFAULT_SERVICE_ACCOUNT_KEY;
  }

  try {
    const decoded = Buffer.from(rawKey, 'base64');
    if (decoded.length !== 32) {
      throw new Error('Invalid key length');
    }
    return rawKey;
  } catch (error) {
    console.warn(
      '[config] SERVICE_ACCOUNT_ENCRYPTION_KEY is invalid. Falling back to deterministic development key.'
    );
    return DEFAULT_SERVICE_ACCOUNT_KEY;
  }
}


