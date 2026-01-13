import { buildBlobHttpsUrl, generateReadSasUrl, BlobSigner } from '../../../src/infrastructure/services/blobSigner';
import { getStorageCredentials } from '../../../src/infrastructure/services/storageCredentials';
import { config } from '../../../src/config';
import { StorageCredentialsError } from '../../../src/domain/errors/InfrastructureErrors';

jest.mock('../../../src/infrastructure/services/storageCredentials');
jest.mock('../../../src/config', () => ({
  config: {
    recordingsContainerName: 'recordings',
  },
}));

const mockGetStorageCredentials = getStorageCredentials as jest.MockedFunction<typeof getStorageCredentials>;

describe('blobSigner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStorageCredentials.mockReturnValue({
      accountName: 'testaccount',
      accountKey: Buffer.alloc(64).toString('base64'),
    });
  });

  describe('buildBlobHttpsUrl', () => {
    it('should build HTTPS URL for blob path', () => {
      const path = 'user/2024/01/15/recording.mp4';
      const result = buildBlobHttpsUrl(path);

      expect(result).toBe('https://testaccount.blob.core.windows.net/recordings/user/2024/01/15/recording.mp4');
    });

    it('should normalize path by removing leading slashes', () => {
      const path = '/user/2024/01/15/recording.mp4';
      const result = buildBlobHttpsUrl(path);

      expect(result).toBe('https://testaccount.blob.core.windows.net/recordings/user/2024/01/15/recording.mp4');
    });

    it('should encode special characters in path', () => {
      const path = 'user/file with spaces.mp4';
      const result = buildBlobHttpsUrl(path);

      expect(result).toContain('file%20with%20spaces.mp4');
    });

    it('should handle empty path', () => {
      const path = '';
      const result = buildBlobHttpsUrl(path);

      expect(result).toBe('https://testaccount.blob.core.windows.net/recordings/');
    });

    it('should throw StorageCredentialsError when credentials are missing', () => {
      mockGetStorageCredentials.mockImplementation(() => {
        throw new Error('Credentials not found');
      });

      expect(() => {
        buildBlobHttpsUrl('path/to/blob.mp4');
      }).toThrow(StorageCredentialsError);
    });
  });

  describe('generateReadSasUrl', () => {
    it('should generate SAS URL with default minutes', () => {
      const path = 'user/recording.mp4';
      const result = generateReadSasUrl(path);

      expect(result).toContain('https://testaccount.blob.core.windows.net/recordings/user/recording.mp4');
      expect(result).toContain('?');
      expect(result.split('?')[1]).toBeDefined();
    });

    it('should generate SAS URL with custom minutes', () => {
      const path = 'user/recording.mp4';
      const minutes = 30;
      const result = generateReadSasUrl(path, minutes);

      expect(result).toContain('https://testaccount.blob.core.windows.net/recordings/user/recording.mp4');
      expect(result).toContain('?');
    });

    it('should use minimum of 1 minute', () => {
      const path = 'user/recording.mp4';
      const result = generateReadSasUrl(path, 0);

      expect(result).toBeDefined();
      expect(result).toContain('?');
    });

    it('should normalize path by removing leading slashes', () => {
      const path = '/user/recording.mp4';
      const result = generateReadSasUrl(path);

      expect(result).toContain('user/recording.mp4');
      // Should not have double slashes in the path part (after domain)
      expect(result).not.toMatch(/recordings\/\//);
    });

    it('should throw StorageCredentialsError when credentials are missing', () => {
      mockGetStorageCredentials.mockImplementation(() => {
        throw new Error('Credentials not found');
      });

      expect(() => {
        generateReadSasUrl('path/to/blob.mp4');
      }).toThrow(StorageCredentialsError);
    });
  });

  describe('BlobSigner namespace', () => {
    it('should export buildBlobHttpsUrl', () => {
      expect(BlobSigner.buildBlobHttpsUrl).toBe(buildBlobHttpsUrl);
    });

    it('should export generateReadSasUrl', () => {
      expect(BlobSigner.generateReadSasUrl).toBe(generateReadSasUrl);
    });

    it('should work as namespace object', () => {
      const path = 'user/recording.mp4';
      const url = BlobSigner.buildBlobHttpsUrl(path);
      const sas = BlobSigner.generateReadSasUrl(path, 15);

      expect(url).toBeDefined();
      expect(sas).toBeDefined();
      expect(sas).toContain(url);
    });
  });
});

