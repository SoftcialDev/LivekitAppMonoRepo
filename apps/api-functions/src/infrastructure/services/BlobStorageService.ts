/**
 * @fileoverview BlobStorageService - Infrastructure service for blob storage operations
 * @description Implements blob storage operations using Azure Blob Storage
 */

import { IBlobStorageService } from '../../domain/interfaces/IBlobStorageService';
import { ImageUploadRequest } from '../../domain/value-objects/ImageUploadRequest';
import { ConfigurationError } from '../../domain/errors/InfrastructureErrors';
import { wrapBlobStorageUploadError, wrapBlobStorageDownloadError, wrapBlobStorageDeleteError } from '../../utils/error/ErrorHelpers';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { config } from '../../config';

/**
 * Infrastructure service for blob storage operations
 */
export class BlobStorageService implements IBlobStorageService {
  private containerClient: ContainerClient;

  constructor() {
    const connStr = config.storageConnectionString;
    const containerName = config.snapshotContainerName;
    
    if (!connStr && !containerName) {
      throw new ConfigurationError('Missing required environment variables. AZURE_STORAGE_CONNECTION_STRING and SNAPSHOT_CONTAINER_NAME are not defined.');
    }
    
    if (!connStr) {
      throw new ConfigurationError('AZURE_STORAGE_CONNECTION_STRING environment variable is not defined.');
    }
    
    if (!containerName) {
      throw new ConfigurationError('SNAPSHOT_CONTAINER_NAME environment variable is not defined.');
    }
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  /**
   * Uploads an image to blob storage
   * @param request - Image upload request
   * @returns Promise that resolves to the uploaded image URL
   * @throws Error if upload fails
   */
  async uploadImage(request: ImageUploadRequest): Promise<string> {
    try {
      const blobClient = this.containerClient.getBlockBlobClient(request.getFileName());
      const buffer = request.getImageBuffer();
      
      await blobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: request.getContentType() }
      });
      
      return blobClient.url;
    } catch (error: unknown) {
      throw wrapBlobStorageUploadError('Failed to upload image', error);
    }
  }

  /**
   * Downloads an image from blob storage
   * @param blobName - Name of the blob to download
   * @returns Promise that resolves to image buffer
   * @throws Error if download fails
   */
  async downloadImage(blobName: string): Promise<Buffer> {
    try {
      const blobClient = this.containerClient.getBlockBlobClient(blobName);
      const downloadResponse = await blobClient.download();
      
      const chunks: Buffer[] = [];
      for await (const chunk of downloadResponse.readableStreamBody!) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      
      return Buffer.concat(chunks);
    } catch (error: unknown) {
      throw wrapBlobStorageDownloadError('Failed to download image', error);
    }
  }

  /**
   * Deletes an image from blob storage
   * @param blobName - Name of the blob to delete
   * @returns Promise that resolves to true if deleted, false if not found
   * @throws Error if deletion fails
   */
  async deleteImage(blobName: string): Promise<boolean> {
    try {
      const blobClient = this.containerClient.getBlockBlobClient(blobName);
      const result = await blobClient.deleteIfExists();
      return result.succeeded;
    } catch (error: unknown) {
      throw wrapBlobStorageDeleteError('Failed to delete image', error);
    }
  }

  /**
   * Deletes a recording from blob storage by path
   * @param blobPath - Path of the recording blob to delete
   * @returns Promise that resolves to true if deleted, false if not found
   * @throws Error if deletion fails
   */
  async deleteRecordingByPath(blobPath: string): Promise<boolean> {
    try {
      const blobClient = this.containerClient.getBlockBlobClient(blobPath);
      const result = await blobClient.deleteIfExists();
      return result.succeeded;
    } catch (error: unknown) {
      throw wrapBlobStorageDeleteError('Failed to delete recording', error);
    }
  }
}
