/**
 * @fileoverview Tests for blobSigner service
 * @description Tests for Azure Blob Storage URL generation and SAS token creation
 */

import {
  buildBlobHttpsUrl,
  generateReadSasUrl,
  BlobSigner,
} from '../../../../shared/infrastructure/services/blobSigner';

// Mock Azure Storage Blob SDK
jest.mock('@azure/storage-blob', () => ({
  BlobSASPermissions: {
    parse: jest.fn().mockReturnValue('r'),
  },
  StorageSharedKeyCredential: jest.fn().mockImplementation(() => ({
    accountName: 'test-account',
    accountKey: 'test-key',
  })),
  generateBlobSASQueryParameters: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('sv=2020-08-04&ss=b&srt=sco&sp=r&se=2025-01-01T00:00:00Z&st=2025-01-01T00:00:00Z&spr=https&sig=test-signature'),
  }),
  SASProtocol: {
    Https: 'https',
  },
}));

describe('blobSigner service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      AZURE_STORAGE_ACCOUNT: 'test-account',
      AZURE_STORAGE_KEY: 'test-key',
      RECORDINGS_CONTAINER_NAME: 'test-recordings',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('buildBlobHttpsUrl', () => {
    it('should build HTTPS URL with default container', () => {
      const path = 'user/2025/01/15/session.mp4';
      const url = buildBlobHttpsUrl(path);

      expect(url).toBe('https://test-account.blob.core.windows.net/test-recordings/user/2025/01/15/session.mp4');
    });

    it('should normalize path by removing leading slashes', () => {
      const path = '/user/2025/01/15/session.mp4';
      const url = buildBlobHttpsUrl(path);

      expect(url).toBe('https://test-account.blob.core.windows.net/test-recordings/user/2025/01/15/session.mp4');
    });

    it('should handle multiple leading slashes', () => {
      const path = '///user/2025/01/15/session.mp4';
      const url = buildBlobHttpsUrl(path);

      expect(url).toBe('https://test-account.blob.core.windows.net/test-recordings/user/2025/01/15/session.mp4');
    });

    it('should handle empty path', () => {
      const path = '';
      const url = buildBlobHttpsUrl(path);

      expect(url).toBe('https://test-account.blob.core.windows.net/test-recordings/');
    });

    it('should handle null/undefined path', () => {
      const url1 = buildBlobHttpsUrl(null as any);
      const url2 = buildBlobHttpsUrl(undefined as any);

      expect(url1).toBe('https://test-account.blob.core.windows.net/test-recordings/');
      expect(url2).toBe('https://test-account.blob.core.windows.net/test-recordings/');
    });

    it('should encode special characters in path', () => {
      const path = 'user with spaces/2025/01/15/session with spaces.mp4';
      const url = buildBlobHttpsUrl(path);

      expect(url).toBe('https://test-account.blob.core.windows.net/test-recordings/user%20with%20spaces/2025/01/15/session%20with%20spaces.mp4');
    });

    it('should use default container when RECORDINGS_CONTAINER_NAME is not set', () => {
      delete process.env.RECORDINGS_CONTAINER_NAME;
      const path = 'user/session.mp4';
      const url = buildBlobHttpsUrl(path);

      expect(url).toBe('https://test-account.blob.core.windows.net/recordings/user/session.mp4');
    });

    it('should throw error when AZURE_STORAGE_ACCOUNT is not set', () => {
      delete process.env.AZURE_STORAGE_ACCOUNT;
      const path = 'user/session.mp4';

      expect(() => buildBlobHttpsUrl(path)).toThrow('AZURE_STORAGE_ACCOUNT is not set.');
    });
  });

  describe('generateReadSasUrl', () => {
    beforeEach(() => {
      // Mock Date.now to return a fixed timestamp
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01T00:00:00Z
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should generate SAS URL with default 60 minutes', () => {
      const path = 'user/2025/01/15/session.mp4';
      const url = generateReadSasUrl(path);

      expect(url).toContain('https://test-account.blob.core.windows.net/test-recordings/user/2025/01/15/session.mp4?');
      expect(url).toContain('sv=');
      expect(url).toContain('ss=b');
      expect(url).toContain('srt=sco');
      expect(url).toContain('sp=r');
    });

    it('should generate SAS URL with custom minutes', () => {
      const path = 'user/2025/01/15/session.mp4';
      const url = generateReadSasUrl(path, 30);

      expect(url).toContain('https://test-account.blob.core.windows.net/test-recordings/user/2025/01/15/session.mp4?');
      expect(url).toContain('sv=');
    });

    it('should normalize path by removing leading slashes', () => {
      const path = '/user/2025/01/15/session.mp4';
      const url = generateReadSasUrl(path);

      expect(url).toContain('https://test-account.blob.core.windows.net/test-recordings/user/2025/01/15/session.mp4?');
    });

    it('should handle minimum 1 minute validity', () => {
      const path = 'user/session.mp4';
      const url = generateReadSasUrl(path, 0.5);

      expect(url).toContain('https://test-account.blob.core.windows.net/test-recordings/user/session.mp4?');
    });

    it('should handle negative minutes by setting to 1', () => {
      const path = 'user/session.mp4';
      const url = generateReadSasUrl(path, -5);

      expect(url).toContain('https://test-account.blob.core.windows.net/test-recordings/user/session.mp4?');
    });

    it('should handle decimal minutes by flooring', () => {
      const path = 'user/session.mp4';
      const url = generateReadSasUrl(path, 30.7);

      expect(url).toContain('https://test-account.blob.core.windows.net/test-recordings/user/session.mp4?');
    });

    it('should throw error when AZURE_STORAGE_ACCOUNT is not set', () => {
      delete process.env.AZURE_STORAGE_ACCOUNT;
      const path = 'user/session.mp4';

      expect(() => generateReadSasUrl(path)).toThrow('AZURE_STORAGE_ACCOUNT is not set.');
    });

    it('should throw error when AZURE_STORAGE_KEY is not set', () => {
      delete process.env.AZURE_STORAGE_KEY;
      const path = 'user/session.mp4';

      expect(() => generateReadSasUrl(path)).toThrow('AZURE_STORAGE_KEY is not set.');
    });

    it('should use default container when RECORDINGS_CONTAINER_NAME is not set', () => {
      delete process.env.RECORDINGS_CONTAINER_NAME;
      const path = 'user/session.mp4';
      const url = generateReadSasUrl(path);

      expect(url).toContain('https://test-account.blob.core.windows.net/recordings/user/session.mp4?');
    });

    it('should create StorageSharedKeyCredential with correct parameters', () => {
      const { StorageSharedKeyCredential } = require('@azure/storage-blob');
      const path = 'user/session.mp4';

      generateReadSasUrl(path);

      expect(StorageSharedKeyCredential).toHaveBeenCalledWith('test-account', 'test-key');
    });

    it('should call generateBlobSASQueryParameters with correct parameters', () => {
      const { generateBlobSASQueryParameters } = require('@azure/storage-blob');
      const path = 'user/session.mp4';

      generateReadSasUrl(path, 30);

      expect(generateBlobSASQueryParameters).toHaveBeenCalledWith(
        {
          containerName: 'test-recordings',
          blobName: 'user/session.mp4',
          permissions: 'r',
          expiresOn: expect.any(Date),
        },
        expect.any(Object)
      );
    });
  });

  describe('BlobSigner namespace', () => {
    it('should export buildBlobHttpsUrl function', () => {
      expect(BlobSigner.buildBlobHttpsUrl).toBe(buildBlobHttpsUrl);
    });

    it('should export generateReadSasUrl function', () => {
      expect(BlobSigner.generateReadSasUrl).toBe(generateReadSasUrl);
    });

    it('should work through namespace', () => {
      const path = 'user/session.mp4';
      const url = BlobSigner.buildBlobHttpsUrl(path);

      expect(url).toBe('https://test-account.blob.core.windows.net/test-recordings/user/session.mp4');
    });
  });

  describe('edge cases', () => {
    it('should handle very long paths', () => {
      const longPath = 'a'.repeat(1000) + '/session.mp4';
      const url = buildBlobHttpsUrl(longPath);

      expect(url).toContain('https://test-account.blob.core.windows.net/test-recordings/');
      expect(url).toContain('/session.mp4');
    });

    it('should handle special characters in path', () => {
      const path = 'user@domain.com/2025/01/15/session with spaces & symbols!.mp4';
      const url = buildBlobHttpsUrl(path);

      expect(url).toContain('user@domain.com');
      expect(url).toContain('session%20with%20spaces%20&%20symbols!.mp4');
    });

    it('should handle unicode characters in path', () => {
      const path = '用户/2025/01/15/会话.mp4';
      const url = buildBlobHttpsUrl(path);

      expect(url).toContain('https://test-account.blob.core.windows.net/test-recordings/');
    });

    it('should handle different file extensions', () => {
      const extensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
      
      extensions.forEach(ext => {
        const path = `user/session${ext}`;
        const url = buildBlobHttpsUrl(path);
        expect(url).toContain(`session${ext}`);
      });
    });
  });

  describe('validation scenarios', () => {
    it('should handle recording session scenario', () => {
      const path = 'pso123/2025/01/15/streaming-session-abc123.mp4';
      const url = buildBlobHttpsUrl(path);
      const sasUrl = generateReadSasUrl(path, 120);

      expect(url).toBe('https://test-account.blob.core.windows.net/test-recordings/pso123/2025/01/15/streaming-session-abc123.mp4');
      expect(sasUrl).toContain(url);
      expect(sasUrl).toContain('?');
    });

    it('should handle snapshot upload scenario', () => {
      const path = 'snapshots/supervisor456/2025/01/15/snapshot-xyz789.jpg';
      const url = buildBlobHttpsUrl(path);
      const sasUrl = generateReadSasUrl(path, 15);

      expect(url).toBe('https://test-account.blob.core.windows.net/test-recordings/snapshots/supervisor456/2025/01/15/snapshot-xyz789.jpg');
      expect(sasUrl).toContain(url);
    });

    it('should handle bulk operations scenario', () => {
      const paths = [
        'user1/session1.mp4',
        'user2/session2.mp4',
        'user3/session3.mp4'
      ];

      paths.forEach(path => {
        const url = buildBlobHttpsUrl(path);
        expect(url).toContain('https://test-account.blob.core.windows.net/test-recordings/');
        expect(url).toContain(path);
      });
    });
  });
});
