/**
 * @fileoverview StorageDetailsService - Infrastructure service for storage details
 * @summary Provides storage environment variable details for health checks
 * @description Infrastructure service that extracts and validates storage configuration details
 */

import { StorageDetails } from '../../domain/types/HealthCheckTypes';
import { getStorageCredentials } from '../../index';

/**
 * Infrastructure service for storage details
 * @description Handles extraction and validation of Azure Storage environment variables
 */
export class StorageDetailsService {
  /**
   * Gets partial details for Azure Storage environment variables
   * Shows previews and validation info without exposing full values
   * @returns Partial storage variable details (previews, lengths, base64 validation)
   */
  getStorageDetails(): StorageDetails {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT;
    const accountKey = process.env.AZURE_STORAGE_KEY;
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const recordingsContainer = process.env.RECORDINGS_CONTAINER_NAME;
    const snapshotContainer = process.env.SNAPSHOT_CONTAINER_NAME;

    const details: StorageDetails = {};
    
    // Try to resolve credentials using getStorageCredentials to see what will actually be used
    let resolvedAccountName: string | undefined;
    let resolvedAccountKey: string | undefined;
    let credentialsSource: string | undefined;
    
    try {
      const resolved = getStorageCredentials();
      resolvedAccountName = resolved.accountName;
      resolvedAccountKey = resolved.accountKey;
      credentialsSource = connectionString ? 'connection_string' : 'individual_vars';
    } catch (err) {
      credentialsSource = 'error';
    }

    if (accountName !== undefined) {
      const trimmed = accountName.trim();
      details.AZURE_STORAGE_ACCOUNT = {
        exists: trimmed.length > 0,
        preview: trimmed.length > 0
          ? `${trimmed.substring(0, 4)}...${trimmed.substring(trimmed.length - 4)}`
          : undefined,
        length: trimmed.length
      };
    } else {
      details.AZURE_STORAGE_ACCOUNT = { exists: false };
    }

    if (accountKey !== undefined) {
      const trimmed = accountKey.trim();
      let isBase64 = false;
      let base64Validation: string | undefined;
      let decodedLength: number | undefined;
      let expectedLengthWarning: string | undefined;
      
      if (trimmed.length > 0) {
        try {
          const decoded = Buffer.from(trimmed, 'base64');
          decodedLength = decoded.length;
          isBase64 = true;
          
          // Azure Storage keys are 64 bytes when decoded, which is ~88 chars in base64
          // Warn if the decoded length is not 64 bytes
          if (decodedLength !== 64) {
            expectedLengthWarning = `Expected 64 bytes when decoded (got ${decodedLength}). Azure Storage keys should be ~88 base64 characters.`;
          }
          
          base64Validation = expectedLengthWarning ? `valid but ${expectedLengthWarning}` : "valid";
        } catch (err) {
          isBase64 = false;
          base64Validation = err instanceof Error ? err.message : String(err);
        }
      }

      details.AZURE_STORAGE_KEY = {
        exists: trimmed.length > 0,
        preview: trimmed.length > 0
          ? `${trimmed.substring(0, 8)}...${trimmed.substring(trimmed.length - 8)}`
          : undefined,
        length: trimmed.length,
        isBase64: trimmed.length > 0 ? isBase64 : undefined,
        base64Validation: trimmed.length > 0 ? base64Validation : undefined,
        decodedLength: trimmed.length > 0 && isBase64 ? decodedLength : undefined,
        warning: expectedLengthWarning
      };
    } else {
      details.AZURE_STORAGE_KEY = { exists: false };
    }
    
    if (resolvedAccountKey) {
      const resolvedTrimmed = resolvedAccountKey.trim();
      let resolvedIsBase64 = false;
      let resolvedDecodedLength: number | undefined;
      let resolvedWarning: string | undefined;
      
      if (resolvedTrimmed.length > 0) {
        try {
          const decoded = Buffer.from(resolvedTrimmed, 'base64');
          resolvedDecodedLength = decoded.length;
          resolvedIsBase64 = true;
          
          if (resolvedDecodedLength !== 64) {
            resolvedWarning = `Expected 64 bytes when decoded (got ${resolvedDecodedLength}). Azure Storage keys should be ~88 base64 characters.`;
          }
        } catch (err) {
          resolvedIsBase64 = false;
        }
      }
      
      details.RESOLVED_ACCOUNT_KEY = {
        exists: true,
        preview: resolvedTrimmed.length > 0
          ? `${resolvedTrimmed.substring(0, 8)}...${resolvedTrimmed.substring(resolvedTrimmed.length - 8)}`
          : undefined,
        length: resolvedTrimmed.length,
        isBase64: resolvedIsBase64,
        decodedLength: resolvedDecodedLength,
        warning: resolvedWarning,
        source: credentialsSource
      };
      
      if (resolvedAccountName) {
        details.RESOLVED_ACCOUNT_NAME = {
          exists: true,
          preview: `${resolvedAccountName.substring(0, 4)}...${resolvedAccountName.substring(resolvedAccountName.length - 4)}`,
          length: resolvedAccountName.length,
          source: credentialsSource
        };
      }
    }

    if (connectionString !== undefined) {
      const trimmed = connectionString.trim();
      details.AZURE_STORAGE_CONNECTION_STRING = {
        exists: trimmed.length > 0,
        preview: trimmed.length > 0
          ? `${trimmed.substring(0, 20)}...${trimmed.substring(trimmed.length - 20)}`
          : undefined,
        length: trimmed.length
      };
    } else {
      details.AZURE_STORAGE_CONNECTION_STRING = { exists: false };
    }

    if (recordingsContainer !== undefined) {
      details.RECORDINGS_CONTAINER_NAME = {
        exists: recordingsContainer.trim().length > 0,
        value: recordingsContainer.trim() || undefined
      };
    } else {
      details.RECORDINGS_CONTAINER_NAME = { exists: false };
    }

    if (snapshotContainer !== undefined) {
      details.SNAPSHOT_CONTAINER_NAME = {
        exists: snapshotContainer.trim().length > 0,
        value: snapshotContainer.trim() || undefined
      };
    } else {
      details.SNAPSHOT_CONTAINER_NAME = { exists: false };
    }

    return details;
  }
}

