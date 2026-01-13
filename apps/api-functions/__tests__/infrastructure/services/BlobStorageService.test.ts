import { BlobStorageService } from '../../../src/infrastructure/services/BlobStorageService';
import { ImageUploadRequest } from '../../../src/domain/value-objects/ImageUploadRequest';
import { ConfigurationError } from '../../../src/domain/errors/InfrastructureErrors';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { config } from '../../../src/config';

jest.mock('@azure/storage-blob');
jest.mock('../../../src/config', () => ({
  config: {
    storageConnectionString: 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=testkey;EndpointSuffix=core.windows.net',
    snapshotContainerName: 'snapshots',
  },
}));

const MockBlobServiceClient = BlobServiceClient as jest.MockedClass<typeof BlobServiceClient>;
const MockContainerClient = ContainerClient as jest.MockedClass<typeof ContainerClient>;

describe('BlobStorageService', () => {
  let service: BlobStorageService;
  let mockContainerClient: jest.Mocked<ContainerClient>;
  let mockBlobClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBlobClient = {
      uploadData: jest.fn().mockResolvedValue(undefined),
      download: jest.fn().mockResolvedValue({
        readableStreamBody: {
          [Symbol.asyncIterator]: async function* () {
            yield Buffer.from('chunk1');
            yield Buffer.from('chunk2');
          },
        },
      }),
      deleteIfExists: jest.fn().mockResolvedValue({ succeeded: true }),
      url: 'https://test.blob.core.windows.net/snapshots/test.jpg',
    };

    mockContainerClient = {
      getBlockBlobClient: jest.fn().mockReturnValue(mockBlobClient),
    } as any;

    MockBlobServiceClient.fromConnectionString = jest.fn().mockReturnValue({
      getContainerClient: jest.fn().mockReturnValue(mockContainerClient),
    } as any);

    service = new BlobStorageService();
  });

  describe('constructor', () => {
    it('should create service with valid connection string and container name', () => {
      expect(service).toBeInstanceOf(BlobStorageService);
      expect(MockBlobServiceClient.fromConnectionString).toHaveBeenCalled();
    });

    it('should throw ConfigurationError when connection string and container name are missing', () => {
      const originalConfig = { ...config };
      (config as any).storageConnectionString = undefined;
      (config as any).snapshotContainerName = undefined;

      expect(() => {
        new BlobStorageService();
      }).toThrow(ConfigurationError);
      expect(() => {
        new BlobStorageService();
      }).toThrow('Missing required environment variables');

      (config as any).storageConnectionString = originalConfig.storageConnectionString;
      (config as any).snapshotContainerName = originalConfig.snapshotContainerName;
    });

    it('should throw ConfigurationError when connection string is missing', () => {
      const originalConfig = { ...config };
      (config as any).storageConnectionString = undefined;

      expect(() => {
        new BlobStorageService();
      }).toThrow(ConfigurationError);
      expect(() => {
        new BlobStorageService();
      }).toThrow('AZURE_STORAGE_CONNECTION_STRING environment variable is not defined');

      (config as any).storageConnectionString = originalConfig.storageConnectionString;
    });

    it('should throw ConfigurationError when container name is missing', () => {
      const originalConfig = { ...config };
      (config as any).snapshotContainerName = undefined;

      expect(() => {
        new BlobStorageService();
      }).toThrow(ConfigurationError);
      expect(() => {
        new BlobStorageService();
      }).toThrow('SNAPSHOT_CONTAINER_NAME environment variable is not defined');

      (config as any).snapshotContainerName = originalConfig.snapshotContainerName;
    });
  });

  describe('uploadImage', () => {
    it('should upload image and return blob URL', async () => {
      const imageBuffer = Buffer.from('image data');
      const request = {
        getFileName: jest.fn().mockReturnValue('test.jpg'),
        getImageBuffer: jest.fn().mockReturnValue(imageBuffer),
        getContentType: jest.fn().mockReturnValue('image/jpeg'),
      } as unknown as ImageUploadRequest;

      const result = await service.uploadImage(request);

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith('test.jpg');
      expect(mockBlobClient.uploadData).toHaveBeenCalledWith(imageBuffer, {
        blobHTTPHeaders: { blobContentType: 'image/jpeg' },
      });
      expect(result).toBe('https://test.blob.core.windows.net/snapshots/test.jpg');
    });

    it('should throw error when upload fails', async () => {
      const imageBuffer = Buffer.from('image data');
      const request = {
        getFileName: jest.fn().mockReturnValue('test.jpg'),
        getImageBuffer: jest.fn().mockReturnValue(imageBuffer),
        getContentType: jest.fn().mockReturnValue('image/jpeg'),
      } as unknown as ImageUploadRequest;

      const error = new Error('Upload failed');
      mockBlobClient.uploadData.mockRejectedValue(error);

      await expect(service.uploadImage(request)).rejects.toThrow();
    });
  });

  describe('downloadImage', () => {
    it('should download image and return buffer', async () => {
      const blobName = 'test.jpg';

      const result = await service.downloadImage(blobName);

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(blobName);
      expect(mockBlobClient.download).toHaveBeenCalled();
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toContain('chunk1');
    });

    it('should throw error when download fails', async () => {
      const blobName = 'test.jpg';
      const error = new Error('Download failed');
      mockBlobClient.download.mockRejectedValue(error);

      await expect(service.downloadImage(blobName)).rejects.toThrow();
    });
  });

  describe('deleteImage', () => {
    it('should delete image and return true when successful', async () => {
      const blobName = 'test.jpg';

      const result = await service.deleteImage(blobName);

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(blobName);
      expect(mockBlobClient.deleteIfExists).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when blob does not exist', async () => {
      const blobName = 'test.jpg';
      mockBlobClient.deleteIfExists.mockResolvedValue({ succeeded: false });

      const result = await service.deleteImage(blobName);

      expect(result).toBe(false);
    });

    it('should throw error when deletion fails', async () => {
      const blobName = 'test.jpg';
      const error = new Error('Delete failed');
      mockBlobClient.deleteIfExists.mockRejectedValue(error);

      await expect(service.deleteImage(blobName)).rejects.toThrow();
    });
  });

  describe('deleteRecordingByPath', () => {
    it('should delete recording by path and return true when successful', async () => {
      const blobPath = 'recordings/session.mp4';

      const result = await service.deleteRecordingByPath(blobPath);

      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(blobPath);
      expect(mockBlobClient.deleteIfExists).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when recording does not exist', async () => {
      const blobPath = 'recordings/session.mp4';
      mockBlobClient.deleteIfExists.mockResolvedValue({ succeeded: false });

      const result = await service.deleteRecordingByPath(blobPath);

      expect(result).toBe(false);
    });

    it('should throw error when deletion fails', async () => {
      const blobPath = 'recordings/session.mp4';
      const error = new Error('Delete failed');
      mockBlobClient.deleteIfExists.mockRejectedValue(error);

      await expect(service.deleteRecordingByPath(blobPath)).rejects.toThrow();
    });
  });
});

