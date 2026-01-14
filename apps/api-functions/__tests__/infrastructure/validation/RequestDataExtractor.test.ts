import { Context, HttpRequest } from '@azure/functions';
import { RequestDataExtractor } from '../../../src/infrastructure/validation/RequestDataExtractor';
import { ConfigurationError } from '../../../src/domain/errors/InfrastructureErrors';
import { TestUtils } from '../../setup';

describe('RequestDataExtractor', () => {
  let extractor: RequestDataExtractor;
  let mockContext: any;

  beforeEach(() => {
    extractor = new RequestDataExtractor();
    mockContext = TestUtils.createMockContext();
  });

  describe('extractBody', () => {
    it('should extract body from request', () => {
      const body = { name: 'test', value: 123 };
      mockContext.req = {
        body,
      } as HttpRequest;

      const result = extractor.extractBody(mockContext);

      expect(result).toEqual(body);
    });

    it('should return undefined if body is undefined', () => {
      mockContext.req = {} as HttpRequest;

      const result = extractor.extractBody(mockContext);

      expect(result).toBeUndefined();
    });

    it('should throw ConfigurationError if req is missing', () => {
      mockContext.req = undefined as any;

      expect(() => extractor.extractBody(mockContext)).toThrow(ConfigurationError);
      expect(() => extractor.extractBody(mockContext)).toThrow('No HTTP request context');
    });
  });

  describe('extractQuery', () => {
    it('should extract query parameters from request', () => {
      const query = { page: '1', limit: '10' };
      mockContext.req = TestUtils.createMockHttpRequest({ query }) as any;

      const result = extractor.extractQuery(mockContext);

      expect(result).toEqual(query);
    });

    it('should return empty object if query is undefined', () => {
      mockContext.req = {} as HttpRequest;

      const result = extractor.extractQuery(mockContext);

      expect(result).toEqual({});
    });

    it('should throw ConfigurationError if req is missing', () => {
      mockContext.req = undefined as any;

      expect(() => extractor.extractQuery(mockContext)).toThrow(ConfigurationError);
      expect(() => extractor.extractQuery(mockContext)).toThrow('No HTTP request context');
    });
  });

  describe('extractPath', () => {
    it('should extract path parameters from bindingData', () => {
      const bindingData = { id: '123', name: 'test', invocationId: 'test-invocation-id' };
      mockContext.bindingData = bindingData;
      mockContext.req = TestUtils.createMockHttpRequest() as any;

      const result = extractor.extractPath(mockContext);

      expect(result).toEqual(bindingData);
    });

    it('should return bindingData even if it only has invocationId', () => {
      const params = { id: '456', type: 'user' };
      mockContext.bindingData = { invocationId: 'test-invocation-id' };
      mockContext.req = TestUtils.createMockHttpRequest({ params }) as any;

      const result = extractor.extractPath(mockContext);
      
      expect(result).toEqual({ invocationId: 'test-invocation-id' });
      expect(result).not.toHaveProperty('id');
    });

    it('should prefer bindingData over req.params', () => {
      const bindingData = { id: '123', invocationId: 'test-invocation-id' };
      const params = { id: '456' };
      mockContext.bindingData = bindingData;
      mockContext.req = TestUtils.createMockHttpRequest({ params }) as any;

      const result = extractor.extractPath(mockContext);

      expect(result).toEqual(bindingData);
    });

    it('should return bindingData with invocationId if both are empty', () => {
      mockContext.bindingData = { invocationId: 'test-invocation-id' };
      mockContext.req = TestUtils.createMockHttpRequest() as any;

      const result = extractor.extractPath(mockContext);

      expect(result).toEqual({ invocationId: 'test-invocation-id' });
    });

    it('should handle missing bindingData', () => {
      const params = { id: '789' };
      mockContext.bindingData = undefined as any;
      mockContext.req = TestUtils.createMockHttpRequest({ params }) as any;

      const result = extractor.extractPath(mockContext);

      expect(result).toEqual(params);
    });
  });

  describe('hasHttpRequest', () => {
    it('should return true if req exists', () => {
      mockContext.req = {} as HttpRequest;

      const result = extractor.hasHttpRequest(mockContext);

      expect(result).toBe(true);
    });

    it('should return false if req is missing', () => {
      mockContext.req = undefined as any;

      const result = extractor.hasHttpRequest(mockContext);

      expect(result).toBe(false);
    });
  });
});

