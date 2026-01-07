/**
 * @fileoverview blobUrlParser - Utility for parsing Azure Blob Storage URLs
 * @summary Extracts blob paths from full Azure Blob URLs
 * @description Provides utilities for working with Azure Blob Storage URLs
 */

import { config } from '../config';
import { getStorageCredentials } from '../infrastructure/services/storageCredentials';

/**
 * Attempts to derive the relative blob path from a full Azure Blob URL
 * @param url - Full Azure Blob Storage URL
 * @param containerName - Expected container name (defaults to RECORDINGS_CONTAINER_NAME)
 * @returns Relative blob path or null if URL doesn't match expected format
 */
export function tryParseBlobPathFromUrl(
  url?: string | null,
  containerName?: string
): string | null {
  if (!url) {
    return null;
  }

  try {
    const u = new URL(url);

    let accountName: string;
    try {
      const credentials = getStorageCredentials();
      accountName = credentials.accountName;
    } catch {
      accountName = config.accountName || '';
    }

    const expectedHost = `${accountName}.blob.core.windows.net`;
    if (u.hostname !== expectedHost) {
      return null;
    }

    const container = containerName || config.recordingsContainerName;
    const parts = u.pathname.replace(/^\/+/, '').split('/');
    if (parts.shift() !== container) {
      return null;
    }

    return decodeURI(parts.join('/'));
  } catch {
    return null;
  }
}

