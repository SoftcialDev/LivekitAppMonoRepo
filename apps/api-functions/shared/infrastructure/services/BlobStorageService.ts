/**
 * @fileoverview BlobStorageService - Infrastructure service for blob storage operations
 * @description Implements blob storage operations using Azure Blob Storage
 */

import { IBlobStorageService } from '../../domain/interfaces/IBlobStorageService';
import { ImageUploadRequest } from '../../domain/value-objects/ImageUploadRequest';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

/**
 * Infrastructure service for blob storage operations
 */
export class BlobStorageService implements IBlobStorageService {
  private containerClient: ContainerClient;

  constructor() {
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.SNAPSHOT_CONTAINER_NAME;
    
    if (!connStr || !containerName) {
      throw new Error('Azure Storage connection string or container name is not defined in environment variables.');
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
    } catch (error: any) {
      throw new Error(`Failed to upload image: ${error.message}`);
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
    } catch (error: any) {
      throw new Error(`Failed to download image: ${error.message}`);
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
    } catch (error: any) {
      throw new Error(`Failed to delete image: ${error.message}`);
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
    } catch (error: any) {
      throw new Error(`Failed to delete recording: ${error.message}`);
    }
  }
}
