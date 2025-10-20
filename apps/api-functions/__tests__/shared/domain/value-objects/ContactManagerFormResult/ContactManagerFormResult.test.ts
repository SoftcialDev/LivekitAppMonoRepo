/**
 * @fileoverview ContactManagerFormResult value object - unit tests
 * @summary Tests for ContactManagerFormResult value object functionality
 * @description Validates result creation, validation, and payload conversion
 */

// Mock dateUtils
jest.mock('../../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2023-01-01T12:00:00Z'))
}));

import { ContactManagerFormResult, ContactManagerFormResultPayload } from '../../../../../shared/domain/value-objects/ContactManagerFormResult';

describe('ContactManagerFormResult', () => {
  describe('constructor', () => {
    it('should create result with all properties', () => {
      const result = new ContactManagerFormResult(
        'form-123',
        true,
        'https://example.com/image.jpg'
      );

      expect(result.formId).toBe('form-123');
      expect(result.messageSent).toBe(true);
      expect(result.imageUrl).toBe('https://example.com/image.jpg');
      expect(result.timestamp).toEqual(new Date('2023-01-01T12:00:00Z'));
    });

    it('should create result without image URL', () => {
      const result = new ContactManagerFormResult(
        'form-456',
        false
      );

      expect(result.formId).toBe('form-456');
      expect(result.messageSent).toBe(false);
      expect(result.imageUrl).toBeUndefined();
    });

    it('should throw error for empty form ID', () => {
      expect(() => {
        new ContactManagerFormResult('', true);
      }).toThrow('Form ID must be a non-empty string');
    });

    it('should throw error for null form ID', () => {
      expect(() => {
        new ContactManagerFormResult(null as any, true);
      }).toThrow('Form ID must be a non-empty string');
    });

    it('should throw error for undefined form ID', () => {
      expect(() => {
        new ContactManagerFormResult(undefined as any, true);
      }).toThrow('Form ID must be a non-empty string');
    });

    it('should throw error for non-string form ID', () => {
      expect(() => {
        new ContactManagerFormResult(123 as any, true);
      }).toThrow('Form ID must be a non-empty string');
    });

    it('should accept whitespace-only form ID (validation allows them)', () => {
      const result = new ContactManagerFormResult('   ', true);
      expect(result.formId).toBe('   ');
    });
  });

  describe('fromFormCreation', () => {
    it('should create result from form creation with image', () => {
      const result = ContactManagerFormResult.fromFormCreation(
        'form-789',
        true,
        'https://example.com/image.png'
      );

      expect(result.formId).toBe('form-789');
      expect(result.messageSent).toBe(true);
      expect(result.imageUrl).toBe('https://example.com/image.png');
      expect(result.timestamp).toEqual(new Date('2023-01-01T12:00:00Z'));
    });

    it('should create result from form creation without image', () => {
      const result = ContactManagerFormResult.fromFormCreation(
        'form-abc',
        false
      );

      expect(result.formId).toBe('form-abc');
      expect(result.messageSent).toBe(false);
      expect(result.imageUrl).toBeUndefined();
    });

    it('should throw error for invalid form ID in factory method', () => {
      expect(() => {
        ContactManagerFormResult.fromFormCreation('', true);
      }).toThrow('Form ID must be a non-empty string');
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format with image', () => {
      const result = new ContactManagerFormResult(
        'form-123',
        true,
        'https://example.com/image.jpg'
      );

      const payload = result.toPayload();

      expect(payload).toEqual({
        formId: 'form-123',
        messageSent: true,
        imageUrl: 'https://example.com/image.jpg'
      });
    });

    it('should convert to payload format without image', () => {
      const result = new ContactManagerFormResult(
        'form-456',
        false
      );

      const payload = result.toPayload();

      expect(payload).toEqual({
        formId: 'form-456',
        messageSent: false,
        imageUrl: undefined
      });
    });

    it('should handle different message sent states', () => {
      const successResult = new ContactManagerFormResult('form-1', true);
      const failureResult = new ContactManagerFormResult('form-2', false);

      expect(successResult.toPayload().messageSent).toBe(true);
      expect(failureResult.toPayload().messageSent).toBe(false);
    });
  });

  describe('payload interface', () => {
    it('should match ContactManagerFormResultPayload interface', () => {
      const payload: ContactManagerFormResultPayload = {
        formId: 'form-123',
        messageSent: true,
        imageUrl: 'https://example.com/image.jpg'
      };

      expect(payload.formId).toBe('form-123');
      expect(payload.messageSent).toBe(true);
      expect(payload.imageUrl).toBe('https://example.com/image.jpg');
    });

    it('should handle payload without image URL', () => {
      const payload: ContactManagerFormResultPayload = {
        formId: 'form-456',
        messageSent: false
      };

      expect(payload.formId).toBe('form-456');
      expect(payload.messageSent).toBe(false);
      expect(payload.imageUrl).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const result = new ContactManagerFormResult(
        'form-123',
        true,
        'https://example.com/image.jpg'
      );

      // TypeScript should prevent these assignments
      expect(() => {
        (result as any).formId = 'form-456';
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (result as any).messageSent = false;
      }).not.toThrow();

      expect(() => {
        (result as any).timestamp = new Date();
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle long form IDs', () => {
      const longFormId = 'form-' + 'a'.repeat(1000);
      const result = new ContactManagerFormResult(longFormId, true);

      expect(result.formId).toBe(longFormId);
    });

    it('should handle special characters in form ID', () => {
      const specialFormId = 'form-123_abc-456.def';
      const result = new ContactManagerFormResult(specialFormId, true);

      expect(result.formId).toBe(specialFormId);
    });

    it('should handle long image URLs', () => {
      const longImageUrl = 'https://example.com/' + 'a'.repeat(1000) + '.jpg';
      const result = new ContactManagerFormResult('form-123', true, longImageUrl);

      expect(result.imageUrl).toBe(longImageUrl);
    });

    it('should handle different image URL formats', () => {
      const httpUrl = 'http://example.com/image.jpg';
      const httpsUrl = 'https://example.com/image.png';
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD';

      const httpResult = new ContactManagerFormResult('form-1', true, httpUrl);
      const httpsResult = new ContactManagerFormResult('form-2', true, httpsUrl);
      const dataResult = new ContactManagerFormResult('form-3', true, dataUrl);

      expect(httpResult.imageUrl).toBe(httpUrl);
      expect(httpsResult.imageUrl).toBe(httpsUrl);
      expect(dataResult.imageUrl).toBe(dataUrl);
    });
  });

  describe('type safety', () => {
    it('should accept boolean for messageSent', () => {
      const trueResult = new ContactManagerFormResult('form-1', true);
      const falseResult = new ContactManagerFormResult('form-2', false);

      expect(typeof trueResult.messageSent).toBe('boolean');
      expect(typeof falseResult.messageSent).toBe('boolean');
    });

    it('should accept string for form ID', () => {
      const result = new ContactManagerFormResult('form-123', true);

      expect(typeof result.formId).toBe('string');
    });

    it('should accept optional string for image URL', () => {
      const withImageResult = new ContactManagerFormResult('form-1', true, 'image.jpg');
      const withoutImageResult = new ContactManagerFormResult('form-2', true);

      expect(typeof withImageResult.imageUrl).toBe('string');
      expect(withoutImageResult.imageUrl).toBeUndefined();
    });
  });

  describe('validation scenarios', () => {
    it('should handle successful form creation with message', () => {
      const result = new ContactManagerFormResult(
        'form-success-123',
        true,
        'https://storage.example.com/images/form-success-123.jpg'
      );

      expect(result.formId).toBe('form-success-123');
      expect(result.messageSent).toBe(true);
      expect(result.imageUrl).toBe('https://storage.example.com/images/form-success-123.jpg');
    });

    it('should handle failed form creation without message', () => {
      const result = new ContactManagerFormResult(
        'form-failed-456',
        false
      );

      expect(result.formId).toBe('form-failed-456');
      expect(result.messageSent).toBe(false);
      expect(result.imageUrl).toBeUndefined();
    });
  });
});
