import { withBodyValidation, withQueryValidation, withPathValidation } from '../../../shared/middleware/validate';
import { Context } from '@azure/functions';
import { ZodSchema, ZodError } from 'zod';
import { badRequest } from '../../../shared/utils/response';

// Mock dependencies
jest.mock('../../../shared/utils/response');

const mockBadRequest = badRequest as jest.MockedFunction<typeof badRequest>;

describe('validate middleware', () => {
  let mockContext: Context;
  let mockNext: jest.MockedFunction<() => Promise<void>>;
  let mockSchema: jest.Mocked<ZodSchema<any>>;

  beforeEach(() => {
    mockContext = {
      req: {
        body: { test: 'data' },
        query: { param: 'value' }
      },
      bindingData: { id: '123' },
      bindings: {}
    } as any;
    
    mockNext = jest.fn().mockResolvedValue(undefined);
    
    // Create mock schema
    mockSchema = {
      parse: jest.fn()
    } as any;
    
    // Setup response mock to throw error
    mockBadRequest.mockImplementation(() => {
      throw new Error('badRequest called');
    });
    
    jest.clearAllMocks();
  });

  describe('withBodyValidation', () => {
    it('should validate body successfully', async () => {
      const validatedData = { test: 'validated-data' };
      mockSchema.parse.mockReturnValue(validatedData);

      const middleware = withBodyValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockSchema.parse).toHaveBeenCalledWith(mockContext.req!.body);
      expect(mockContext.bindings.validatedBody).toBe(validatedData);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle missing HTTP request context', async () => {
      mockContext.req = undefined;

      const middleware = withBodyValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 500,
        body: "No HTTP request context"
      });
      expect(mockSchema.parse).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing request body', async () => {
      mockContext.req!.body = undefined;

      const middleware = withBodyValidation(mockSchema);
      await expect(middleware(mockContext, mockNext)).rejects.toThrow('badRequest called');
      
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, "Request body is required");
      expect(mockSchema.parse).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle Zod validation errors', async () => {
      const zodError = new ZodError([
        { path: ['field'], message: 'Required', code: 'invalid_type', expected: 'string', received: 'undefined' } as any
      ]);
      mockSchema.parse.mockImplementation(() => {
        throw zodError;
      });

      const middleware = withBodyValidation(mockSchema);
      await expect(middleware(mockContext, mockNext)).rejects.toThrow('badRequest called');
      
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, {
        validationErrors: [
          { path: ['field'], message: 'Required' }
        ]
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle multiple Zod validation errors', async () => {
      const zodError = new ZodError([
        { path: ['field1'], message: 'Required', code: 'invalid_type', expected: 'string', received: 'undefined' } as any,
        { path: ['field2'], message: 'Invalid format', code: 'invalid_string', validation: 'email' } as any
      ]);
      mockSchema.parse.mockImplementation(() => {
        throw zodError;
      });

      const middleware = withBodyValidation(mockSchema);
      await expect(middleware(mockContext, mockNext)).rejects.toThrow('badRequest called');
      
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, {
        validationErrors: [
          { path: ['field1'], message: 'Required' },
          { path: ['field2'], message: 'Invalid format' }
        ]
      });
    });

    it('should rethrow non-Zod errors', async () => {
      const error = new Error('Unexpected error');
      mockSchema.parse.mockImplementation(() => {
        throw error;
      });

      const middleware = withBodyValidation(mockSchema);
      await expect(middleware(mockContext, mockNext)).rejects.toThrow('Unexpected error');
      
      expect(mockBadRequest).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should initialize bindings if not present', async () => {
      mockContext.bindings = undefined as any;
      const validatedData = { test: 'data' };
      mockSchema.parse.mockReturnValue(validatedData);

      const middleware = withBodyValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockContext.bindings).toBeDefined();
      expect(mockContext.bindings.validatedBody).toBe(validatedData);
    });

    it('should preserve existing bindings', async () => {
      mockContext.bindings = { existing: 'value' };
      const validatedData = { test: 'data' };
      mockSchema.parse.mockReturnValue(validatedData);

      const middleware = withBodyValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockContext.bindings.existing).toBe('value');
      expect(mockContext.bindings.validatedBody).toBe(validatedData);
    });
  });

  describe('withQueryValidation', () => {
    it('should validate query parameters successfully', async () => {
      const validatedData = { param: 'validated-value' };
      mockSchema.parse.mockReturnValue(validatedData);

      const middleware = withQueryValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockSchema.parse).toHaveBeenCalledWith(mockContext.req!.query);
      expect(mockContext.bindings.validatedQuery).toBe(validatedData);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle missing HTTP request context', async () => {
      mockContext.req = undefined;

      const middleware = withQueryValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 500,
        body: "No HTTP request context"
      });
      expect(mockSchema.parse).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing query parameters', async () => {
      mockContext.req!.query = undefined as any;
      const validatedData = {};
      mockSchema.parse.mockReturnValue(validatedData);

      const middleware = withQueryValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockSchema.parse).toHaveBeenCalledWith({});
      expect(mockContext.bindings.validatedQuery).toBe(validatedData);
    });

    it('should handle Zod validation errors', async () => {
      const zodError = new ZodError([
        { path: ['param'], message: 'Invalid format', code: 'invalid_string', validation: 'email' } as any
      ]);
      mockSchema.parse.mockImplementation(() => {
        throw zodError;
      });

      const middleware = withQueryValidation(mockSchema);
      await expect(middleware(mockContext, mockNext)).rejects.toThrow('badRequest called');
      
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, {
        validationErrors: [
          { path: ['param'], message: 'Invalid format' }
        ]
      });
    });

    it('should rethrow non-Zod errors', async () => {
      const error = new Error('Unexpected error');
      mockSchema.parse.mockImplementation(() => {
        throw error;
      });

      const middleware = withQueryValidation(mockSchema);
      await expect(middleware(mockContext, mockNext)).rejects.toThrow('Unexpected error');
      
      expect(mockBadRequest).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('withPathValidation', () => {
    it('should validate path parameters successfully', async () => {
      const validatedData = { id: '123' };
      mockSchema.parse.mockReturnValue(validatedData);

      const middleware = withPathValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockSchema.parse).toHaveBeenCalledWith(mockContext.bindingData);
      expect(mockContext.bindings.validatedParams).toBe(validatedData);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle missing HTTP request context', async () => {
      mockContext.req = undefined;

      const middleware = withPathValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 500,
        body: "No HTTP request context"
      });
      expect(mockSchema.parse).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing binding data', async () => {
      mockContext.bindingData = undefined as any;
      const validatedData = {};
      mockSchema.parse.mockReturnValue(validatedData);

      const middleware = withPathValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockSchema.parse).toHaveBeenCalledWith({});
      expect(mockContext.bindings.validatedParams).toBe(validatedData);
    });

    it('should handle Zod validation errors', async () => {
      const zodError = new ZodError([
        { path: ['id'], message: 'Invalid ID format', code: 'invalid_string', validation: 'uuid' } as any
      ]);
      mockSchema.parse.mockImplementation(() => {
        throw zodError;
      });

      const middleware = withPathValidation(mockSchema);
      await expect(middleware(mockContext, mockNext)).rejects.toThrow('badRequest called');
      
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, {
        validationErrors: [
          { path: ['id'], message: 'Invalid ID format' }
        ]
      });
    });

    it('should rethrow non-Zod errors', async () => {
      const error = new Error('Unexpected error');
      mockSchema.parse.mockImplementation(() => {
        throw error;
      });

      const middleware = withPathValidation(mockSchema);
      await expect(middleware(mockContext, mockNext)).rejects.toThrow('Unexpected error');
      
      expect(mockBadRequest).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle context with minimal properties', async () => {
      mockContext = {} as any;
      const validatedData = {};
      mockSchema.parse.mockReturnValue(validatedData);

      const middleware = withBodyValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 500,
        body: "No HTTP request context"
      });
    });

    it('should handle very large validation data', async () => {
      const largeData = { data: 'x'.repeat(10000) };
      mockContext.req!.body = largeData;
      mockSchema.parse.mockReturnValue(largeData);

      const middleware = withBodyValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockSchema.parse).toHaveBeenCalledWith(largeData);
      expect(mockContext.bindings.validatedBody).toBe(largeData);
    });

    it('should handle special characters in data', async () => {
      const specialData = { data: 'special-chars-@#$%^&*()' };
      mockContext.req!.body = specialData;
      mockSchema.parse.mockReturnValue(specialData);

      const middleware = withBodyValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockSchema.parse).toHaveBeenCalledWith(specialData);
      expect(mockContext.bindings.validatedBody).toBe(specialData);
    });

    it('should handle undefined request body', async () => {
      mockContext.req!.body = undefined;
      mockSchema.parse.mockReturnValue({});

      const middleware = withBodyValidation(mockSchema);
      await expect(middleware(mockContext, mockNext)).rejects.toThrow('badRequest called');
      
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Request body is required');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle unicode characters in data', async () => {
      const unicodeData = { data: 'unicode-ñáéíóú' };
      mockContext.req!.body = unicodeData;
      mockSchema.parse.mockReturnValue(unicodeData);

      const middleware = withBodyValidation(mockSchema);
      await middleware(mockContext, mockNext);

      expect(mockSchema.parse).toHaveBeenCalledWith(unicodeData);
      expect(mockContext.bindings.validatedBody).toBe(unicodeData);
    });
  });
});
