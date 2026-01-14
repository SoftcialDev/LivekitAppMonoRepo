import { Context } from '@azure/functions';
import { ErrorContextExtractor } from '../../../src/utils/error/ErrorContextExtractor';
import { TestUtils } from '../../setup';
import { getCallerAdId } from '../../../src/utils/authHelpers';

jest.mock('../../../src/utils/authHelpers', () => ({
  getCallerAdId: jest.fn(),
}));

describe('ErrorContextExtractor', () => {
  let mockContext: Context;
  const mockGetCallerAdId = getCallerAdId as jest.MockedFunction<typeof getCallerAdId>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = TestUtils.createMockContext();
  });

  describe('extract', () => {
    it('should extract all context information', () => {
      mockContext.req = TestUtils.createMockHttpRequest({
        url: 'https://example.com/api/test',
        method: 'POST',
      });
      mockContext.invocationId = 'invocation-123';
      (mockContext as any).executionContext = { functionName: 'TestFunction' };

      const result = ErrorContextExtractor.extract(mockContext);

      expect(result.endpoint).toBe('/api/test');
      expect(result.functionName).toBe('TestFunction');
      expect(result.method).toBe('POST');
      expect(result.url).toBe('https://example.com/api/test');
      expect(result.invocationId).toBe('invocation-123');
    });

    it('should extract endpoint from URL', () => {
      mockContext.req = TestUtils.createMockHttpRequest({
        url: 'https://example.com/api/users/123',
      });

      const result = ErrorContextExtractor.extract(mockContext);

      expect(result.endpoint).toBe('/api/users/123');
    });

    it('should handle invalid URL gracefully', () => {
      mockContext.req = {
        url: 'invalid-url',
      } as any;

      const result = ErrorContextExtractor.extract(mockContext);

      expect(result.endpoint).toBe('invalid-url');
    });

    it('should extract function name from execution context', () => {
      (mockContext as any).executionContext = { functionName: 'MyFunction' };

      const result = ErrorContextExtractor.extract(mockContext);

      expect(result.functionName).toBe('MyFunction');
    });

    it('should extract function name from endpoint when execution context not available', () => {
      mockContext.req = TestUtils.createMockHttpRequest({
        url: 'https://example.com/api/talk-session-start',
      });

      const result = ErrorContextExtractor.extract(mockContext);

      expect(result.functionName).toBe('TalkSessionStart');
    });

    it('should return Unknown when function name cannot be determined', () => {
      mockContext.req = TestUtils.createMockHttpRequest({
        url: 'https://example.com/not-api',
      });

      const result = ErrorContextExtractor.extract(mockContext);

      expect(result.functionName).toBe('Unknown');
    });

    it('should extract userId from callerId binding', () => {
      const extendedCtx = mockContext as any;
      extendedCtx.bindings = { callerId: 'caller-123' };

      const result = ErrorContextExtractor.extract(mockContext);

      expect(result.userId).toBe('caller-123');
    });

    it('should extract userId from user binding when callerId not available', () => {
      const extendedCtx = mockContext as any;
      extendedCtx.bindings = {
        user: { oid: 'user-oid-123' },
      };
      mockGetCallerAdId.mockReturnValue('user-oid-123');

      const result = ErrorContextExtractor.extract(mockContext);

      expect(result.userId).toBe('user-oid-123');
      expect(mockGetCallerAdId).toHaveBeenCalledWith({ oid: 'user-oid-123' });
    });

    it('should return undefined userId when bindings not available', () => {
      const extendedCtx = mockContext as any;
      extendedCtx.bindings = {};

      const result = ErrorContextExtractor.extract(mockContext);

      expect(result.userId).toBeUndefined();
    });

    it('should handle errors in extractUserId gracefully', () => {
      const extendedCtx = mockContext as any;
      extendedCtx.bindings = null;

      const result = ErrorContextExtractor.extract(mockContext);

      expect(result.userId).toBeUndefined();
    });
  });
});

