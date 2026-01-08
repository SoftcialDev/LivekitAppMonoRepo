/**
 * @fileoverview recordingCredentialValidator - Validates Azure Storage credentials for recording
 * @summary Provides credential validation logic for recording operations
 * @description Centralizes credential validation to ensure proper format before use
 */

import { getStorageCredentials } from './storageCredentials';
import { config } from '../../config';
import { StorageCredentialsError, ConfigurationError } from '../../domain/errors/InfrastructureErrors';

/**
 * Validates Azure Storage account key format
 * @param accountKey - Base64 encoded account key
 * @throws Error if key is invalid
 */
export function validateAccountKey(accountKey: string): void {
  try {
    const decoded = Buffer.from(accountKey, 'base64');
    if (decoded.length !== 64) {
      throw new ConfigurationError(
        `AZURE_STORAGE_KEY must decode to exactly 64 bytes (got ${decoded.length}). Expected ~88 base64 characters.`
      );
    }
  } catch (base64Error) {
    if (base64Error instanceof ConfigurationError) {
      throw base64Error;
    }
    throw new StorageCredentialsError(
      `Invalid AZURE_STORAGE_KEY: ${base64Error instanceof Error ? base64Error.message : String(base64Error)}`,
      base64Error instanceof Error ? base64Error : new Error(String(base64Error))
    );
  }
}

/**
 * Gets and validates Azure Storage credentials
 * @returns Validated credentials with account name and key
 * @throws Error if credentials are missing or invalid
 */
export function getValidatedStorageCredentials(): {
  accountName: string;
  accountKey: string;
  containerName: string;
  credentialsSource: string;
} {
  let accountName: string;
  let accountKey: string;

  try {
    const credentials = getStorageCredentials();
    accountName = credentials.accountName.trim();
    accountKey = credentials.accountKey.trim();
  } catch (error) {
    throw new StorageCredentialsError(
      `Failed to get Azure Storage credentials: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : new Error(String(error))
    );
  }

  if (!accountName || !accountKey) {
    throw new ConfigurationError(
      'AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY are required for direct Azure upload.'
    );
  }

  validateAccountKey(accountKey);

  const containerName = config.recordingsContainerName;
  const hasConnectionString = !!config.storageConnectionString;
  const credentialsSource = hasConnectionString ? 'connection_string' : 'individual_vars';

  return {
    accountName,
    accountKey,
    containerName,
    credentialsSource,
  };
}

