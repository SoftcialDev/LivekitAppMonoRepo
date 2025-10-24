/**
 * @fileoverview Tests for blobSigner
 * @description Tests for Azure Blob Storage URL generation and SAS token creation
 */

import { buildBlobHttpsUrl, generateReadSasUrl, BlobSigner } from '../../../../shared/infrastructure/services/blobSigner';

// Mock Azure Storage Blob
jest.mock('@azure/storage-blob', () => ({
  BlobSASPermissions: {
    parse: jest.fn().mockReturnValue('r'),
  },
  StorageSharedKeyCredential: jest.fn().mockImplementation(() => ({})),
  generateBlobSASQueryParameters: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('sp=r&st=2023-01-01T00:00:00Z&se=2023-01-01T01:00:00Z&sv=2020-04-08&sr=b&sig=mockSignature'),
  }),
}));

describe('blobSigner', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    // Set required environment variables
    process.env.AZURE_STORAGE_ACCOUNT = 'teststorageaccount';
    process.env.AZURE_STORAGE_KEY = 'teststoragekey';
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('buildBlobHttpsUrl', () => {
    it('should build HTTPS URL for blob path', () => {
      const result = buildBlobHttpsUrl('test/path/file.mp4');
      expect(result).toBe('https://teststorageaccount.blob.core.windows.net/recordings/test/path/file.mp4');
    });

    it('should normalize path by removing leading slashes', () => {
      const result = buildBlobHttpsUrl('/test/path/file.mp4');
      expect(result).toBe('https://teststorageaccount.blob.core.windows.net/recordings/test/path/file.mp4');
    });

    it('should handle multiple leading slashes', () => {
      const result = buildBlobHttpsUrl('///test/path/file.mp4');
      expect(result).toBe('https://teststorageaccount.blob.core.windows.net/recordings/test/path/file.mp4');
    });

    it('should handle empty path', () => {
      const result = buildBlobHttpsUrl('');
      expect(result).toBe('https://teststorageaccount.blob.core.windows.net/recordings/');
    });

    it('should handle null path', () => {
      const result = buildBlobHttpsUrl(null as any);
      expect(result).toBe('https://teststorageaccount.blob.core.windows.net/recordings/');
    });

    it('should use custom container name from environment', () => {
      process.env.RECORDINGS_CONTAINER_NAME = 'custom-container';
      const result = buildBlobHttpsUrl('test/file.mp4');
      expect(result).toBe('https://teststorageaccount.blob.core.windows.net/custom-container/test/file.mp4');
    });

    it('should throw error when AZURE_STORAGE_ACCOUNT is missing', () => {
      delete process.env.AZURE_STORAGE_ACCOUNT;
      expect(() => {
        buildBlobHttpsUrl('test/file.mp4');
      }).toThrow('AZURE_STORAGE_ACCOUNT is not set.');
    });
  });

  describe('generateReadSasUrl', () => {
    it('should generate SAS URL with default 60 minutes', () => {
      const result = generateReadSasUrl('test/file.mp4');
      expect(result).toContain('https://teststorageaccount.blob.core.windows.net/recordings/test/file.mp4?');
      expect(result).toContain('sp=r');
    });

    it('should generate SAS URL with custom minutes', () => {
      const result = generateReadSasUrl('test/file.mp4', 30);
      expect(result).toContain('https://teststorageaccount.blob.core.windows.net/recordings/test/file.mp4?');
      expect(result).toContain('sp=r');
    });

    it('should normalize path by removing leading slashes', () => {
      const result = generateReadSasUrl('/test/file.mp4', 30);
      expect(result).toContain('https://teststorageaccount.blob.core.windows.net/recordings/test/file.mp4?');
    });

    it('should handle minimum 1 minute', () => {
      const result = generateReadSasUrl('test/file.mp4', 0.5);
      expect(result).toContain('https://teststorageaccount.blob.core.windows.net/recordings/test/file.mp4?');
    });

    it('should handle negative minutes', () => {
      const result = generateReadSasUrl('test/file.mp4', -10);
      expect(result).toContain('https://teststorageaccount.blob.core.windows.net/recordings/test/file.mp4?');
    });

    it('should throw error when AZURE_STORAGE_ACCOUNT is missing', () => {
      delete process.env.AZURE_STORAGE_ACCOUNT;
      expect(() => {
        generateReadSasUrl('test/file.mp4');
      }).toThrow('AZURE_STORAGE_ACCOUNT is not set.');
    });

    it('should throw error when AZURE_STORAGE_KEY is missing', () => {
      delete process.env.AZURE_STORAGE_KEY;
      expect(() => {
        generateReadSasUrl('test/file.mp4');
      }).toThrow('AZURE_STORAGE_KEY is not set.');
    });

    it('should use custom container name from environment', () => {
      process.env.RECORDINGS_CONTAINER_NAME = 'custom-container';
      const result = generateReadSasUrl('test/file.mp4');
      expect(result).toContain('https://teststorageaccount.blob.core.windows.net/custom-container/test/file.mp4?');
    });
  });

  describe('BlobSigner object', () => {
    it('should export buildBlobHttpsUrl function', () => {
      expect(BlobSigner.buildBlobHttpsUrl).toBe(buildBlobHttpsUrl);
    });

    it('should export generateReadSasUrl function', () => {
      expect(BlobSigner.generateReadSasUrl).toBe(generateReadSasUrl);
    });

    it('should work through BlobSigner namespace', () => {
      const result = BlobSigner.buildBlobHttpsUrl('test/file.mp4');
      expect(result).toBe('https://teststorageaccount.blob.core.windows.net/recordings/test/file.mp4');
    });
  });
});