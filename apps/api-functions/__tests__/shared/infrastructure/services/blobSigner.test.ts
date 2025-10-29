/**
 * @fileoverview Tests for blobSigner service
 * @description Tests for Azure Blob Storage URL building and SAS token generation
 */

import { buildBlobHttpsUrl, generateReadSasUrl } from '../../../../shared/infrastructure/services/blobSigner';

// Mock Azure Storage SDK
jest.mock('@azure/storage-blob', () => ({
  generateBlobSASQueryParameters: jest.fn(),
  BlobSASPermissions: {
    parse: jest.fn().mockReturnValue('r'),
  },
  StorageSharedKeyCredential: jest.fn().mockImplementation(() => ({
    accountName: 'testaccount',
    accountKey: 'testkey',
  })),
}));

import { generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';

const mockGenerateBlobSASQueryParameters = generateBlobSASQueryParameters as jest.MockedFunction<typeof generateBlobSASQueryParameters>;
const mockBlobSASPermissions = BlobSASPermissions as jest.Mocked<typeof BlobSASPermissions>;
const mockStorageSharedKeyCredential = StorageSharedKeyCredential as jest.MockedClass<typeof StorageSharedKeyCredential>;

describe('blobSigner service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variables
    process.env.AZURE_STORAGE_ACCOUNT = 'testaccount';
    process.env.AZURE_STORAGE_KEY = 'testkey';
    process.env.RECORDINGS_CONTAINER_NAME = 'testcontainer';
  });

  describe('buildBlobHttpsUrl', () => {
    it('should build blob URL with correct parameters', () => {
      const blobName = 'testblob.mp4';

      const result = buildBlobHttpsUrl(blobName);

      expect(result).toBe(`https://testaccount.blob.core.windows.net/testcontainer/${blobName}`);
    });

    it('should handle blob names with special characters', () => {
      const blobName = 'test blob with spaces.mp4';

      const result = buildBlobHttpsUrl(blobName);

      expect(result).toBe(`https://testaccount.blob.core.windows.net/testcontainer/${encodeURI(blobName)}`);
    });

    it('should handle nested blob paths', () => {
      const blobName = 'folder/subfolder/testblob.mp4';

      const result = buildBlobHttpsUrl(blobName);

      expect(result).toBe(`https://testaccount.blob.core.windows.net/testcontainer/${encodeURI(blobName)}`);
    });

    it('should normalize paths by removing leading slashes', () => {
      const blobName = '/folder/subfolder/testblob.mp4';

      const result = buildBlobHttpsUrl(blobName);

      expect(result).toBe(`https://testaccount.blob.core.windows.net/testcontainer/${encodeURI('folder/subfolder/testblob.mp4')}`);
    });
  });

  describe('generateReadSasUrl', () => {
    it('should generate SAS URL with default 60 minutes', () => {
      const blobName = 'testblob.mp4';

      // Mock the SAS query parameters
      const mockSasQueryParams = {
        toString: jest.fn().mockReturnValue('sv=2021-06-08&st=2024-01-01T00%3A00%3A00Z&se=2024-12-31T23%3A59%3A59Z&sr=b&sp=r&sig=test-signature'),
      };
      mockGenerateBlobSASQueryParameters.mockReturnValue(mockSasQueryParams as any);

      const result = generateReadSasUrl(blobName);

      expect(mockStorageSharedKeyCredential).toHaveBeenCalledWith('testaccount', 'testkey');
      expect(mockBlobSASPermissions.parse).toHaveBeenCalledWith('r');
      expect(mockGenerateBlobSASQueryParameters).toHaveBeenCalledWith(
        {
          containerName: 'testcontainer',
          blobName,
          permissions: 'r',
          expiresOn: expect.any(Date),
        },
        expect.any(Object)
      );
      expect(result).toContain('https://testaccount.blob.core.windows.net/testcontainer/');
      expect(result).toContain('sv=2021-06-08&st=2024-01-01T00%3A00%3A00Z&se=2024-12-31T23%3A59%3A59Z&sr=b&sp=r&sig=test-signature');
    });

    it('should generate SAS URL with custom minutes', () => {
      const blobName = 'testblob.mp4';
      const minutes = 30;

      const mockSasQueryParams = {
        toString: jest.fn().mockReturnValue('sv=2021-06-08&st=2024-01-01T00%3A00%3A00Z&se=2024-06-15T12%3A30%3A00Z&sr=b&sp=r&sig=test-signature'),
      };
      mockGenerateBlobSASQueryParameters.mockReturnValue(mockSasQueryParams as any);

      const result = generateReadSasUrl(blobName, minutes);

      expect(mockGenerateBlobSASQueryParameters).toHaveBeenCalledWith(
        {
          containerName: 'testcontainer',
          blobName,
          permissions: 'r',
          expiresOn: expect.any(Date),
        },
        expect.any(Object)
      );
      expect(result).toContain('https://testaccount.blob.core.windows.net/testcontainer/');
    });

    it('should handle different blob names', () => {
      const blobName = 'different-blob.mp4';

      const mockSasQueryParams = {
        toString: jest.fn().mockReturnValue('sv=2021-06-08&st=2024-01-01T00%3A00%3A00Z&se=2024-12-31T23%3A59%3A59Z&sr=b&sp=r&sig=test-signature'),
      };
      mockGenerateBlobSASQueryParameters.mockReturnValue(mockSasQueryParams as any);

      const result = generateReadSasUrl(blobName);

      expect(mockGenerateBlobSASQueryParameters).toHaveBeenCalledWith(
        {
          containerName: 'testcontainer',
          blobName,
          permissions: 'r',
          expiresOn: expect.any(Date),
        },
        expect.any(Object)
      );
      expect(result).toContain('different-blob.mp4');
    });

    it('should handle minimum 1 minute expiration', () => {
      const blobName = 'testblob.mp4';
      const minutes = 0.5; // Less than 1 minute

      const mockSasQueryParams = {
        toString: jest.fn().mockReturnValue('sv=2021-06-08&st=2024-01-01T00%3A00%3A00Z&se=2024-12-31T23%3A59%3A59Z&sr=b&sp=r&sig=test-signature'),
      };
      mockGenerateBlobSASQueryParameters.mockReturnValue(mockSasQueryParams as any);

      const result = generateReadSasUrl(blobName, minutes);

      expect(mockGenerateBlobSASQueryParameters).toHaveBeenCalledWith(
        {
          containerName: 'testcontainer',
          blobName,
          permissions: 'r',
          expiresOn: expect.any(Date),
        },
        expect.any(Object)
      );
      expect(result).toContain('https://testaccount.blob.core.windows.net/testcontainer/');
    });
  });
});