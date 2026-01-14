const mockExtractBody = jest.fn();
const mockExtractQuery = jest.fn();
const mockExtractPath = jest.fn();
const mockHasHttpRequest = jest.fn();
const mockValidate = jest.fn();

jest.mock('../../src/infrastructure/validation/RequestDataExtractor', () => {
  return {
    RequestDataExtractor: jest.fn().mockImplementation(() => ({
      extractBody: mockExtractBody,
      extractQuery: mockExtractQuery,
      extractPath: mockExtractPath,
      hasHttpRequest: mockHasHttpRequest,
    })),
  };
});

jest.mock('../../src/infrastructure/validation/ZodValidator', () => {
  return {
    ZodValidator: jest.fn().mockImplementation(() => ({
      validate: mockValidate,
    })),
  };
});

jest.mock('../../src/utils/response');

import { Context, HttpRequest } from '@azure/functions';
import { z } from 'zod';
import { withBodyValidation, withQueryValidation, withPathValidation } from '../../src/middleware/validate';
import { BindingKey } from '../../src/domain/enums/BindingKey';
import { badRequest } from '../../src/utils/response';
import { TestUtils } from '../setup';

describe('validate middleware', () => {
  let mockContext: Context;
  let mockNext: jest.Mock;
  let mockBadRequest: jest.MockedFunction<typeof badRequest>;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    mockNext = jest.fn().mockResolvedValue(undefined);
    mockBadRequest = badRequest as jest.MockedFunction<typeof badRequest>;

    jest.clearAllMocks();
    mockHasHttpRequest.mockReturnValue(true);
  });

  describe('withBodyValidation', () => {
    it('should validate body and call next', async () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const body = { name: 'John', age: 30 };

      mockContext.req = { body } as HttpRequest;
      mockExtractBody.mockReturnValue(body);
      mockValidate.mockReturnValue({
        success: true,
        data: body,
      } as any);

      const middleware = withBodyValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockExtractBody).toHaveBeenCalledWith(mockContext);
      expect(mockValidate).toHaveBeenCalledWith(schema, body);
      expect(mockContext.bindings[BindingKey.VALIDATED_BODY]).toEqual(body);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 500 if HTTP request is missing', async () => {
      const schema = z.object({ name: z.string() });
      mockHasHttpRequest.mockReturnValue(false);

      const middleware = withBodyValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(500);
      expect(mockContext.res?.body).toBe('No HTTP request context');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if body is required but missing', async () => {
      const schema = z.object({ name: z.string() });
      mockExtractBody.mockReturnValue(undefined);
      mockBadRequest.mockReturnValue(undefined);

      const middleware = withBodyValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Request body is required');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if validation fails', async () => {
      const schema = z.object({ name: z.string() });
      const body = { name: 123 };
      const errors = [
        { message: 'name: Expected string, received number' },
      ];

      mockContext.req = { body } as HttpRequest;
      mockExtractBody.mockReturnValue(body);
      mockValidate.mockReturnValue({
        success: false,
        errors,
      } as any);
      mockBadRequest.mockReturnValue(undefined);

      const middleware = withBodyValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, {
        validationErrors: [
          { path: 'name', message: 'name: Expected string, received number' },
        ],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if extraction fails', async () => {
      const schema = z.object({ name: z.string() });
      const error = new Error('Extraction failed');
      mockExtractBody.mockImplementation(() => {
        throw error;
      });

      const middleware = withBodyValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(500);
      expect(mockContext.res?.body).toBe('Extraction failed');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('withQueryValidation', () => {
    it('should validate query and call next', async () => {
      const schema = z.object({ page: z.string(), limit: z.string() });
      const query = { page: '1', limit: '10' };

      mockContext.req = TestUtils.createMockHttpRequest({ query });
      mockExtractQuery.mockReturnValue(query);
      mockValidate.mockReturnValue({
        success: true,
        data: query,
      } as any);

      const middleware = withQueryValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockExtractQuery).toHaveBeenCalledWith(mockContext);
      expect(mockValidate).toHaveBeenCalledWith(schema, query);
      expect(mockContext.bindings[BindingKey.VALIDATED_QUERY]).toEqual(query);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle undefined query', async () => {
      const schema = z.object({ page: z.string().optional() });
      const query = {};

      mockContext.req = {} as HttpRequest;
      mockExtractQuery.mockReturnValue(query);
      mockValidate.mockReturnValue({
        success: true,
        data: query,
      } as any);

      const middleware = withQueryValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('withPathValidation', () => {
    it('should validate path and call next', async () => {
      const schema = z.object({ id: z.string() });
      const path = { id: '123' };

      mockContext.bindingData = { ...path, invocationId: 'test-invocation-id' };
      mockExtractPath.mockReturnValue(path);
      mockValidate.mockReturnValue({
        success: true,
        data: path,
      } as any);

      const middleware = withPathValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockExtractPath).toHaveBeenCalledWith(mockContext);
      expect(mockValidate).toHaveBeenCalledWith(schema, path);
      expect(mockContext.bindings[BindingKey.VALIDATED_PARAMS]).toEqual(path);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle empty path', async () => {
      const schema = z.object({});
      const path = {};

      mockContext.bindingData = { invocationId: 'test-invocation-id' };
      mockExtractPath.mockReturnValue(path);
      mockValidate.mockReturnValue({
        success: true,
        data: path,
      } as any);

      const middleware = withPathValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
