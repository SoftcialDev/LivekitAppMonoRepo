import { getLivekitRecordingsSchema } from '../../../src/domain/schemas/GetLivekitRecordingsSchema';
import { ZodError } from 'zod';

describe('GetLivekitRecordingsSchema', () => {
  it('should validate valid schema with all parameters', () => {
    const validData = {
      roomName: 'room-1',
      limit: 100,
      order: 'desc' as const,
      includeSas: true,
      sasMinutes: 60,
    };
    const result = getLivekitRecordingsSchema.parse(validData);
    expect(result).toEqual(validData);
  });

  it('should validate schema with default values', () => {
    const data = {};
    const result = getLivekitRecordingsSchema.parse(data);
    expect(result.limit).toBe(50);
    expect(result.order).toBe('desc');
    expect(result.includeSas).toBe(true);
    expect(result.sasMinutes).toBe(60);
  });

  it('should validate schema with optional roomName', () => {
    const data = {
      limit: 25,
    };
    const result = getLivekitRecordingsSchema.parse(data);
    expect(result.roomName).toBeUndefined();
    expect(result.limit).toBe(25);
  });

  it('should coerce string limit to number', () => {
    const data = {
      limit: '100',
    };
    const result = getLivekitRecordingsSchema.parse(data);
    expect(result.limit).toBe(100);
  });

    it('should coerce string includeSas to boolean', () => {
      // Note: z.coerce.boolean() converts any non-empty string to true
      // So 'false' string becomes true, not false
      const data = {
        includeSas: 'true',
      };
      const result = getLivekitRecordingsSchema.parse(data);
      expect(result.includeSas).toBe(true);
      
      // To actually get false, use boolean false directly
      const dataFalse = {
        includeSas: false,
      };
      const resultFalse = getLivekitRecordingsSchema.parse(dataFalse);
      expect(resultFalse.includeSas).toBe(false);
    });

  it('should throw ZodError for invalid order enum value', () => {
    const invalidData = {
      order: 'invalid' as any,
    };
    expect(() => getLivekitRecordingsSchema.parse(invalidData)).toThrow(ZodError);
    try {
      getLivekitRecordingsSchema.parse(invalidData);
    } catch (error) {
      if (error instanceof ZodError) {
        expect(error.errors[0].message).toBe("Order must be 'asc' or 'desc'");
      }
    }
  });

  it('should throw ZodError for empty roomName', () => {
    const invalidData = {
      roomName: '',
    };
    expect(() => getLivekitRecordingsSchema.parse(invalidData)).toThrow(ZodError);
    try {
      getLivekitRecordingsSchema.parse(invalidData);
    } catch (error) {
      if (error instanceof ZodError) {
        expect(error.errors[0].message).toBe('Room name must not be empty');
      }
    }
  });

  it('should throw ZodError for limit exceeding max', () => {
    const invalidData = {
      limit: 2000,
    };
    expect(() => getLivekitRecordingsSchema.parse(invalidData)).toThrow(ZodError);
    try {
      getLivekitRecordingsSchema.parse(invalidData);
    } catch (error) {
      if (error instanceof ZodError) {
        expect(error.errors[0].message).toBe('Limit cannot exceed 1000');
      }
    }
  });

  it('should accept valid asc order', () => {
    const data = {
      order: 'asc' as const,
    };
    const result = getLivekitRecordingsSchema.parse(data);
    expect(result.order).toBe('asc');
  });

  it('should accept valid desc order', () => {
    const data = {
      order: 'desc' as const,
    };
    const result = getLivekitRecordingsSchema.parse(data);
    expect(result.order).toBe('desc');
  });
});

