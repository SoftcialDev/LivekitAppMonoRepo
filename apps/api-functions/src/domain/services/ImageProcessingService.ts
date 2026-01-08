/**
 * @fileoverview ImageProcessingService - Domain service for image processing operations
 * @description Handles business logic for image processing and validation
 */

import { IBlobStorageService } from '../interfaces/IBlobStorageService';
import { ImageUploadRequest } from '../value-objects/ImageUploadRequest';
import { ApplicationError } from '../errors/DomainError';
import { ApplicationErrorCode } from '../errors/ErrorCodes';
import { extractErrorMessage } from '../../utils/error/ErrorHelpers';

/**
 * Domain service for image processing operations
 */
export class ImageProcessingService {
  constructor(private blobStorageService: IBlobStorageService) {}

  /**
   * Processes and uploads an image
   * @param base64Data - Base64 encoded image data
   * @param senderId - ID of the user uploading the image
   * @returns Promise that resolves to the uploaded image URL
   * @throws Error if processing fails
   */
  async processAndUploadImage(base64Data: string, senderId: string): Promise<string> {
    try {
      // Create image upload request
      const imageRequest = new ImageUploadRequest(base64Data, senderId);

      // Upload to blob storage
      const imageUrl = await this.blobStorageService.uploadImage(imageRequest);

      return imageUrl;
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);
      throw new ApplicationError(`Failed to process and upload image: ${errorMessage}`, ApplicationErrorCode.OPERATION_FAILED);
    }
  }

  /**
   * Validates image data
   * @param base64Data - Base64 encoded image data
   * @returns True if valid, false otherwise
   */
  validateImageData(base64Data: string): boolean {
    if (!base64Data || typeof base64Data !== 'string') {
      return false;
    }

    // Strict base64 validation: valid chars and proper padding
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    if (!base64Regex.test(base64Data)) {
      return false;
    }

    // Decode and re-encode to ensure integrity (ignoring padding differences)
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const reencoded = buffer.toString('base64');
      const stripPad = (s: string) => s.replace(/=+$/, '');
      return stripPad(reencoded) === stripPad(base64Data);
    } catch {
      return false;
    }
  }

  /**
   * Gets image metadata
   * @param base64Data - Base64 encoded image data
   * @returns Image metadata
   */
  getImageMetadata(base64Data: string): { size: number; contentType: string } {
    const buffer = Buffer.from(base64Data, 'base64');
    return {
      size: buffer.length,
      contentType: 'image/jpeg'
    };
  }
}
