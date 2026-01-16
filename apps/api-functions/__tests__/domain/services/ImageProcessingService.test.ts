import { ImageProcessingService } from '../../../src/domain/services/ImageProcessingService';
import { IBlobStorageService } from '../../../src/domain/interfaces/IBlobStorageService';
import { ApplicationError } from '../../../src/domain/errors/DomainError';
import { createMockBlobStorageService } from './domainServiceTestSetup';

describe('ImageProcessingService', () => {
  let service: ImageProcessingService;
  let mockBlobStorageService: jest.Mocked<IBlobStorageService>;

  beforeEach(() => {
    mockBlobStorageService = createMockBlobStorageService();
    service = new ImageProcessingService(mockBlobStorageService);
  });

  describe('processAndUploadImage', () => {
    it('should process and upload image successfully', async () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const senderId = 'user-id';
      const imageUrl = 'https://storage.example.com/image.jpg';

      mockBlobStorageService.uploadImage.mockResolvedValue(imageUrl);

      const result = await service.processAndUploadImage(base64Data, senderId);

      expect(mockBlobStorageService.uploadImage).toHaveBeenCalled();
      expect(result).toBe(imageUrl);
    });

    it('should throw ApplicationError when upload fails', async () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const senderId = 'user-id';

      mockBlobStorageService.uploadImage.mockRejectedValue(new Error('Upload failed'));

      await expect(service.processAndUploadImage(base64Data, senderId)).rejects.toThrow(ApplicationError);
      await expect(service.processAndUploadImage(base64Data, senderId)).rejects.toThrow('Failed to process and upload image');
    });
  });

  describe('validateImageData', () => {
    it('should return true for valid base64 data', () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(service.validateImageData(base64Data)).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(service.validateImageData('')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(service.validateImageData(null as any)).toBe(false);
      expect(service.validateImageData(undefined as any)).toBe(false);
    });

    it('should return false for invalid base64 format', () => {
      expect(service.validateImageData('invalid-base64!!!')).toBe(false);
    });

    it('should return false for base64 with invalid characters', () => {
      expect(service.validateImageData('invalid@base64#data$')).toBe(false);
    });
  });

  describe('getImageMetadata', () => {
    it('should return image metadata', () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const metadata = service.getImageMetadata(base64Data);

      expect(metadata).toHaveProperty('size');
      expect(metadata).toHaveProperty('contentType');
      expect(metadata.contentType).toBe('image/jpeg');
      expect(metadata.size).toBeGreaterThan(0);
    });
  });
});



