import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

/**
 * Service for uploading and downloading snapshot images to Azure Blob Storage.
 */
class BlobService {
  private containerClient: ContainerClient;

  /**
   * Initializes the BlobService using environment configuration.
   * @throws Error if required environment variables are missing.
   */
  constructor() {
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.SNAPSHOT_CONTAINER_NAME;
    if (!connStr || !containerName) {
      throw new Error("Azure Storage connection string or container name is not defined in environment variables.");
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  /**
   * Uploads a snapshot image to Azure Blob Storage.
   *
   * @param buffer - The Buffer containing the image data.
   * @param filename - The name (including path) under which to store the blob (e.g., "2025/07/22/uuid.jpg").
   * @param contentType - The MIME type of the image. Defaults to "image/jpeg".
   * @returns The URL of the uploaded blob.
   * @throws Error if the upload operation fails.
   */
  async uploadSnapshot(
    buffer: Buffer,
    filename: string,
    contentType: string = "image/jpeg"
  ): Promise<string> {
    const blobClient = this.containerClient.getBlockBlobClient(filename);
    await blobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: contentType }
    });
    return blobClient.url;
  }

  /**
   * Downloads a snapshot blob from Azure Blob Storage as a Buffer.
   *
   * @param blobName - The name (including path) of the blob to download.
   * @returns A Buffer containing the blob data.
   * @throws Error if the download operation fails.
   */
  async downloadSnapshot(blobName: string): Promise<Buffer> {
    const blobClient = this.containerClient.getBlockBlobClient(blobName);
    const downloadResponse = await blobClient.download();
    const chunks: Buffer[] = [];
    for await (const chunk of downloadResponse.readableStreamBody!) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}

/**
 * Singleton instance of BlobService for use across the application.
 */
export const blobService = new BlobService();
