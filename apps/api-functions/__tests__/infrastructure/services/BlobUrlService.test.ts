import { BlobUrlService } from '../../../src/infrastructure/services/BlobUrlService';
import { buildBlobHttpsUrl, generateReadSasUrl } from '../../../src/infrastructure/services/blobSigner';

jest.mock('../../../src/infrastructure/services/blobSigner');

const mockBuildBlobHttpsUrl = buildBlobHttpsUrl as jest.MockedFunction<typeof buildBlobHttpsUrl>;
const mockGenerateReadSasUrl = generateReadSasUrl as jest.MockedFunction<typeof generateReadSasUrl>;

describe('BlobUrlService', () => {
  let service: BlobUrlService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BlobUrlService();
  });

  describe('buildBlobHttpsUrl', () => {
    it('should delegate to buildBlobHttpsUrl utility function', () => {
      const blobPath = 'path/to/blob.mp4';
      const expectedUrl = 'https://account.blob.core.windows.net/container/path/to/blob.mp4';
      
      mockBuildBlobHttpsUrl.mockReturnValue(expectedUrl);

      const result = service.buildBlobHttpsUrl(blobPath);

      expect(mockBuildBlobHttpsUrl).toHaveBeenCalledWith(blobPath);
      expect(result).toBe(expectedUrl);
    });

    it('should handle paths with special characters', () => {
      const blobPath = 'path/to/file with spaces.mp4';
      const expectedUrl = 'https://account.blob.core.windows.net/container/path/to/file%20with%20spaces.mp4';
      
      mockBuildBlobHttpsUrl.mockReturnValue(expectedUrl);

      const result = service.buildBlobHttpsUrl(blobPath);

      expect(mockBuildBlobHttpsUrl).toHaveBeenCalledWith(blobPath);
      expect(result).toBe(expectedUrl);
    });

    it('should handle nested paths', () => {
      const blobPath = 'user/2024/01/15/recording.mp4';
      const expectedUrl = 'https://account.blob.core.windows.net/container/user/2024/01/15/recording.mp4';
      
      mockBuildBlobHttpsUrl.mockReturnValue(expectedUrl);

      const result = service.buildBlobHttpsUrl(blobPath);

      expect(mockBuildBlobHttpsUrl).toHaveBeenCalledWith(blobPath);
      expect(result).toBe(expectedUrl);
    });
  });

  describe('generateReadSasUrl', () => {
    it('should delegate to generateReadSasUrl utility function', () => {
      const blobPath = 'path/to/blob.mp4';
      const minutes = 30;
      const expectedUrl = 'https://account.blob.core.windows.net/container/path/to/blob.mp4?sas=token';
      
      mockGenerateReadSasUrl.mockReturnValue(expectedUrl);

      const result = service.generateReadSasUrl(blobPath, minutes);

      expect(mockGenerateReadSasUrl).toHaveBeenCalledWith(blobPath, minutes);
      expect(result).toBe(expectedUrl);
    });

    it('should pass minutes parameter correctly', () => {
      const blobPath = 'path/to/blob.mp4';
      const minutes = 60;
      
      mockGenerateReadSasUrl.mockReturnValue('https://example.com/blob.mp4?sas=token');

      service.generateReadSasUrl(blobPath, minutes);

      expect(mockGenerateReadSasUrl).toHaveBeenCalledWith(blobPath, 60);
    });

    it('should handle different expiration times', () => {
      const blobPath = 'path/to/blob.mp4';
      
      mockGenerateReadSasUrl.mockReturnValue('https://example.com/blob.mp4?sas=token');

      service.generateReadSasUrl(blobPath, 15);
      service.generateReadSasUrl(blobPath, 120);

      expect(mockGenerateReadSasUrl).toHaveBeenCalledWith(blobPath, 15);
      expect(mockGenerateReadSasUrl).toHaveBeenCalledWith(blobPath, 120);
    });
  });
});

