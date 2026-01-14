import { Context } from '@azure/functions';
import { mapMiddlewareErrorToResponse } from '../../src/utils/errorResponseMapper';
import {
  CallerIdNotFoundError,
  InsufficientPrivilegesError,
  TargetNotPsoError,
} from '../../src/domain/errors/MiddlewareErrors';
import { unauthorized, badRequest } from '../../src/utils/response';
import { TestUtils } from '../setup';

jest.mock('../../src/utils/response');

describe('errorResponseMapper', () => {
  let mockContext: Context;
  const mockUnauthorized = unauthorized as jest.MockedFunction<typeof unauthorized>;
  const mockBadRequest = badRequest as jest.MockedFunction<typeof badRequest>;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    jest.clearAllMocks();
  });

  describe('mapMiddlewareErrorToResponse', () => {
    it('should handle CallerIdNotFoundError and return true', () => {
      const error = new CallerIdNotFoundError('Cannot determine caller identity');

      const result = mapMiddlewareErrorToResponse(mockContext, error);

      expect(result).toBe(true);
      expect(mockUnauthorized).toHaveBeenCalledWith(mockContext, 'Cannot determine caller identity');
    });

    it('should handle InsufficientPrivilegesError and return true', () => {
      const error = new InsufficientPrivilegesError('Insufficient privileges');

      const result = mapMiddlewareErrorToResponse(mockContext, error);

      expect(result).toBe(true);
      expect(mockUnauthorized).toHaveBeenCalledWith(mockContext, 'Insufficient privileges');
    });

    it('should handle TargetNotPsoError and return true', () => {
      const error = new TargetNotPsoError('Target user not found or not a PSO');

      const result = mapMiddlewareErrorToResponse(mockContext, error);

      expect(result).toBe(true);
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Target user not found or not a PSO');
    });

    it('should handle error message "Cannot determine caller identity" and return true', () => {
      const error = 'Cannot determine caller identity';

      const result = mapMiddlewareErrorToResponse(mockContext, error);

      expect(result).toBe(true);
      expect(mockUnauthorized).toHaveBeenCalledWith(mockContext, 'Cannot determine caller identity');
    });

    it('should handle error message "Insufficient privileges" and return true', () => {
      const error = 'Insufficient privileges';

      const result = mapMiddlewareErrorToResponse(mockContext, error);

      expect(result).toBe(true);
      expect(mockUnauthorized).toHaveBeenCalledWith(mockContext, 'Insufficient privileges');
    });

    it('should handle error message "Target user not found or not a PSO" and return true', () => {
      const error = 'Target user not found or not a PSO';

      const result = mapMiddlewareErrorToResponse(mockContext, error);

      expect(result).toBe(true);
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Target user not found or not a PSO');
    });

    it('should return false for unknown error', () => {
      const error = new Error('Unknown error');

      const result = mapMiddlewareErrorToResponse(mockContext, error);

      expect(result).toBe(false);
      expect(mockUnauthorized).not.toHaveBeenCalled();
      expect(mockBadRequest).not.toHaveBeenCalled();
    });

    it('should return false for string error that does not match', () => {
      const error = 'Some other error message';

      const result = mapMiddlewareErrorToResponse(mockContext, error);

      expect(result).toBe(false);
      expect(mockUnauthorized).not.toHaveBeenCalled();
      expect(mockBadRequest).not.toHaveBeenCalled();
    });

    it('should return false for null error', () => {
      const error = null;

      const result = mapMiddlewareErrorToResponse(mockContext, error);

      expect(result).toBe(false);
      expect(mockUnauthorized).not.toHaveBeenCalled();
      expect(mockBadRequest).not.toHaveBeenCalled();
    });

    it('should return false for undefined error', () => {
      const error = undefined;

      const result = mapMiddlewareErrorToResponse(mockContext, error);

      expect(result).toBe(false);
      expect(mockUnauthorized).not.toHaveBeenCalled();
      expect(mockBadRequest).not.toHaveBeenCalled();
    });
  });
});

