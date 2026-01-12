/**
 * @fileoverview StorageDetailsService - Infrastructure service for storage details
 * @summary Provides storage environment variable details for health checks
 * @description Infrastructure service that extracts and validates storage configuration details
 */

import { StorageDetails } from '../../domain/types/HealthCheckTypes';
import { getStorageCredentials } from './storageCredentials';
import { config } from '../../config';
import { isNotEmpty } from '../../utils/stringHelpers';

/**
 * Infrastructure service for storage details
 * @description Handles extraction and validation of Azure Storage environment variables
 */
export class StorageDetailsService {
  /**
   * Creates storage variable details for account name
   * @param accountName - Account name value
   * @returns Storage variable details
   */
  private createAccountNameDetails(accountName: string | undefined): { exists: boolean; preview?: string; length?: number } {
    if (accountName === undefined) {
      return { exists: false };
    }

    const trimmed = accountName.trim();
    return {
      exists: isNotEmpty(trimmed),
      preview: isNotEmpty(trimmed)
        ? `${trimmed.substring(0, 4)}...${trimmed.substring(trimmed.length - 4)}`
        : undefined,
      length: trimmed.length
    };
  }

  /**
   * Validates base64 encoded account key
   * @param trimmed - Trimmed account key
   * @returns Object with validation results
   */
  private validateAccountKey(trimmed: string): {
    isBase64: boolean;
    base64Validation?: string;
    decodedLength?: number;
    warning?: string;
  } {
    if (isNotEmpty(trimmed) === false) {
      return { isBase64: false };
    }

    try {
      const decoded = Buffer.from(trimmed, 'base64');
      const decodedLength = decoded.length;
      const isBase64 = true;
      
      let expectedLengthWarning: string | undefined;
      if (decodedLength !== 64) {
        expectedLengthWarning = `Expected 64 bytes when decoded (got ${decodedLength}). Azure Storage keys should be ~88 base64 characters.`;
      }
      
      return {
        isBase64,
        base64Validation: expectedLengthWarning ? `valid but ${expectedLengthWarning}` : "valid",
        decodedLength,
        warning: expectedLengthWarning
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        isBase64: false,
        base64Validation: errorMessage
      };
    }
  }

  /**
   * Creates storage variable details for account key
   * @param accountKey - Account key value
   * @returns Storage variable details
   */
  private createAccountKeyDetails(accountKey: string | undefined): {
    exists: boolean;
    preview?: string;
    length?: number;
    isBase64?: boolean;
    base64Validation?: string;
    decodedLength?: number;
    warning?: string;
  } {
    if (accountKey === undefined) {
      return { exists: false };
    }

    const trimmed = accountKey.trim();
    const validation = this.validateAccountKey(trimmed);

    return {
      exists: isNotEmpty(trimmed),
      preview: isNotEmpty(trimmed)
        ? `${trimmed.substring(0, 8)}...${trimmed.substring(trimmed.length - 8)}`
        : undefined,
      length: trimmed.length,
      isBase64: isNotEmpty(trimmed) ? validation.isBase64 : undefined,
      base64Validation: isNotEmpty(trimmed) ? validation.base64Validation : undefined,
      decodedLength: isNotEmpty(trimmed) && validation.isBase64 ? validation.decodedLength : undefined,
      warning: validation.warning
    };
  }

  /**
   * Creates storage variable details for connection string
   * @param connectionString - Connection string value
   * @returns Storage variable details
   */
  private createConnectionStringDetails(connectionString: string | undefined): {
    exists: boolean;
    preview?: string;
    length?: number;
  } {
    if (connectionString === undefined) {
      return { exists: false };
    }

    const trimmed = connectionString.trim();
    return {
      exists: isNotEmpty(trimmed),
      preview: isNotEmpty(trimmed)
        ? `${trimmed.substring(0, 20)}...${trimmed.substring(trimmed.length - 20)}`
        : undefined,
      length: trimmed.length
    };
  }

  /**
   * Creates storage variable details for container name
   * @param containerName - Container name value
   * @returns Storage variable details
   */
  private createContainerDetails(containerName: string | undefined): {
    exists: boolean;
    value?: string;
  } {
    if (containerName === undefined) {
      return { exists: false };
    }

    const trimmed = containerName.trim();
    const exists = isNotEmpty(trimmed);
    return {
      exists,
      value: exists ? trimmed : undefined
    };
  }

  /**
   * Creates resolved credentials details
   * @param resolvedAccountKey - Resolved account key
   * @param resolvedAccountName - Resolved account name
   * @param credentialsSource - Source of credentials
   * @returns Storage details for resolved credentials
   */
  private createResolvedCredentialsDetails(
    resolvedAccountKey: string | undefined,
    resolvedAccountName: string | undefined,
    credentialsSource: string | undefined
  ): Partial<StorageDetails> {
    if (resolvedAccountKey === undefined || resolvedAccountKey === '') {
      return {};
    }

    const resolvedTrimmed = resolvedAccountKey.trim();
    const validation = this.validateAccountKey(resolvedTrimmed);

    const details: Partial<StorageDetails> = {
      RESOLVED_ACCOUNT_KEY: {
        exists: true,
        preview: isNotEmpty(resolvedTrimmed)
          ? `${resolvedTrimmed.substring(0, 8)}...${resolvedTrimmed.substring(resolvedTrimmed.length - 8)}`
          : undefined,
        length: resolvedTrimmed.length,
        isBase64: validation.isBase64,
        decodedLength: validation.decodedLength,
        warning: validation.warning,
        source: credentialsSource
      }
    };

    if (resolvedAccountName) {
      details.RESOLVED_ACCOUNT_NAME = {
        exists: true,
        preview: `${resolvedAccountName.substring(0, 4)}...${resolvedAccountName.substring(resolvedAccountName.length - 4)}`,
        length: resolvedAccountName.length,
        source: credentialsSource
      };
    }

    return details;
  }

  /**
   * Gets partial details for Azure Storage environment variables
   * Shows previews and validation info without exposing full values
   * @returns Partial storage variable details (previews, lengths, base64 validation)
   */
  getStorageDetails(): StorageDetails {
    const details: StorageDetails = {
      AZURE_STORAGE_ACCOUNT: this.createAccountNameDetails(config.accountName),
      AZURE_STORAGE_KEY: this.createAccountKeyDetails(config.accountKey),
      AZURE_STORAGE_CONNECTION_STRING: this.createConnectionStringDetails(config.storageConnectionString),
      RECORDINGS_CONTAINER_NAME: this.createContainerDetails(config.recordingsContainerName),
      SNAPSHOT_CONTAINER_NAME: this.createContainerDetails(config.snapshotContainerName)
    };

    // Try to resolve credentials using getStorageCredentials to see what will actually be used
    let resolvedAccountName: string | undefined;
    let resolvedAccountKey: string | undefined;
    let credentialsSource: string | undefined;
    
    try {
      const resolved = getStorageCredentials();
      resolvedAccountName = resolved.accountName;
      resolvedAccountKey = resolved.accountKey;
      credentialsSource = config.storageConnectionString ? 'connection_string' : 'individual_vars';
    } catch {
      // Error resolving credentials - mark source as error
      // Error is intentionally ignored as fallback behavior is to mark source as 'error'
      credentialsSource = 'error';
    }

    const resolvedDetails = this.createResolvedCredentialsDetails(
      resolvedAccountKey,
      resolvedAccountName,
      credentialsSource
    );

    return { ...details, ...resolvedDetails };
  }
}

