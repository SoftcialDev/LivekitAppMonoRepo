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
      expect(() => {
        new ImageUploadRequest('invalid-base64!!!', 'sender-id');
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
      
      expect(fileName).toContain('snapshot-id-123');
      expect(fileName).toContain('PSO Name');
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

