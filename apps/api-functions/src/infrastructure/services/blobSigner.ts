import {
  BlobSASPermissions,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { getStorageCredentials } from './storageCredentials';
import { config } from '../../config';
import { StorageCredentialsError } from '../../domain/errors/InfrastructureErrors';

/**
 * Returns the configured Azure Storage account name or throws with a clear message.
 * Uses connection string if available, otherwise falls back to AZURE_STORAGE_ACCOUNT.
 *
 * @throws {Error} When credentials cannot be found.
 */
function getAccountName(): string {
  try {
    const credentials = getStorageCredentials();
    return credentials.accountName;
  } catch (error) {
    throw new StorageCredentialsError(
      `AZURE_STORAGE_ACCOUNT is not set and connection string parsing failed: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Returns the configured container name used for recordings (defaults to "recordings").
 */
function getContainerName(): string {
  return config.recordingsContainerName;
}

/**
 * Returns the configured account key or throws with a clear message.
 * Uses connection string if available, otherwise falls back to AZURE_STORAGE_KEY.
 *
 * @throws {Error} When credentials cannot be found.
 */
function getAccountKey(): string {
  try {
    const credentials = getStorageCredentials();
    return credentials.accountKey;
  } catch (error) {
    throw new StorageCredentialsError(
      `AZURE_STORAGE_KEY is not set and connection string parsing failed: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Normalizes a blob path by removing any leading slashes.
 *
 * @example
 * normalizePath("/foo/bar.mp4") // "foo/bar.mp4"
 */
function normalizePath(path: string): string {
  return (path || "").replace(/^\/+/, "");
}

/**
 * Builds a public HTTPS URL (without SAS) for a blob path inside the configured container.
 *
 * @param path - Relative blob path. Leading slashes are ignored.
 * @returns The HTTPS URL to the blob (no SAS token).
 *
 * @remarks
 * - This does not validate that the blob actually exists.
 * - Uses `AZURE_STORAGE_ACCOUNT` and `RECORDINGS_CONTAINER_NAME` (default `"recordings"`).
 */
export function buildBlobHttpsUrl(path: string): string {
  const account = getAccountName();
  const container = getContainerName();
  const clean = normalizePath(path);
  // encodeURI preserves "/" so nested folders remain intact.
  return `https://${account}.blob.core.windows.net/${container}/${encodeURI(clean)}`;
}

/**
 * Generates a temporary **read-only** SAS URL for a blob in a specific container.
 *
 * @param path - Relative blob path within the container (no leading slash required).
 * @param containerName - Name of the Azure Blob Storage container.
 * @param minutes - SAS validity in minutes (default: 120, min: 1).
 * @returns Full HTTPS URL including the SAS query string.
 *
 * @remarks
 * - Requires `AZURE_STORAGE_ACCOUNT` and `AZURE_STORAGE_KEY`.
 * - Grants **read** (`r`) permission only.
 * - Prefer not to persist SAS URLs in your database; generate them on demand.
 */
function generateSasUrlForContainer(path: string, containerName: string, minutes: number = 120): string {
  const account = getAccountName();
  const key = getAccountKey();

  if (!containerName) {
    throw new StorageCredentialsError('Container name is required');
  }

  const clean = normalizePath(path);
  const expiresIn = Math.max(1, Math.floor(minutes));
  const expiresOn = new Date(Date.now() + expiresIn * 60 * 1000);

  const cred = new StorageSharedKeyCredential(account, key);

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: clean,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn,
    },
    cred
  ).toString();

  return `https://${account}.blob.core.windows.net/${containerName}/${encodeURI(clean)}?${sas}`;
}

/**
 * Generates a temporary **read-only** SAS URL for a blob.
 *
 * @param path - Relative blob path within the container (no leading slash required).
 * @param minutes - SAS validity in minutes (default: 120, min: 1).
 * @returns Full HTTPS URL including the SAS query string.
 *
 * @remarks
 * - Requires `AZURE_STORAGE_ACCOUNT` and `AZURE_STORAGE_KEY`.
 * - Uses container name from `RECORDINGS_CONTAINER_NAME` (defaults to `"recordings"`).
 * - Grants **read** (`r`) permission only.
 * - Prefer not to persist SAS URLs in your database; generate them on demand.
 */
export function generateReadSasUrl(path: string, minutes: number = 120): string {
  return generateSasUrlForContainer(path, getContainerName(), minutes);
}

/**
 * Generates a temporary **read-only** SAS URL for a snapshot blob.
 *
 * @param path - Relative blob path within the snapshot container (no leading slash required).
 * @param minutes - SAS validity in minutes (default: 120, min: 1).
 * @returns Full HTTPS URL including the SAS query string.
 *
 * @remarks
 * - Requires `AZURE_STORAGE_ACCOUNT` and `AZURE_STORAGE_KEY`.
 * - Uses container name from `SNAPSHOT_CONTAINER_NAME`.
 * - Grants **read** (`r`) permission only.
 * - Used for generating temporary access URLs for snapshot images in private containers.
 */
export function generateSnapshotSasUrl(path: string, minutes: number = 120): string {
  if (!config.snapshotContainerName) {
    throw new StorageCredentialsError('SNAPSHOT_CONTAINER_NAME is not configured');
  }
  return generateSasUrlForContainer(path, config.snapshotContainerName, minutes);
}

/**
 * Convenience object if you prefer a namespaced import.
 */
export const BlobSigner = {
  buildBlobHttpsUrl,
  generateReadSasUrl,
  generateSnapshotSasUrl,
};
