/**
 * @fileoverview ImageUploadRequest - Value object for image upload requests
 * @description Represents a request to upload an image to blob storage
 */

import { getCentralAmericaTime } from '../../utils/dateUtils';
import { generateSnapshotFileName, generateSnapshotFolderPath } from '../../utils/fileNameUtils';
import { ValidationError } from '../errors/DomainError';
import { ValidationErrorCode } from '../errors/ErrorCodes';

/**
 * Value object representing an image upload request
 * @description Encapsulates image data and metadata for uploading to blob storage with descriptive file names
 */
export class ImageUploadRequest {
  public readonly base64Data: string;
  public readonly senderId: string;
  public readonly timestamp: Date;
  public readonly psoName?: string;
  public readonly reasonCode?: string;
  public readonly snapshotId?: string;

  /**
   * Creates a new ImageUploadRequest instance
   * @description Validates base64 data and initializes request with optional metadata for descriptive file naming
   * @param base64Data - Base64-encoded image data
   * @param senderId - ID of the user uploading the image
   * @param psoName - Optional PSO name for descriptive file naming
   * @param reasonCode - Optional reason code for descriptive file naming
   * @param snapshotId - Optional snapshot ID for descriptive file naming
   */
  constructor(
    base64Data: string,
    senderId: string,
    psoName?: string,
    reasonCode?: string,
    snapshotId?: string
  ) {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new ValidationError('Base64 data must be a non-empty string', ValidationErrorCode.INVALID_EMAIL_FORMAT);
    }

    if (!senderId || typeof senderId !== 'string') {
      throw new ValidationError('Sender ID must be a non-empty string', ValidationErrorCode.INVALID_EMAIL_FORMAT);
    }

    // Validate base64 format
    try {
      Buffer.from(base64Data, 'base64');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid base64 format';
      throw new ValidationError(`Invalid base64 format: ${errorMessage}`, ValidationErrorCode.INVALID_FORMAT);
    }

    this.base64Data = base64Data;
    this.senderId = senderId;
    this.timestamp = getCentralAmericaTime();
    this.psoName = psoName;
    this.reasonCode = reasonCode;
    this.snapshotId = snapshotId;
  }

  /**
   * Gets the file name for the image upload
   * @description Generates a descriptive file name if psoName, reasonCode, and snapshotId are provided.
   * Otherwise falls back to legacy format (senderId-timestamp.jpg) for backward compatibility.
   * File names are organized in date-based folders (YYYY-MM-DD).
   * @returns Formatted file name with folder path
   */
  getFileName(): string {
    const folderPath = generateSnapshotFolderPath(this.timestamp);

    // Use descriptive format if all required fields are available
    if (this.psoName && this.reasonCode && this.snapshotId) {
      const fileName = generateSnapshotFileName(
        this.psoName,
        this.reasonCode,
        this.timestamp,
        this.snapshotId
      );
      return `${folderPath}/${fileName}`;
    }

    // Fall back to legacy format for backward compatibility
    const timestamp = this.timestamp.getTime();
    return `${folderPath}/${this.senderId}-${timestamp}.jpg`;
  }

  /**
   * Gets the image buffer from base64 data
   * @description Converts the base64-encoded string to a Buffer for blob storage upload
   * @returns Buffer containing image data
   */
  getImageBuffer(): Buffer {
    return Buffer.from(this.base64Data, 'base64');
  }

  /**
   * Gets the content type for the image
   * @description Returns the MIME type for JPEG images used in blob storage HTTP headers
   * @returns MIME type for JPEG images
   */
  getContentType(): string {
    return 'image/jpeg';
  }
}
