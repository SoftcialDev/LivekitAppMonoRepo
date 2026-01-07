/**
 * @fileoverview IBlobStorageService - Interface for blob storage operations
 * @description Defines the contract for blob storage services
 */

import { ImageUploadRequest } from '../value-objects/ImageUploadRequest';

/**
 * Interface for blob storage service
 */
export interface IBlobStorageService {
  /**
   * Uploads an image to blob storage
   * @param request - Image upload request
   * @returns Promise that resolves to the uploaded image URL
   * @throws Error if upload fails
   */
  uploadImage(request: ImageUploadRequest): Promise<string>;

  /**
   * Downloads an image from blob storage
   * @param blobName - Name of the blob to download
   * @returns Promise that resolves to image buffer
   * @throws Error if download fails
   */
  downloadImage(blobName: string): Promise<Buffer>;

  /**
   * Deletes an image from blob storage
   * @param blobName - Name of the blob to delete
   * @returns Promise that resolves to true if deleted, false if not found
   * @throws Error if deletion fails
   */
  deleteImage(blobName: string): Promise<boolean>;

  /**
   * Deletes a recording from blob storage by path
   * @param blobPath - Path of the recording blob to delete
   * @returns Promise that resolves to true if deleted, false if not found
   * @throws Error if deletion fails
   */
  deleteRecordingByPath(blobPath: string): Promise<boolean>;
}
