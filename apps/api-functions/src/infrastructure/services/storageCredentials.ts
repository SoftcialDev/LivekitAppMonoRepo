/**
 * @fileoverview Storage credentials helper
 * @description Utilities for extracting Azure Storage credentials from connection string or environment variables
 */

import { config } from '../../config';
import { normalizeBase64Padding } from '../../utils/base64Utils';
import { StorageCredentialsError } from '../../domain/errors/InfrastructureErrors';

/**
 * Parses Azure Storage connection string to extract account name and key
 * 
 * @param connectionString - Azure Storage connection string
 * @returns Object with accountName and accountKey, or null if parsing fails
 * 
 * @example
 * const connStr = "DefaultEndpointsProtocol=https;AccountName=mystorage;AccountKey=abc123...;EndpointSuffix=core.windows.net";
 * const creds = parseConnectionString(connStr);
 * // { accountName: "mystorage", accountKey: "abc123..." }
 */
export function parseConnectionString(connectionString: string): {
  accountName: string;
  accountKey: string;
} | null {
  if (!connectionString || typeof connectionString !== 'string') {
    return null;
  }

  const parts = connectionString.split(';');
  let accountName: string | undefined;
  let accountKey: string | undefined;

  for (const part of parts) {
    const [key, value] = part.split('=', 2);
    if (key === 'AccountName') {
      accountName = value;
    } else if (key === 'AccountKey') {
      accountKey = value;
    }
  }

  if (accountName && accountKey) {
    const normalizedKey = normalizeBase64Padding(accountKey);
    return { accountName, accountKey: normalizedKey };
  }

  return null;
}

/**
 * Gets Azure Storage credentials from environment variables.
 * Tries connection string first, then falls back to individual variables.
 * 
 * @returns Object with accountName and accountKey
 * @throws Error if credentials cannot be found
 */
export function getStorageCredentials(): {
  accountName: string;
  accountKey: string;
} {
  if (config.storageConnectionString) {
    const parsed = parseConnectionString(config.storageConnectionString);
    if (parsed) {
      return parsed;
    }
  }

  const accountName = config.accountName;
  const accountKey = config.accountKey;

  if (!accountName || !accountKey) {
    throw new StorageCredentialsError(
      'Azure Storage credentials not found. ' +
      'Provide either AZURE_STORAGE_CONNECTION_STRING or both AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY.'
    );
  }

  return { accountName, accountKey };
}

