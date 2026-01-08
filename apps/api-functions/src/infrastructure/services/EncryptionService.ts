import crypto from 'crypto';
import { ConfigurationError, EncryptionError } from '../../domain/errors/InfrastructureErrors';

const IV_LENGTH = 12; // AES-GCM standard IV size in bytes
const AUTH_TAG_LENGTH = 16; // Auth tag size produced by AES-GCM

/**
 * Symmetric encryption helper that wraps AES-256-GCM for short secrets such as passwords.
 * The service expects a base64-encoded 256-bit key supplied through configuration.
 */
export class EncryptionService {
  private readonly key: Buffer;
  private readonly usesDefaultKey: boolean;

  /**
   * Creates a new AES-256-GCM encryption service.
   *
   * @param base64Key - Base64 string representing a 32-byte encryption key.
   * @param options.onDefaultKey - Optional callback executed when the caller signals a default key is in use.
   * @throws Error if the key is missing or does not decode to 32 bytes.
   */
  constructor(base64Key: string, options?: { onDefaultKey?: () => void }) {
    if (!base64Key) {
      throw new ConfigurationError('Encryption key is required');
    }

    const decoded = Buffer.from(base64Key, 'base64');
    if (decoded.length !== 32) {
      throw new ConfigurationError('Encryption key must decode to 32 bytes (256 bits)');
    }

    this.key = decoded;
    this.usesDefaultKey = Boolean(options?.onDefaultKey);
    if (this.usesDefaultKey) {
      options?.onDefaultKey?.();
    }
  }

  /**
   * Encrypts a UTF-8 string and returns a base64 payload containing IV, auth tag, and ciphertext.
   *
   * @param plainText - Clear-text value to encrypt.
   * @returns Base64 string formatted as [IV | auth tag | ciphertext].
   */
  encrypt(plainText: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const cipherText = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, cipherText]).toString('base64');
  }

  /**
   * Decrypts a base64 payload produced by {@link encrypt}.
   *
   * @param payload - Base64 string containing IV, auth tag, and ciphertext.
   * @returns The original UTF-8 string.
   * @throws Error if authentication fails or the payload is malformed.
   */
  decrypt(payload: string): string {
    const buffer = Buffer.from(payload, 'base64');
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const cipherText = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
    return decrypted.toString('utf8');
  }
}

