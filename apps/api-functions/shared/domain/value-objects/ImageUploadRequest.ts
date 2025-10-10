/**
 * @fileoverview ImageUploadRequest - Value object for image upload requests
 * @description Represents a request to upload an image to blob storage
 */

import { getCentralAmericaTime } from '../../utils/dateUtils';

/**
 * Value object representing an image upload request
 */
export class ImageUploadRequest {
  public readonly base64Data: string;
  public readonly senderId: string;
  public readonly timestamp: Date;

  constructor(base64Data: string, senderId: string) {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error('Base64 data must be a non-empty string');
    }

    if (!senderId || typeof senderId !== 'string') {
      throw new Error('Sender ID must be a non-empty string');
    }

    // Validate base64 format
    try {
      Buffer.from(base64Data, 'base64');
    } catch (error) {
      throw new Error('Invalid base64 format');
    }

    this.base64Data = base64Data;
    this.senderId = senderId;
    this.timestamp = getCentralAmericaTime();
  }

  /**
   * Gets the file name for the image upload
   * @returns Formatted file name
   */
  getFileName(): string {
    const dateString = this.timestamp.toISOString().slice(0, 10);
    const timestamp = this.timestamp.getTime();
    return `${dateString}/${this.senderId}-${timestamp}.jpg`;
  }

  /**
   * Gets the image buffer from base64 data
   * @returns Buffer containing image data
   */
  getImageBuffer(): Buffer {
    return Buffer.from(this.base64Data, 'base64');
  }

  /**
   * Gets the content type for the image
   * @returns MIME type for JPEG images
   */
  getContentType(): string {
    return 'image/jpeg';
  }
}
