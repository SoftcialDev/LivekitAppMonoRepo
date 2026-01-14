import { Context, HttpRequest } from '@azure/functions';
import { z } from 'zod';
import { withBodyValidation, withQueryValidation, withPathValidation } from '../../src/middleware/validate';
import { RequestDataExtractor } from '../../src/infrastructure/validation/RequestDataExtractor';
import { ZodValidator } from '../../src/infrastructure/validation/ZodValidator';
import { BindingKey } from '../../src/domain/enums/BindingKey';
import { badRequest } from '../../src/utils/response';
import { TestUtils } from '../setup';

jest.mock('../../src/infrastructure/validation/RequestDataExtractor');
jest.mock('../../src/infrastructure/validation/ZodValidator');

jest.mock('../../src/utils/response');

describe('validate middleware', () => {
  let mockContext: Context;
  let mockNext: jest.Mock;
  let mockBadRequest: jest.MockedFunction<typeof badRequest>;
  let mockExtractor: jest.Mocked<RequestDataExtractor>;
  let mockValidator: jest.Mocked<ZodValidator>;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    mockNext = jest.fn().mockResolvedValue(undefined);
    mockBadRequest = badRequest as jest.MockedFunction<typeof badRequest>;
    
    const RequestDataExtractorMock = RequestDataExtractor as jest.MockedClass<typeof RequestDataExtractor>;
    const ZodValidatorMock = ZodValidator as jest.MockedClass<typeof ZodValidator>;
    
    mockExtractor = {
      extractBody: jest.fn(),
      extractQuery: jest.fn(),
      extractPath: jest.fn(),
      hasHttpRequest: jest.fn().mockReturnValue(true),
    } as any;
    
    mockValidator = {
      validate: jest.fn(),
    } as any;
    
    RequestDataExtractorMock.mockImplementation(() => mockExtractor);
    ZodValidatorMock.mockImplementation(() => mockValidator);

    jest.clearAllMocks();
    mockExtractor.hasHttpRequest.mockReturnValue(true);
  });

  describe('withBodyValidation', () => {
    it('should validate body and call next', async () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const body = { name: 'John', age: 30 };

      mockContext.req = { body } as HttpRequest;
      mockExtractor.extractBody.mockReturnValue(body);
      mockValidator.validate.mockReturnValue({
        success: true,
        data: body,
      } as any);

      const middleware = withBodyValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockExtractor.extractBody).toHaveBeenCalledWith(mockContext);
      expect(mockValidator.validate).toHaveBeenCalledWith(schema, body);
      expect(mockContext.bindings[BindingKey.VALIDATED_BODY]).toEqual(body);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 500 if HTTP request is missing', async () => {
      const schema = z.object({ name: z.string() });
      mockExtractor.hasHttpRequest.mockReturnValue(false);

      const middleware = withBodyValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(500);
      expect(mockContext.res?.body).toBe('No HTTP request context');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if body is required but missing', async () => {
      const schema = z.object({ name: z.string() });
      mockExtractor.extractBody.mockReturnValue(undefined);
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
      mockExtractor.extractBody.mockReturnValue(body);
      mockValidator.validate.mockReturnValue({
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
      mockExtractor.extractBody.mockImplementation(() => {
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
      mockExtractor.extractQuery.mockReturnValue(query);
      mockValidator.validate.mockReturnValue({
        success: true,
        data: query,
      } as any);

      const middleware = withQueryValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockExtractor.extractQuery).toHaveBeenCalledWith(mockContext);
      expect(mockValidator.validate).toHaveBeenCalledWith(schema, query);
      expect(mockContext.bindings[BindingKey.VALIDATED_QUERY]).toEqual(query);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle undefined query', async () => {
      const schema = z.object({ page: z.string().optional() });
      const query = {};

      mockContext.req = {} as HttpRequest;
      mockExtractor.extractQuery.mockReturnValue(query);
      mockValidator.validate.mockReturnValue({
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
      mockExtractor.extractPath.mockReturnValue(path);
      mockValidator.validate.mockReturnValue({
        success: true,
        data: path,
      } as any);

      const middleware = withPathValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockExtractor.extractPath).toHaveBeenCalledWith(mockContext);
      expect(mockValidator.validate).toHaveBeenCalledWith(schema, path);
      expect(mockContext.bindings[BindingKey.VALIDATED_PARAMS]).toEqual(path);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle empty path', async () => {
      const schema = z.object({});
      const path = {};

      mockContext.bindingData = { invocationId: 'test-invocation-id' };
      mockExtractor.extractPath.mockReturnValue(path);
      mockValidator.validate.mockReturnValue({
        success: true,
        data: path,
      } as any);

      const middleware = withPathValidation(schema);
      await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});

