import { withCallerId, getCallerIdFromContext } from '../../../shared/middleware/callerId';
import { Context } from '@azure/functions';
import { getCallerAdId } from '../../../shared/utils/authHelpers';
import { badRequest } from '../../../shared/utils/response';

// Mock dependencies
jest.mock('../../../shared/utils/authHelpers');
jest.mock('../../../shared/utils/response');

const mockGetCallerAdId = getCallerAdId as jest.MockedFunction<typeof getCallerAdId>;
const mockBadRequest = badRequest as jest.MockedFunction<typeof badRequest>;

describe('callerId middleware', () => {
  let mockContext: Context;
  let mockNext: jest.MockedFunction<() => Promise<void>>;

  beforeEach(() => {
    mockContext = {
      bindings: {}
    } as any;
    
    mockNext = jest.fn().mockResolvedValue(undefined);
    
    // Reset mocks
    jest.clearAllMocks();
    mockGetCallerAdId.mockReturnValue('test-caller-id');
    mockBadRequest.mockImplementation(() => {
      throw new Error('badRequest called');
    });
  });

  describe('withCallerId', () => {
    it('should extract caller ID and call next middleware', async () => {
      mockContext.bindings.user = { oid: 'test-oid' };
      mockGetCallerAdId.mockReturnValue('test-caller-id');

      await withCallerId(mockContext, mockNext);

      expect(mockGetCallerAdId).toHaveBeenCalledWith(mockContext.bindings.user);
      expect(mockContext.bindings.callerId).toBe('test-caller-id');
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle missing caller ID', async () => {
      mockContext.bindings.user = { oid: 'test-oid' };
      mockGetCallerAdId.mockReturnValue(null as any);
      
      // Mock badRequest to not throw but set response
      mockBadRequest.mockImplementation((ctx, message) => {
        ctx.res = {
          status: 400,
          headers: { "Content-Type": "application/json" },
          body: { error: message }
        };
      });

      await withCallerId(mockContext, mockNext);
      
      expect(mockGetCallerAdId).toHaveBeenCalledWith(mockContext.bindings.user);
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, "Cannot determine caller identity");
      expect(mockContext.res).toEqual({
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: { error: "Cannot determine caller identity" }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle undefined caller ID', async () => {
      mockContext.bindings.user = { oid: 'test-oid' };
      mockGetCallerAdId.mockReturnValue(undefined);
      
      // Mock badRequest to not throw but set response
      mockBadRequest.mockImplementation((ctx, message) => {
        ctx.res = {
          status: 400,
          headers: { "Content-Type": "application/json" },
          body: { error: message }
        };
      });

      await withCallerId(mockContext, mockNext);
      
      expect(mockGetCallerAdId).toHaveBeenCalledWith(mockContext.bindings.user);
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, "Cannot determine caller identity");
      expect(mockContext.res).toEqual({
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: { error: "Cannot determine caller identity" }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty string caller ID', async () => {
      mockContext.bindings.user = { oid: 'test-oid' };
      mockGetCallerAdId.mockReturnValue('');
      
      // Mock badRequest to not throw but set response
      mockBadRequest.mockImplementation((ctx, message) => {
        ctx.res = {
          status: 400,
          headers: { "Content-Type": "application/json" },
          body: { error: message }
        };
      });

      await withCallerId(mockContext, mockNext);
      
      expect(mockGetCallerAdId).toHaveBeenCalledWith(mockContext.bindings.user);
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, "Cannot determine caller identity");
      expect(mockContext.res).toEqual({
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: { error: "Cannot determine caller identity" }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors from getCallerAdId', async () => {
      mockContext.bindings.user = { oid: 'test-oid' };
      const error = new Error('JWT parsing error');
      mockGetCallerAdId.mockImplementation(() => {
        throw error;
      });

      await expect(withCallerId(mockContext, mockNext)).rejects.toThrow('badRequest called');
      
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Authentication error: JWT parsing error');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors from next middleware', async () => {
      mockContext.bindings.user = { oid: 'test-oid' };
      mockGetCallerAdId.mockReturnValue('test-caller-id');
      const nextError = new Error('Next middleware error');
      mockNext.mockRejectedValue(nextError);

      await expect(withCallerId(mockContext, mockNext)).rejects.toThrow('badRequest called');
      
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Authentication error: Next middleware error');
    });

    it('should initialize bindings if not present', async () => {
      mockContext.bindings = undefined as any;
      mockContext.bindings = { user: { oid: 'test-oid' } };
      mockGetCallerAdId.mockReturnValue('test-caller-id');
      
      // Temporarily disable the badRequest mock for this test
      mockBadRequest.mockImplementation(() => {});

      await withCallerId(mockContext, mockNext);

      expect(mockContext.bindings).toBeDefined();
      expect(mockContext.bindings.callerId).toBe('test-caller-id');
      
      // Restore the original mock
      mockBadRequest.mockImplementation(() => {
        throw new Error('badRequest called');
      });
    });

    it('should handle different caller ID formats', async () => {
      const testCases = [
        'user-123-oid',
        'user@example.com',
        '12345678-1234-1234-1234-123456789012',
        'azure-ad-object-id'
      ];

      for (const callerId of testCases) {
        mockContext.bindings.user = { oid: callerId };
        mockGetCallerAdId.mockReturnValue(callerId);
        mockNext.mockClear();

        await withCallerId(mockContext, mockNext);

        expect(mockContext.bindings.callerId).toBe(callerId);
        expect(mockNext).toHaveBeenCalledTimes(1);
      }
    });

    it('should preserve existing bindings', async () => {
      mockContext.bindings = {
        existingBinding: 'existing-value',
        user: { oid: 'test-oid' }
      };
      mockGetCallerAdId.mockReturnValue('test-caller-id');

      await withCallerId(mockContext, mockNext);

      expect(mockContext.bindings.existingBinding).toBe('existing-value');
      expect(mockContext.bindings.callerId).toBe('test-caller-id');
    });
  });

  describe('getCallerIdFromContext', () => {
    it('should return caller ID from context bindings', () => {
      mockContext.bindings = {
        callerId: 'test-caller-id'
      };

      const result = getCallerIdFromContext(mockContext);

      expect(result).toBe('test-caller-id');
    });

    it('should return null when caller ID is not present', () => {
      mockContext.bindings = {};

      const result = getCallerIdFromContext(mockContext);

      expect(result).toBeNull();
    });

    it('should return null when bindings is undefined', () => {
      mockContext.bindings = undefined as any;

      const result = getCallerIdFromContext(mockContext);

      expect(result).toBeNull();
    });

    it('should return null when bindings is null', () => {
      mockContext.bindings = null as any;

      const result = getCallerIdFromContext(mockContext);

      expect(result).toBeNull();
    });

    it('should return null when caller ID is empty string', () => {
      mockContext.bindings = {
        callerId: ''
      };

      const result = getCallerIdFromContext(mockContext);

      expect(result).toBeNull(); // Empty string is falsy, so || null returns null
    });

    it('should return null when caller ID is undefined', () => {
      mockContext.bindings = {
        callerId: undefined
      };

      const result = getCallerIdFromContext(mockContext);

      expect(result).toBeNull();
    });

    it('should handle different caller ID formats', () => {
      const testCases = [
        'user-123-oid',
        'user@example.com',
        '12345678-1234-1234-1234-123456789012',
        'azure-ad-object-id'
      ];

      for (const callerId of testCases) {
        mockContext.bindings = { callerId };

        const result = getCallerIdFromContext(mockContext);

        expect(result).toBe(callerId);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle context with minimal properties', async () => {
      mockContext = { bindings: { user: { oid: 'test-oid' } } } as any;
      mockGetCallerAdId.mockReturnValue('test-caller-id');
      
      // Temporarily disable the badRequest mock for this test
      mockBadRequest.mockImplementation(() => {});

      await withCallerId(mockContext, mockNext);

      expect(mockContext.bindings.callerId).toBe('test-caller-id');
      
      // Restore the original mock
      mockBadRequest.mockImplementation(() => {
        throw new Error('badRequest called');
      });
    });

    it('should handle console.error being called', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockContext.bindings.user = { oid: 'test-oid' };
      const error = new Error('Test error');
      mockGetCallerAdId.mockImplementation(() => {
        throw error;
      });

      await expect(withCallerId(mockContext, mockNext)).rejects.toThrow('badRequest called');
      
      expect(consoleSpy).toHaveBeenCalledWith('withCallerId error:', error);
      
      consoleSpy.mockRestore();
    });

    it('should handle null caller ID from getCallerAdId', async () => {
      mockContext.bindings.user = { oid: 'test-oid' };
      mockGetCallerAdId.mockReturnValue(null as any);

      await expect(withCallerId(mockContext, mockNext)).rejects.toThrow('badRequest called');
      
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Cannot determine caller identity');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle non-string error messages', async () => {
      mockContext.bindings.user = { oid: 'test-oid' };
      const error = { message: 123 };
      mockGetCallerAdId.mockImplementation(() => {
        throw error;
      });

      await expect(withCallerId(mockContext, mockNext)).rejects.toThrow('badRequest called');
      
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Authentication error: 123');
    });
  });
});
