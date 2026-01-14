import { Context } from '@azure/functions';
import { withCallerId, getCallerIdFromContext } from '../../src/middleware/callerId';
import { getCallerAdId } from '../../src/utils/authHelpers';
import { CallerIdNotFoundError } from '../../src/domain/errors';
import { TestUtils } from '../setup';

jest.mock('../../src/utils/authHelpers');

describe('callerId middleware', () => {
  let mockContext: Context;
  let mockNext: jest.Mock;
  let mockGetCallerAdId: jest.MockedFunction<typeof getCallerAdId>;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    mockNext = jest.fn().mockResolvedValue(undefined);
    mockGetCallerAdId = getCallerAdId as jest.MockedFunction<typeof getCallerAdId>;

    jest.clearAllMocks();
  });

  describe('withCallerId', () => {
    it('should extract and attach caller ID to context', async () => {
      const userClaims = { oid: 'user-id', email: 'user@example.com' };
      const callerId = 'user-id';

      mockContext.bindings = {
        user: userClaims,
      } as any;

      mockGetCallerAdId.mockReturnValue(callerId);

      await withCallerId(mockContext, mockNext);

      expect(mockGetCallerAdId).toHaveBeenCalledWith(userClaims);
      expect(mockContext.bindings.callerId).toBe(callerId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw CallerIdNotFoundError if user is not in context', async () => {
      mockContext.bindings = {} as any;

      await expect(withCallerId(mockContext, mockNext)).rejects.toThrow(CallerIdNotFoundError);
      await expect(withCallerId(mockContext, mockNext)).rejects.toThrow('Cannot determine caller identity: user not found in context');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw CallerIdNotFoundError if caller ID cannot be extracted', async () => {
      const userClaims = { email: 'user@example.com' };

      mockContext.bindings = {
        user: userClaims,
      } as any;

      mockGetCallerAdId.mockReturnValue(undefined);

      await expect(withCallerId(mockContext, mockNext)).rejects.toThrow(CallerIdNotFoundError);
      await expect(withCallerId(mockContext, mockNext)).rejects.toThrow('Cannot determine caller identity');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle null caller ID', async () => {
      const userClaims = { email: 'user@example.com' };

      mockContext.bindings = {
        user: userClaims,
      } as any;

      mockGetCallerAdId.mockReturnValue(null as any);

      await expect(withCallerId(mockContext, mockNext)).rejects.toThrow(CallerIdNotFoundError);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('getCallerIdFromContext', () => {
    it('should return caller ID from context bindings', () => {
      const callerId = 'user-id';
      mockContext.bindings = {
        callerId,
      } as any;

      const result = getCallerIdFromContext(mockContext);

      expect(result).toBe(callerId);
    });

    it('should return null if caller ID is not in context', () => {
      mockContext.bindings = {} as any;

      const result = getCallerIdFromContext(mockContext);

      expect(result).toBeNull();
    });

    it('should return null if bindings are undefined', () => {
      mockContext.bindings = undefined as any;

      const result = getCallerIdFromContext(mockContext);

      expect(result).toBeNull();
    });
  });
});

