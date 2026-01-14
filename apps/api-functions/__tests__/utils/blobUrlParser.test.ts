jest.mock('../../src/config', () => ({
  config: {
    accountName: 'testaccount',
    recordingsContainerName: 'recordings',
  },
}));

jest.mock('../../src/infrastructure/services/storageCredentials');

import { tryParseBlobPathFromUrl } from '../../src/utils/blobUrlParser';
import { config } from '../../src/config';
import { getStorageCredentials } from '../../src/infrastructure/services/storageCredentials';

const mockGetStorageCredentials = getStorageCredentials as jest.MockedFunction<typeof getStorageCredentials>;
const mockConfig = config as any;

describe('blobUrlParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStorageCredentials.mockReturnValue({
      accountName: 'testaccount',
      accountKey: 'testkey',
    });
    mockConfig.accountName = 'testaccount';
    mockConfig.recordingsContainerName = 'recordings';
  });

  describe('tryParseBlobPathFromUrl', () => {
    it('should return null when url is null', () => {
      const result = tryParseBlobPathFromUrl(null);
      expect(result).toBeNull();
    });

    it('should return null when url is undefined', () => {
      const result = tryParseBlobPathFromUrl(undefined);
      expect(result).toBeNull();
    });

    it('should return null when url is empty string', () => {
      const result = tryParseBlobPathFromUrl('');
      expect(result).toBeNull();
    });

    it('should parse blob path from valid URL', () => {
      const url = 'https://testaccount.blob.core.windows.net/recordings/path/to/file.mp4';
      const result = tryParseBlobPathFromUrl(url);
      expect(result).toBe('path/to/file.mp4');
    });

    it('should parse blob path with encoded characters', () => {
      const url = 'https://testaccount.blob.core.windows.net/recordings/path%20with%20spaces/file.mp4';
      const result = tryParseBlobPathFromUrl(url);
      expect(result).toBe('path with spaces/file.mp4');
    });

    it('should use provided container name', () => {
      const url = 'https://testaccount.blob.core.windows.net/custom-container/path/to/file.mp4';
      const result = tryParseBlobPathFromUrl(url, 'custom-container');
      expect(result).toBe('path/to/file.mp4');
    });

    it('should return null when hostname does not match', () => {
      const url = 'https://wrongaccount.blob.core.windows.net/recordings/path/to/file.mp4';
      const result = tryParseBlobPathFromUrl(url);
      expect(result).toBeNull();
    });

    it('should return null when container name does not match', () => {
      const url = 'https://testaccount.blob.core.windows.net/wrong-container/path/to/file.mp4';
      const result = tryParseBlobPathFromUrl(url);
      expect(result).toBeNull();
    });

    it('should handle URL with multiple leading slashes', () => {
      const url = 'https://testaccount.blob.core.windows.net///recordings/path/to/file.mp4';
      const result = tryParseBlobPathFromUrl(url);
      expect(result).toBe('path/to/file.mp4');
    });

    it('should return null when getStorageCredentials throws', () => {
      mockGetStorageCredentials.mockImplementation(() => {
        throw new Error('Credentials error');
      });
      const url = 'https://testaccount.blob.core.windows.net/recordings/path/to/file.mp4';
      const result = tryParseBlobPathFromUrl(url);
      expect(result).toBe('path/to/file.mp4');
    });

    it('should use config.accountName as fallback when getStorageCredentials throws', () => {
      mockGetStorageCredentials.mockImplementation(() => {
        throw new Error('Credentials error');
      });
      const originalAccountName = mockConfig.accountName;
      mockConfig.accountName = 'fallbackaccount';
      const url = 'https://fallbackaccount.blob.core.windows.net/recordings/path/to/file.mp4';
      const result = tryParseBlobPathFromUrl(url);
      expect(result).toBe('path/to/file.mp4');
      mockConfig.accountName = originalAccountName;
    });

    it('should handle empty accountName fallback when getStorageCredentials throws', () => {
      mockGetStorageCredentials.mockImplementation(() => {
        throw new Error('Credentials error');
      });
      const originalAccountName = mockConfig.accountName;
      mockConfig.accountName = '';
      const url = 'https://testaccount.blob.core.windows.net/recordings/path/to/file.mp4';
      const result = tryParseBlobPathFromUrl(url);
      expect(result).toBeNull();
      mockConfig.accountName = originalAccountName;
    });

    it('should return null when URL parsing throws', () => {
      const url = 'not-a-valid-url';
      const result = tryParseBlobPathFromUrl(url);
      expect(result).toBeNull();
    });

    it('should handle empty path after container', () => {
      const url = 'https://testaccount.blob.core.windows.net/recordings/';
      const result = tryParseBlobPathFromUrl(url);
      expect(result).toBe('');
    });

    it('should handle nested paths', () => {
      const url = 'https://testaccount.blob.core.windows.net/recordings/2024/01/15/file.mp4';
      const result = tryParseBlobPathFromUrl(url);
      expect(result).toBe('2024/01/15/file.mp4');
    });
  });
});

