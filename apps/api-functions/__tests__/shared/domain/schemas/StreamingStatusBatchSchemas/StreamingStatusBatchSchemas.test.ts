/**
 * @fileoverview StreamingStatusBatchSchemas - unit tests
 * @summary Tests for StreamingStatusBatchSchemas validation functionality
 * @description Validates StreamingStatusBatchSchemas validation functions
 */

import { validateEmailArray, emailArraySchema, batchRequestSchema } from '../../../../../shared/domain/schemas/StreamingStatusBatchSchemas';

describe('StreamingStatusBatchSchemas', () => {
  describe('validateEmailArray', () => {
    it('should validate valid email array', () => {
      const emails = ['user@example.com', 'admin@test.com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate single email', () => {
      const emails = ['user@example.com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate maximum number of emails', () => {
      const emails = Array.from({ length: 1000 }, (_, i) => `user${i}@example.com`);

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate emails with different domains', () => {
      const emails = [
        'user@example.com',
        'admin@test.org',
        'support@company.net',
        'info@domain.co.uk'
      ];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate emails with special characters', () => {
      const emails = [
        'user+tag@example.com',
        'user.name@example.com',
        'user_name@example.com',
        'user-name@example.com'
      ];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate emails with numbers', () => {
      const emails = [
        'user123@example.com',
        'admin456@test.com',
        'support789@company.com'
      ];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate emails with unicode characters', () => {
      const emails = [
        'usuario@ejemplo.com',
        'админ@тест.ру',
        '用户@测试.中国'
      ];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-array input', () => {
      const emails = 'not an array';

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be an array');
    });

    it('should reject null input', () => {
      const emails = null;

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be an array');
    });

    it('should reject undefined input', () => {
      const emails = undefined;

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be an array');
    });

    it('should reject empty array', () => {
      const emails: string[] = [];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails array cannot be empty');
    });

    it('should reject array exceeding maximum length', () => {
      const emails = Array.from({ length: 1001 }, (_, i) => `user${i}@example.com`);

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails array cannot exceed 1000 items');
    });

    it('should reject invalid email format', () => {
      const emails = ['invalid-email', 'user@', '@example.com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be valid email addresses');
    });

    it('should reject empty string email', () => {
      const emails = [''];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be valid email addresses');
    });

    it('should reject non-string email', () => {
      const emails = [123, true, {}, []];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be valid email addresses');
    });

    it('should reject email exceeding maximum length', () => {
      const emails = ['a'.repeat(256) + '@example.com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be valid email addresses');
    });

    it('should reject duplicate emails', () => {
      const emails = ['user@example.com', 'user@example.com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be unique');
    });

    it('should reject duplicate emails with different case', () => {
      const emails = ['user@example.com', 'USER@example.com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be unique');
    });

    it('should reject mixed valid and invalid emails', () => {
      const emails = ['user@example.com', 'invalid-email', 'admin@test.com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be valid email addresses');
    });

    it('should reject emails with spaces', () => {
      const emails = ['user @example.com', 'user@ example.com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be valid email addresses');
    });

    it('should reject emails with multiple @ symbols', () => {
      const emails = ['user@@example.com', 'user@example@com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be valid email addresses');
    });

    it('should reject emails without domain', () => {
      const emails = ['user@', 'user@.com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be valid email addresses');
    });

    it('should reject emails without local part', () => {
      const emails = ['@example.com', '.@example.com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('emails must be valid email addresses');
    });
  });

  describe('emailArraySchema', () => {
    it('should have correct schema structure', () => {
      expect(emailArraySchema.type).toBe('array');
      expect(emailArraySchema.minItems).toBe(1);
      expect(emailArraySchema.maxItems).toBe(1000);
      expect(emailArraySchema.uniqueItems).toBe(true);
      expect(emailArraySchema.items.type).toBe('string');
      expect(emailArraySchema.items.format).toBe('email');
      expect(emailArraySchema.items.minLength).toBe(1);
      expect(emailArraySchema.items.maxLength).toBe(255);
    });
  });

  describe('batchRequestSchema', () => {
    it('should have correct schema structure', () => {
      expect(batchRequestSchema.type).toBe('object');
      expect(batchRequestSchema.required).toEqual(['emails']);
      expect(batchRequestSchema.properties.emails).toBe(emailArraySchema);
      expect(batchRequestSchema.additionalProperties).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle very long valid emails', () => {
      const emails = ['a'.repeat(200) + '@example.com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle emails with maximum length', () => {
      const emails = ['a'.repeat(200) + '@example.com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle emails with minimum length', () => {
      const emails = ['a@b.c'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle emails with special characters in domain', () => {
      const emails = ['user@example-domain.com', 'user@test_domain.org'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle emails with subdomains', () => {
      const emails = ['user@sub.example.com', 'admin@deep.sub.example.com'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle emails with country code domains', () => {
      const emails = ['user@example.co.uk', 'admin@test.com.au'];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validation scenarios', () => {
    it('should validate batch streaming status request', () => {
      const emails = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com'
      ];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate large batch request', () => {
      const emails = Array.from({ length: 100 }, (_, i) => `user${i}@example.com`);

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate mixed case emails', () => {
      const emails = [
        'User@Example.com',
        'ADMIN@Test.com',
        'support@COMPANY.com'
      ];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate emails with tags', () => {
      const emails = [
        'user+tag1@example.com',
        'user+tag2@example.com',
        'user+tag3@example.com'
      ];

      const result = validateEmailArray(emails);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});

