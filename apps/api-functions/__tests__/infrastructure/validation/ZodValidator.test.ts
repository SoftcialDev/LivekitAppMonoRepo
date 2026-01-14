import { z } from 'zod';
import { ZodValidator } from '../../../src/infrastructure/validation/ZodValidator';
import { InvalidFormatError } from '../../../src/domain/errors';

describe('ZodValidator', () => {
  let validator: ZodValidator;

  beforeEach(() => {
    validator = new ZodValidator();
  });

  describe('validate', () => {
    it('should return success with validated data for valid input', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: 'John', age: 30 };

      const result = validator.validate(schema, data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('should return errors for invalid input', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: 'John', age: 'not-a-number' };

      const result = validator.validate(schema, data);

      expect(result.success).toBe(false);
      if (!result.success && result.errors) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toBeInstanceOf(InvalidFormatError);
      }
    });

    it('should handle nested validation errors', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
      });

      const data = { user: { name: 'John', email: 'invalid-email' } };

      const result = validator.validate(schema, data);

      expect(result.success).toBe(false);
      if (!result.success && result.errors) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain('email');
      }
    });

    it('should throw non-ZodError exceptions', () => {
      const schema = z.object({
        name: z.string(),
      });

      const throwingSchema = {
        parse: () => {
          throw new Error('Custom error');
        },
      } as any;

      expect(() => validator.validate(throwingSchema, { name: 'test' })).toThrow('Custom error');
    });
  });

  describe('safeValidate', () => {
    it('should return success with validated data for valid input', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: 'John', age: 30 };

      const result = validator.safeValidate(schema, data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('should return errors for invalid input', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: 'John', age: 'not-a-number' };

      const result = validator.safeValidate(schema, data);

      expect(result.success).toBe(false);
      if (!result.success && result.errors) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toBeInstanceOf(InvalidFormatError);
      }
    });

    it('should handle multiple validation errors', () => {
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().min(18),
      });

      const data = { name: 'Jo', email: 'invalid', age: 15 };

      const result = validator.safeValidate(schema, data);

      expect(result.success).toBe(false);
      if (!result.success && result.errors) {
        expect(result.errors.length).toBeGreaterThan(1);
      }
    });

    it('should format error paths correctly', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
          }),
        }),
      });

      const data = { user: { profile: { name: 123 } } };

      const result = validator.safeValidate(schema, data);

      expect(result.success).toBe(false);
      if (!result.success && result.errors) {
        expect(result.errors[0].message).toContain('user.profile.name');
      }
    });
  });
});

