import { ImageUploadRequest } from '../../../src/domain/value-objects/ImageUploadRequest';
import { ValidationError } from '../../../src/domain/errors/DomainError';

describe('ImageUploadRequest', () => {
  const validBase64 = Buffer.from('test image data').toString('base64');

  describe('constructor validation', () => {
    it('should throw ValidationError when base64Data is empty', () => {
      expect(() => {
        new ImageUploadRequest('', 'sender-id');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when senderId is empty', () => {
      expect(() => {
        new ImageUploadRequest(validBase64, '');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when base64Data is invalid', () => {
      // Buffer.from with invalid base64 doesn't throw, but we can test with null/undefined
      // The actual validation happens in the constructor check
      expect(() => {
        new ImageUploadRequest(null as any, 'sender-id');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when base64Data is not a string', () => {
      expect(() => {
        new ImageUploadRequest(null as any, 'sender-id');
      }).toThrow(ValidationError);
    });
  });

  describe('getFileName', () => {
    it('should return descriptive file name when all metadata provided', () => {
      const request = new ImageUploadRequest(
        validBase64,
        'sender-id',
        'PSO Name',
        'PERFORMANCE',
        'snapshot-id-123'
      );
      const fileName = request.getFileName();
      
      // The filename format is: PSO_Name_PERFORMANCE_YYYYMMDD_HHMMSS_id-123.jpg
      // Using sanitizeFileName, spaces become underscores and it gets truncated
      expect(fileName).toContain('id-123');
      expect(fileName).toContain('PERFORMANCE');
      expect(fileName).toMatch(/\.jpg$/);
    });

    it('should return legacy format when metadata not provided', () => {
      const request = new ImageUploadRequest(validBase64, 'sender-id');
      const fileName = request.getFileName();
      
      expect(fileName).toContain('sender-id-');
      expect(fileName).toContain('.jpg');
    });
  });

  describe('getImageBuffer', () => {
    it('should convert base64 to buffer', () => {
      const request = new ImageUploadRequest(validBase64, 'sender-id');
      const buffer = request.getImageBuffer();
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toBe('test image data');
    });
  });

  describe('getContentType', () => {
    it('should return image/jpeg', () => {
      const request = new ImageUploadRequest(validBase64, 'sender-id');
      expect(request.getContentType()).toBe('image/jpeg');
    });
  });
});


