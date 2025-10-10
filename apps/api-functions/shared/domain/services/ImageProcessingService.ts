/**
 * @fileoverview ImageProcessingService - Domain service for image processing operations
 * @description Handles business logic for image processing and validation
 */

import { IBlobStorageService } from '../interfaces/IBlobStorageService';
import { ImageUploadRequest } from '../value-objects/ImageUploadRequest';

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
    } catch (error: any) {
      throw new Error(`Failed to process and upload image: ${error.message}`);
    }
  }

  /**
   * Validates image data
   * @param base64Data - Base64 encoded image data
   * @returns True if valid, false otherwise
   */
  validateImageData(base64Data: string): boolean {
    try {
      if (!base64Data || typeof base64Data !== 'string') {
        return false;
      }

      // Try to create buffer to validate base64 format
      Buffer.from(base64Data, 'base64');
      return true;
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
