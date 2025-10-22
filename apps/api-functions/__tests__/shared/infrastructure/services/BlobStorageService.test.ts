/**
 * @fileoverview Tests for BlobStorageService
 * @description Tests for blob storage operations using Azure Blob Storage
 */

import { BlobStorageService } from '../../../../shared/infrastructure/services/BlobStorageService';
import { ImageUploadRequest } from '../../../../shared/domain/value-objects/ImageUploadRequest';

// Mock Azure Storage Blob SDK
jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: jest.fn().mockReturnValue({
      getContainerClient: jest.fn().mockReturnValue({
        getBlockBlobClient: jest.fn().mockReturnValue({
          uploadData: jest.fn(),
          download: jest.fn(),
          deleteIfExists: jest.fn(),
          url: 'https://teststorage.blob.core.windows.net/testcontainer/testfile.jpg',
        }),
      }),
    }),
  },
  ContainerClient: jest.fn(),
}));

describe('BlobStorageService', () => {
  let blobStorageService: BlobStorageService;
  let mockContainerClient: any;
  let mockBlobClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.AZURE_STORAGE_CONNECTION_STRING = 'test-connection-string';
    process.env.SNAPSHOT_CONTAINER_NAME = 'test-container';

    // Get mocked instances
    const { BlobServiceClient } = require('@azure/storage-blob');
    mockContainerClient = BlobServiceClient.fromConnectionString().getContainerClient();
    mockBlobClient = mockContainerClient.getBlockBlobClient();

    blobStorageService = new BlobStorageService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create BlobStorageService with environment variables', () => {
      expect(blobStorageService).toBeInstanceOf(BlobStorageService);
    });

    it('should throw error if connection string is missing', () => {
      delete process.env.AZURE_STORAGE_CONNECTION_STRING;
      
      expect(() => new BlobStorageService())
        .toThrow('Azure Storage connection string or container name is not defined in environment variables.');
    });

    it('should throw error if container name is missing', () => {
      delete process.env.SNAPSHOT_CONTAINER_NAME;
      
      expect(() => new BlobStorageService())
        .toThrow('Azure Storage connection string or container name is not defined in environment variables.');
    });

    it('should initialize container client correctly', () => {
      const { BlobServiceClient } = require('@azure/storage-blob');
      
      expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith('test-connection-string');
      expect(mockContainerClient.getBlockBlobClient).toBeDefined();
    });
  });

  describe('uploadImage', () => {
    const createMockRequest = () => {
      const request = {
        getFileName: jest.fn().mockReturnValue('test-image.jpg'),
        getImageBuffer: jest.fn().mockReturnValue(Buffer.from('test image data')),
        getContentType: jest.fn().mockReturnValue('image/jpeg'),
      } as any;
      return request;
    };

    it('should upload image successfully', async () => {
      const request = createMockRequest();
      mockBlobClient.uploadData.mockResolvedValue(undefined);

      const result = await blobStorageService.uploadImage(request);

      expect(request.getFileName).toHaveBeenCalled();
      expect(request.getImageBuffer).toHaveBeenCalled();
      expect(request.getContentType).toHaveBeenCalled();
      expect(mockBlobClient.uploadData).toHaveBeenCalledWith(
        Buffer.from('test image data'),
        { blobHTTPHeaders: { blobContentType: 'image/jpeg' } }
      );
      expect(result).toBe('https://teststorage.blob.core.windows.net/testcontainer/testfile.jpg');
    });

    it('should handle different image types', async () => {
      const imageTypes = [
        { contentType: 'image/jpeg', fileName: 'test.jpg' },
        { contentType: 'image/png', fileName: 'test.png' },
        { contentType: 'image/gif', fileName: 'test.gif' },
        { contentType: 'image/webp', fileName: 'test.webp' },
      ];

      for (const imageType of imageTypes) {
        const request = createMockRequest();
        request.getContentType.mockReturnValue(imageType.contentType);
        request.getFileName.mockReturnValue(imageType.fileName);
        mockBlobClient.uploadData.mockResolvedValue(undefined);

        const result = await blobStorageService.uploadImage(request);

        expect(mockBlobClient.uploadData).toHaveBeenCalledWith(
          Buffer.from('test image data'),
          { blobHTTPHeaders: { blobContentType: imageType.contentType } }
        );
        expect(result).toBe('https://teststorage.blob.core.windows.net/testcontainer/testfile.jpg');
      }
    });

    it('should handle upload errors', async () => {
      const request = createMockRequest();
      const uploadError = new Error('Upload failed');
      mockBlobClient.uploadData.mockRejectedValue(uploadError);

      await expect(blobStorageService.uploadImage(request))
        .rejects.toThrow('Failed to upload image: Upload failed');

      expect(mockBlobClient.uploadData).toHaveBeenCalled();
    });

    it('should handle different file names', async () => {
      const fileNames = [
        'simple.jpg',
        'file-with-dashes.jpg',
        'file_with_underscores.jpg',
        'file.with.dots.jpg',
        'file with spaces.jpg',
        'file-with-special-chars-@#$%.jpg',
      ];

      for (const fileName of fileNames) {
        const request = createMockRequest();
        request.getFileName.mockReturnValue(fileName);
        mockBlobClient.uploadData.mockResolvedValue(undefined);

        await blobStorageService.uploadImage(request);

        expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(fileName);
      }
    });

    it('should handle different buffer sizes', async () => {
      const bufferSizes = [
        Buffer.from('small'),
        Buffer.from('medium sized image data'),
        Buffer.alloc(1024 * 1024), // 1MB
        Buffer.alloc(10 * 1024 * 1024), // 10MB
      ];

      for (const buffer of bufferSizes) {
        const request = createMockRequest();
        request.getImageBuffer.mockReturnValue(buffer);
        mockBlobClient.uploadData.mockResolvedValue(undefined);

        await blobStorageService.uploadImage(request);

        expect(mockBlobClient.uploadData).toHaveBeenCalledWith(
          buffer,
          { blobHTTPHeaders: { blobContentType: 'image/jpeg' } }
        );
      }
    });
  });

  describe('downloadImage', () => {
    it('should download image successfully', async () => {
      const mockChunks = [
        Buffer.from('chunk1'),
        Buffer.from('chunk2'),
        Buffer.from('chunk3'),
      ];

      const mockReadableStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
      };

      mockBlobClient.download.mockResolvedValue({
        readableStreamBody: mockReadableStream,
      });

      const result = await blobStorageService.downloadImage('test-image.jpg');

      expect(mockBlobClient.download).toHaveBeenCalledWith();
      expect(result).toEqual(Buffer.concat(mockChunks));
    });

    it('should handle different blob names', async () => {
      const blobNames = [
        'simple.jpg',
        'file-with-dashes.jpg',
        'file_with_underscores.jpg',
        'file.with.dots.jpg',
        'file with spaces.jpg',
        'file-with-special-chars-@#$%.jpg',
      ];

      const mockReadableStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('test data');
        },
      };

      mockBlobClient.download.mockResolvedValue({
        readableStreamBody: mockReadableStream,
      });

      for (const blobName of blobNames) {
        await blobStorageService.downloadImage(blobName);
        expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(blobName);
      }
    });

    it('should handle download errors', async () => {
      const downloadError = new Error('Download failed');
      mockBlobClient.download.mockRejectedValue(downloadError);

      await expect(blobStorageService.downloadImage('test-image.jpg'))
        .rejects.toThrow('Failed to download image: Download failed');

      expect(mockBlobClient.download).toHaveBeenCalled();
    });

    it('should handle empty stream', async () => {
      const mockReadableStream = {
        [Symbol.asyncIterator]: async function* () {
          // Empty stream
        },
      };

      mockBlobClient.download.mockResolvedValue({
        readableStreamBody: mockReadableStream,
      });

      const result = await blobStorageService.downloadImage('empty-image.jpg');

      expect(result).toEqual(Buffer.alloc(0));
    });

    it('should handle non-buffer chunks', async () => {
      const mockChunks = [
        'string chunk 1',
        'string chunk 2',
        Buffer.from('buffer chunk'),
      ];

      const mockReadableStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
      };

      mockBlobClient.download.mockResolvedValue({
        readableStreamBody: mockReadableStream,
      });

      const result = await blobStorageService.downloadImage('mixed-chunks.jpg');

      const expectedBuffer = Buffer.concat([
        Buffer.from('string chunk 1'),
        Buffer.from('string chunk 2'),
        Buffer.from('buffer chunk'),
      ]);

      expect(result).toEqual(expectedBuffer);
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      mockBlobClient.deleteIfExists.mockResolvedValue({ succeeded: true });

      const result = await blobStorageService.deleteImage('test-image.jpg');

      expect(mockBlobClient.deleteIfExists).toHaveBeenCalledWith();
      expect(result).toBe(true);
    });

    it('should return false when image not found', async () => {
      mockBlobClient.deleteIfExists.mockResolvedValue({ succeeded: false });

      const result = await blobStorageService.deleteImage('nonexistent-image.jpg');

      expect(mockBlobClient.deleteIfExists).toHaveBeenCalledWith();
      expect(result).toBe(false);
    });

    it('should handle different blob names', async () => {
      const blobNames = [
        'simple.jpg',
        'file-with-dashes.jpg',
        'file_with_underscores.jpg',
        'file.with.dots.jpg',
        'file with spaces.jpg',
        'file-with-special-chars-@#$%.jpg',
      ];

      mockBlobClient.deleteIfExists.mockResolvedValue({ succeeded: true });

      for (const blobName of blobNames) {
        await blobStorageService.deleteImage(blobName);
        expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(blobName);
      }
    });

    it('should handle delete errors', async () => {
      const deleteError = new Error('Delete failed');
      mockBlobClient.deleteIfExists.mockRejectedValue(deleteError);

      await expect(blobStorageService.deleteImage('test-image.jpg'))
        .rejects.toThrow('Failed to delete image: Delete failed');

      expect(mockBlobClient.deleteIfExists).toHaveBeenCalled();
    });
  });

  describe('deleteRecordingByPath', () => {
    it('should delete recording successfully', async () => {
      mockBlobClient.deleteIfExists.mockResolvedValue({ succeeded: true });

      const result = await blobStorageService.deleteRecordingByPath('recordings/session-123.mp4');

      expect(mockBlobClient.deleteIfExists).toHaveBeenCalledWith();
      expect(result).toBe(true);
    });

    it('should return false when recording not found', async () => {
      mockBlobClient.deleteIfExists.mockResolvedValue({ succeeded: false });

      const result = await blobStorageService.deleteRecordingByPath('recordings/nonexistent.mp4');

      expect(mockBlobClient.deleteIfExists).toHaveBeenCalledWith();
      expect(result).toBe(false);
    });

    it('should handle different recording paths', async () => {
      const recordingPaths = [
        'recordings/session-123.mp4',
        'recordings/user-456/2025/01/15/session.mp4',
        'recordings/pso-789/streaming-session.mp4',
        'recordings/supervisor-101/monitoring-session.mp4',
      ];

      mockBlobClient.deleteIfExists.mockResolvedValue({ succeeded: true });

      for (const path of recordingPaths) {
        await blobStorageService.deleteRecordingByPath(path);
        expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(path);
      }
    });

    it('should handle delete errors', async () => {
      const deleteError = new Error('Delete failed');
      mockBlobClient.deleteIfExists.mockRejectedValue(deleteError);

      await expect(blobStorageService.deleteRecordingByPath('recordings/session-123.mp4'))
        .rejects.toThrow('Failed to delete recording: Delete failed');

      expect(mockBlobClient.deleteIfExists).toHaveBeenCalled();
    });

    it('should handle nested recording paths', async () => {
      const nestedPaths = [
        'recordings/user1/2025/01/15/session1.mp4',
        'recordings/user2/2025/01/16/session2.mp4',
        'recordings/user3/2025/01/17/session3.mp4',
      ];

      mockBlobClient.deleteIfExists.mockResolvedValue({ succeeded: true });

      for (const path of nestedPaths) {
        await blobStorageService.deleteRecordingByPath(path);
        expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(path);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very long blob names', async () => {
      const longBlobName = 'A'.repeat(1000) + '.jpg';
      mockBlobClient.uploadData.mockResolvedValue(undefined);

      const request = {
        getFileName: jest.fn().mockReturnValue(longBlobName),
        getImageBuffer: jest.fn().mockReturnValue(Buffer.from('test')),
        getContentType: jest.fn().mockReturnValue('image/jpeg'),
      } as any;

      await blobStorageService.uploadImage(request);

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(longBlobName);
    });

    it('should handle special characters in blob names', async () => {
      const specialBlobName = 'file-with-special-chars-@#$%^&*().jpg';
      mockBlobClient.uploadData.mockResolvedValue(undefined);

      const request = {
        getFileName: jest.fn().mockReturnValue(specialBlobName),
        getImageBuffer: jest.fn().mockReturnValue(Buffer.from('test')),
        getContentType: jest.fn().mockReturnValue('image/jpeg'),
      } as any;

      await blobStorageService.uploadImage(request);

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(specialBlobName);
    });

    it('should handle unicode characters in blob names', async () => {
      const unicodeBlobName = '文件-测试.jpg';
      mockBlobClient.uploadData.mockResolvedValue(undefined);

      const request = {
        getFileName: jest.fn().mockReturnValue(unicodeBlobName),
        getImageBuffer: jest.fn().mockReturnValue(Buffer.from('test')),
        getContentType: jest.fn().mockReturnValue('image/jpeg'),
      } as any;

      await blobStorageService.uploadImage(request);

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(unicodeBlobName);
    });

    it('should handle empty blob names', async () => {
      const emptyBlobName = '';
      mockBlobClient.uploadData.mockResolvedValue(undefined);

      const request = {
        getFileName: jest.fn().mockReturnValue(emptyBlobName),
        getImageBuffer: jest.fn().mockReturnValue(Buffer.from('test')),
        getContentType: jest.fn().mockReturnValue('image/jpeg'),
      } as any;

      await blobStorageService.uploadImage(request);

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(emptyBlobName);
    });

    it('should handle null blob names', async () => {
      const nullBlobName = null;
      mockBlobClient.uploadData.mockResolvedValue(undefined);

      const request = {
        getFileName: jest.fn().mockReturnValue(nullBlobName),
        getImageBuffer: jest.fn().mockReturnValue(Buffer.from('test')),
        getContentType: jest.fn().mockReturnValue('image/jpeg'),
      } as any;

      await blobStorageService.uploadImage(request);

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(nullBlobName);
    });
  });

  describe('validation scenarios', () => {
    it('should handle snapshot upload scenario', async () => {
      const snapshotRequest = {
        getFileName: jest.fn().mockReturnValue('snapshots/supervisor-123/2025/01/15/snapshot-456.jpg'),
        getImageBuffer: jest.fn().mockReturnValue(Buffer.from('snapshot data')),
        getContentType: jest.fn().mockReturnValue('image/jpeg'),
      } as any;

      mockBlobClient.uploadData.mockResolvedValue(undefined);

      const result = await blobStorageService.uploadImage(snapshotRequest);

      expect(result).toBe('https://teststorage.blob.core.windows.net/testcontainer/testfile.jpg');
      expect(mockBlobClient.uploadData).toHaveBeenCalledWith(
        Buffer.from('snapshot data'),
        { blobHTTPHeaders: { blobContentType: 'image/jpeg' } }
      );
    });

    it('should handle recording deletion scenario', async () => {
      const recordingPath = 'recordings/pso-123/2025/01/15/streaming-session-789.mp4';
      mockBlobClient.deleteIfExists.mockResolvedValue({ succeeded: true });

      const result = await blobStorageService.deleteRecordingByPath(recordingPath);

      expect(result).toBe(true);
      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(recordingPath);
    });

    it('should handle bulk operations scenario', async () => {
      const operations = [
        { type: 'upload', fileName: 'image1.jpg' },
        { type: 'upload', fileName: 'image2.jpg' },
        { type: 'delete', fileName: 'old-image.jpg' },
        { type: 'download', fileName: 'existing-image.jpg' },
      ];

      mockBlobClient.uploadData.mockResolvedValue(undefined);
      mockBlobClient.deleteIfExists.mockResolvedValue({ succeeded: true });
      mockBlobClient.download.mockResolvedValue({
        readableStreamBody: {
          [Symbol.asyncIterator]: async function* () {
            yield Buffer.from('test data');
          },
        },
      });

      for (const operation of operations) {
        if (operation.type === 'upload') {
          const request = {
            getFileName: jest.fn().mockReturnValue(operation.fileName),
            getImageBuffer: jest.fn().mockReturnValue(Buffer.from('test')),
            getContentType: jest.fn().mockReturnValue('image/jpeg'),
          } as any;
          await blobStorageService.uploadImage(request);
        } else if (operation.type === 'delete') {
          await blobStorageService.deleteImage(operation.fileName);
        } else if (operation.type === 'download') {
          await blobStorageService.downloadImage(operation.fileName);
        }
      }

      expect(mockBlobClient.uploadData).toHaveBeenCalledTimes(2);
      expect(mockBlobClient.deleteIfExists).toHaveBeenCalledTimes(1);
      expect(mockBlobClient.download).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent operations scenario', async () => {
      const operations = [
        blobStorageService.uploadImage({
          getFileName: jest.fn().mockReturnValue('concurrent1.jpg'),
          getImageBuffer: jest.fn().mockReturnValue(Buffer.from('data1')),
          getContentType: jest.fn().mockReturnValue('image/jpeg'),
        } as any),
        blobStorageService.uploadImage({
          getFileName: jest.fn().mockReturnValue('concurrent2.jpg'),
          getImageBuffer: jest.fn().mockReturnValue(Buffer.from('data2')),
          getContentType: jest.fn().mockReturnValue('image/jpeg'),
        } as any),
        blobStorageService.deleteImage('old-image.jpg'),
        blobStorageService.downloadImage('existing-image.jpg'),
      ];

      mockBlobClient.uploadData.mockResolvedValue(undefined);
      mockBlobClient.deleteIfExists.mockResolvedValue({ succeeded: true });
      mockBlobClient.download.mockResolvedValue({
        readableStreamBody: {
          [Symbol.asyncIterator]: async function* () {
            yield Buffer.from('test data');
          },
        },
      });

      await Promise.all(operations);

      expect(mockBlobClient.uploadData).toHaveBeenCalledTimes(2);
      expect(mockBlobClient.deleteIfExists).toHaveBeenCalledTimes(1);
      expect(mockBlobClient.download).toHaveBeenCalledTimes(1);
    });
  });
});
