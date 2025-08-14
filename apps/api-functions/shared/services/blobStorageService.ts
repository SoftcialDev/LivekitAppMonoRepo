import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

/**
 * Service for uploading and downloading snapshot images to Azure Blob Storage.
 */
class BlobService {
  private containerClient: ContainerClient;
  private recordingsContainer?: ContainerClient;

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

  /**
   * Deletes a **recording** blob by its relative path within the recordings container.
   *
   * This method targets the container defined by the `RECORDINGS_CONTAINER_NAME` environment variable,
   * which is typically different from the snapshots container.
   *
   * @param blobPath - Relative path to the recording blob (e.g., "user/2025/08/13/room-123.mp4").
   * @returns `true` if the blob existed and was deleted, `false` if it did not exist.
   * @throws Error if the recordings container is not configured or the delete operation fails unexpectedly.
   */
  async deleteRecordingByPath(blobPath: string): Promise<boolean> {
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const recordingsContainerName = process.env.RECORDINGS_CONTAINER_NAME;
    if (!connStr || !recordingsContainerName) {
      throw new Error("Azure Storage connection string or recordings container name is not defined in environment variables.");
    }

    // Lazily initialize the recordings container client the first time this method is called.
    if (!this.recordingsContainer) {
      const svc = BlobServiceClient.fromConnectionString(connStr);
      this.recordingsContainer = svc.getContainerClient(recordingsContainerName);
    }

    const client = this.recordingsContainer.getBlockBlobClient(blobPath);
    const res = await client.deleteIfExists();
    return Boolean(res.succeeded);
  }
}

/**
 * Singleton instance of BlobService for use across the application.
 */
export const blobService = new BlobService();
