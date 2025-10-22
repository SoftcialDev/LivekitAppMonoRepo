import {
  BlobSASPermissions,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";

/**
 * Returns the configured Azure Storage account name or throws with a clear message.
 *
 * @throws {Error} When AZURE_STORAGE_ACCOUNT is missing.
 */
function getAccountName(): string {
  const account = process.env.AZURE_STORAGE_ACCOUNT;
  if (!account) {
    throw new Error("AZURE_STORAGE_ACCOUNT is not set.");
  }
  return account;
}

/**
 * Returns the configured container name used for recordings (defaults to "recordings").
 */
function getContainerName(): string {
  return process.env.RECORDINGS_CONTAINER_NAME || "recordings";
}

/**
 * Returns the configured account key or throws with a clear message.
 *
 * @throws {Error} When AZURE_STORAGE_KEY is missing.
 */
function getAccountKey(): string {
  const key = process.env.AZURE_STORAGE_KEY;
  if (!key) {
    throw new Error("AZURE_STORAGE_KEY is not set.");
  }
  return key;
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
 * @param path - Relative blob path (e.g., `"subject/2025/08/12/room.mp4"`). Leading slashes are ignored.
 * @returns The HTTPS URL to the blob (no SAS token).
 *
 * @remarks
 * - This does not validate that the blob actually exists.
 * - Uses `AZURE_STORAGE_ACCOUNT` and `RECORDINGS_CONTAINER_NAME` (default `"recordings"`).
 *
 * @example
 * ```ts
 * const url = buildBlobHttpsUrl("john/2025/08/12/session.mp4");
 * // -> https://<account>.blob.core.windows.net/<container>/john/2025/08/12/session.mp4
 * ```
 */
export function buildBlobHttpsUrl(path: string): string {
  const account = getAccountName();
  const container = getContainerName();
  const clean = normalizePath(path);
  // encodeURI preserves "/" so nested folders remain intact.
  return `https://${account}.blob.core.windows.net/${container}/${encodeURI(clean)}`;
}

/**
 * Generates a temporary **read-only** SAS URL for a blob.
 *
 * @param path - Relative blob path within the container (no leading slash required).
 * @param minutes - SAS validity in minutes (default: 60, min: 1).
 * @returns Full HTTPS URL including the SAS query string.
 *
 * @remarks
 * - Requires `AZURE_STORAGE_ACCOUNT` and `AZURE_STORAGE_KEY`.
 * - Uses container name from `RECORDINGS_CONTAINER_NAME` (defaults to `"recordings"`).
 * - Grants **read** (`r`) permission only.
 * - Prefer not to persist SAS URLs in your database; generate them on demand.
 *
 * @example
 * ```ts
 * const signed = generateReadSasUrl("john/2025/08/12/session.mp4", 30);
 * // -> https://.../session.mp4?<sas>
 * ```
 */
export function generateReadSasUrl(path: string, minutes: number = 60): string {
  const account = getAccountName();
  const key = getAccountKey();
  const container = getContainerName();

  const clean = normalizePath(path);
  const expiresIn = Math.max(1, Math.floor(minutes));
  const expiresOn = new Date(Date.now() + expiresIn * 60 * 1000);

  const cred = new StorageSharedKeyCredential(account, key);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: container,
      blobName: clean,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn,
      //protocol: SASProtocol.Https, // default is HTTP
    },
    cred
  ).toString();

  return `${buildBlobHttpsUrl(clean)}?${sas}`;
}

/**
 * Convenience object if you prefer a namespaced import.
 *
 * @example
 * ```ts
 * import { BlobSigner } from "../shared/infrastructure/services/blobSigner";
 * const url = BlobSigner.buildBlobHttpsUrl("a/b/c.mp4");
 * const sas = BlobSigner.generateReadSasUrl("a/b/c.mp4", 15);
 * ```
 */
export const BlobSigner = {
  buildBlobHttpsUrl,
  generateReadSasUrl,
};
