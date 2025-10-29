/**
 * @fileoverview Tests for ImageProcessingService
 * @description Tests for image processing domain service
 */

import { ImageProcessingService } from '../../../../shared/domain/services/ImageProcessingService';
import { IBlobStorageService } from '../../../../shared/domain/interfaces/IBlobStorageService';
import { ImageUploadRequest } from '../../../../shared/domain/value-objects/ImageUploadRequest';

describe('ImageProcessingService', () => {
  let imageProcessingService: ImageProcessingService;
  let mockBlobStorageService: jest.Mocked<IBlobStorageService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBlobStorageService = {
      uploadImage: jest.fn(),
    } as any;

    imageProcessingService = new ImageProcessingService(mockBlobStorageService);
  });

  describe('constructor', () => {
    it('should create ImageProcessingService instance', () => {
      expect(imageProcessingService).toBeInstanceOf(ImageProcessingService);
    });
  });

  describe('processAndUploadImage', () => {
    it('should process and upload image successfully', async () => {
      const mockBase64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const mockSenderId = 'sender-123';
      const mockImageUrl = 'https://example.com/image.jpg';

      mockBlobStorageService.uploadImage.mockResolvedValue(mockImageUrl);

      const result = await imageProcessingService.processAndUploadImage(mockBase64Data, mockSenderId);

      expect(mockBlobStorageService.uploadImage).toHaveBeenCalledWith(
        expect.any(ImageUploadRequest)
      );
      expect(result).toBe(mockImageUrl);
    });

    it('should throw error when upload fails', async () => {
      const mockError = new Error('Upload error');
      mockBlobStorageService.uploadImage.mockRejectedValue(mockError);

      const mockBase64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const mockSenderId = 'sender-123';

      await expect(
        imageProcessingService.processAndUploadImage(mockBase64Data, mockSenderId)
      ).rejects.toThrow('Failed to process and upload image: Upload error');
    });
  });

  describe('validateImageData', () => {
    it('should return true for valid base64 data', () => {
      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      const result = imageProcessingService.validateImageData(validBase64);
      
      expect(result).toBe(true);
    });

    it('should return false for null data', () => {
      const result = imageProcessingService.validateImageData(null as any);
      
      expect(result).toBe(false);
    });

    it('should return false for undefined data', () => {
      const result = imageProcessingService.validateImageData(undefined as any);
      
      expect(result).toBe(false);
    });

    it('should return false for non-string data', () => {
      const result = imageProcessingService.validateImageData(123 as any);
      
      expect(result).toBe(false);
    });

    it('should return false for invalid base64 data', () => {
      const invalidBase64 = 'not-valid-base64!@#$';
      
      const result = imageProcessingService.validateImageData(invalidBase64);
      
      expect(result).toBe(false);
    });
  });

  describe('getImageMetadata', () => {
    it('should return image metadata', () => {
      const mockBase64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      const result = imageProcessingService.getImageMetadata(mockBase64Data);
      
      expect(result).toEqual({
        size: expect.any(Number),
        contentType: 'image/jpeg'
      });
      expect(result.size).toBeGreaterThan(0);
    });

    it('should return metadata for different base64 data', () => {
      const differentBase64 = 'Qk0CAAAAAAAAADYAAAAoAAAAAQAAAAEAAAABAAEAAA==';
      
      const result = imageProcessingService.getImageMetadata(differentBase64);
      
      expect(result).toEqual({
        size: expect.any(Number),
        contentType: 'image/jpeg'
      });
      expect(result.size).toBeGreaterThan(0);
    });
  });
});

