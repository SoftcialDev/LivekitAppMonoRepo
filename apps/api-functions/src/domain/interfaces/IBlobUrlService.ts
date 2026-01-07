/**
 * @fileoverview IBlobUrlService - Interface for blob URL generation operations
 * @summary Defines contract for blob URL and SAS URL generation
 * @description Provides abstraction for blob URL generation in infrastructure layer
 */

/**
 * Interface for blob URL generation operations
 * @description Handles generation of blob URLs and SAS URLs for secure access
 */
export interface IBlobUrlService {
  /**
   * Builds a full HTTPS URL for a blob path
   * @param blobPath - Relative blob path
   * @returns Full HTTPS URL to the blob
   */
  buildBlobHttpsUrl(blobPath: string): string;

  /**
   * Generates a read-only SAS URL for a blob
   * @param blobPath - Relative blob path
   * @param minutes - Validity period in minutes (minimum 1)
   * @returns SAS URL with read permissions
   */
  generateReadSasUrl(blobPath: string, minutes: number): string;
}

