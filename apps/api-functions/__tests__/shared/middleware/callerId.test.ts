/**
 * @fileoverview Tests for callerId middleware
 * @description Tests for caller ID extraction and validation middleware
 */

import { withCallerId, getCallerIdFromContext } from '../../../shared/middleware/callerId';
import { getCallerAdId } from '../../../shared/utils/authHelpers';
import { badRequest } from '../../../shared/utils/response';
import { Context } from '@azure/functions';

// Mock dependencies
jest.mock('../../../shared/utils/authHelpers');
jest.mock('../../../shared/utils/response');

const mockGetCallerAdId = getCallerAdId as jest.MockedFunction<typeof getCallerAdId>;
const mockBadRequest = badRequest as jest.MockedFunction<typeof badRequest>;

describe('callerId middleware', () => {
  let mockContext: Context;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockContext = {
      bindings: {
        user: { sub: 'test-user-id' }
      }
    } as any;

    mockNext = jest.fn().mockResolvedValue(undefined);
    
    jest.clearAllMocks();
  });

  describe('withCallerId', () => {
    it('should extract caller ID and attach to context', async () => {
      const callerId = 'test-caller-id';
      mockGetCallerAdId.mockReturnValue(callerId);

      await withCallerId(mockContext, mockNext);

      expect(mockGetCallerAdId).toHaveBeenCalledWith(mockContext.bindings.user);
      expect((mockContext as any).bindings.callerId).toBe(callerId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing caller ID', async () => {
      mockGetCallerAdId.mockReturnValue(null);

      await withCallerId(mockContext, mockNext);

      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, "Cannot determine caller identity");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty caller ID', async () => {
      mockGetCallerAdId.mockReturnValue('');

      await withCallerId(mockContext, mockNext);

      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, "Cannot determine caller identity");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle undefined caller ID', async () => {
      mockGetCallerAdId.mockReturnValue(undefined as any);

      await withCallerId(mockContext, mockNext);

      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, "Cannot determine caller identity");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors during caller ID extraction', async () => {
      const error = new Error('JWT parsing failed');
      mockGetCallerAdId.mockImplementation(() => {
        throw error;
      });

      await withCallerId(mockContext, mockNext);

      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, `Authentication error: ${error.message}`);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors during next middleware execution', async () => {
      const callerId = 'test-caller-id';
      const error = new Error('Next middleware failed');
      mockGetCallerAdId.mockReturnValue(callerId);
      mockNext.mockRejectedValue(error);

      await withCallerId(mockContext, mockNext);

      expect((mockContext as any).bindings.callerId).toBe(callerId);
      expect(mockNext).toHaveBeenCalled();
      // The error should be propagated
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, `Authentication error: ${error.message}`);
    });

    it('should create bindings object if it does not exist', async () => {
      const callerId = 'test-caller-id';
      mockContext.bindings = undefined as any;
      mockGetCallerAdId.mockReturnValue(callerId);

      await withCallerId(mockContext, mockNext);

      expect((mockContext as any).bindings).toBeDefined();
      expect((mockContext as any).bindings.callerId).toBe(callerId);
    });
  });

  describe('getCallerIdFromContext', () => {
    it('should return caller ID from context bindings', () => {
      const callerId = 'test-caller-id';
      (mockContext as any).bindings = { callerId };

      const result = getCallerIdFromContext(mockContext);

      expect(result).toBe(callerId);
    });

    it('should return null when caller ID is not found', () => {
      (mockContext as any).bindings = {};

      const result = getCallerIdFromContext(mockContext);

      expect(result).toBeNull();
    });

    it('should return null when bindings is undefined', () => {
      (mockContext as any).bindings = undefined;

      const result = getCallerIdFromContext(mockContext);

      expect(result).toBeNull();
    });

    it('should return null when context is undefined', () => {
      const result = getCallerIdFromContext(undefined as any);

      expect(result).toBeNull();
    });
  });
});