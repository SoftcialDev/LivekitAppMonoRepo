import { validateCommandRequest } from '../../../shared/middleware/commandMiddleware';
import { Context } from '@azure/functions';
import { unauthorized, badRequest } from '../../../shared/utils/response';
import { requireCommandPermission } from '../../../shared/middleware/authorization';
import { requireEmployeeTarget } from '../../../shared/middleware/validation';
import { extractCallerId } from '../../../shared/utils/authHelpers';

// Mock dependencies
jest.mock('../../../shared/utils/response');
jest.mock('../../../shared/middleware/authorization');
jest.mock('../../../shared/middleware/validation');
jest.mock('../../../shared/utils/authHelpers');

const mockUnauthorized = unauthorized as jest.MockedFunction<typeof unauthorized>;
const mockBadRequest = badRequest as jest.MockedFunction<typeof badRequest>;
const mockRequireCommandPermission = requireCommandPermission as jest.MockedFunction<typeof requireCommandPermission>;
const mockRequireEmployeeTarget = requireEmployeeTarget as jest.MockedFunction<typeof requireEmployeeTarget>;
const mockExtractCallerId = extractCallerId as jest.MockedFunction<typeof extractCallerId>;

describe('commandMiddleware', () => {
  let mockContext: Context;
  let mockCommandPermissionMiddleware: jest.MockedFunction<(ctx: Context) => Promise<void>>;
  let mockEmployeeTargetMiddleware: jest.MockedFunction<(ctx: Context, targetEmail: string) => Promise<void>>;

  beforeEach(() => {
    mockContext = {
      bindings: {}
    } as any;
    
    // Create mock middleware functions
    mockCommandPermissionMiddleware = jest.fn().mockResolvedValue(undefined);
    mockEmployeeTargetMiddleware = jest.fn().mockResolvedValue(undefined);
    
    // Setup mocks
    mockRequireCommandPermission.mockReturnValue(mockCommandPermissionMiddleware);
    mockRequireEmployeeTarget.mockReturnValue(mockEmployeeTargetMiddleware);
    mockExtractCallerId.mockReturnValue('test-caller-id');
    
    // Setup response mocks to throw errors
    mockUnauthorized.mockImplementation(() => {
      throw new Error('unauthorized called');
    });
    mockBadRequest.mockImplementation(() => {
      throw new Error('badRequest called');
    });
    
    jest.clearAllMocks();
  });

  describe('validateCommandRequest', () => {
    it('should validate command request successfully', async () => {
      const targetEmail = 'employee@example.com';

      await validateCommandRequest(mockContext, targetEmail);

      expect(mockExtractCallerId).toHaveBeenCalledWith(mockContext);
      expect(mockRequireCommandPermission).toHaveBeenCalledTimes(1);
      expect(mockCommandPermissionMiddleware).toHaveBeenCalledWith(mockContext);
      expect(mockRequireEmployeeTarget).toHaveBeenCalledTimes(1);
      expect(mockEmployeeTargetMiddleware).toHaveBeenCalledWith(mockContext, targetEmail);
    });

    it('should handle caller identity error', async () => {
      const targetEmail = 'employee@example.com';
      const error = new Error('Cannot determine caller identity');
      mockExtractCallerId.mockImplementation(() => {
        throw error;
      });

      await expect(validateCommandRequest(mockContext, targetEmail)).rejects.toThrow('unauthorized called');
      
      expect(mockUnauthorized).toHaveBeenCalledWith(mockContext, 'Cannot determine caller identity');
      expect(mockRequireCommandPermission).not.toHaveBeenCalled();
      expect(mockRequireEmployeeTarget).not.toHaveBeenCalled();
    });

    it('should handle insufficient privileges error', async () => {
      const targetEmail = 'employee@example.com';
      const error = new Error('Insufficient privileges');
      mockCommandPermissionMiddleware.mockRejectedValue(error);

      await expect(validateCommandRequest(mockContext, targetEmail)).rejects.toThrow('unauthorized called');
      
      expect(mockUnauthorized).toHaveBeenCalledWith(mockContext, 'Insufficient privileges');
      expect(mockExtractCallerId).toHaveBeenCalledWith(mockContext);
      expect(mockRequireCommandPermission).toHaveBeenCalledTimes(1);
      expect(mockRequireEmployeeTarget).not.toHaveBeenCalled();
    });

    it('should handle target user not found error', async () => {
      const targetEmail = 'nonexistent@example.com';
      const error = new Error('Target user not found or not an Employee');
      mockEmployeeTargetMiddleware.mockRejectedValue(error);

      await expect(validateCommandRequest(mockContext, targetEmail)).rejects.toThrow('badRequest called');
      
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Target user not found or not an Employee');
      expect(mockExtractCallerId).toHaveBeenCalledWith(mockContext);
      expect(mockRequireCommandPermission).toHaveBeenCalledTimes(1);
      expect(mockRequireEmployeeTarget).toHaveBeenCalledTimes(1);
    });

    it('should handle other errors by rethrowing them', async () => {
      const targetEmail = 'employee@example.com';
      const error = new Error('Unexpected error');
      mockExtractCallerId.mockImplementation(() => {
        throw error;
      });

      await expect(validateCommandRequest(mockContext, targetEmail)).rejects.toThrow('Unexpected error');
      
      expect(mockUnauthorized).not.toHaveBeenCalled();
      expect(mockBadRequest).not.toHaveBeenCalled();
    });

    it('should handle different target email formats', async () => {
      const testCases = [
        'user@example.com',
        'user.name@company.org',
        'user+tag@domain.co.uk',
        'user123@test-domain.com'
      ];

      for (const targetEmail of testCases) {
        mockExtractCallerId.mockReturnValue('test-caller-id');
        mockCommandPermissionMiddleware.mockResolvedValue(undefined);
        mockEmployeeTargetMiddleware.mockResolvedValue(undefined);

        await validateCommandRequest(mockContext, targetEmail);

        expect(mockEmployeeTargetMiddleware).toHaveBeenCalledWith(mockContext, targetEmail);
      }
    });

    it('should handle empty target email', async () => {
      const targetEmail = '';
      const error = new Error('Target user not found or not an Employee');
      mockEmployeeTargetMiddleware.mockRejectedValue(error);

      await expect(validateCommandRequest(mockContext, targetEmail)).rejects.toThrow('badRequest called');
      
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Target user not found or not an Employee');
    });

    it('should handle null target email', async () => {
      const targetEmail = null as any;
      const error = new Error('Target user not found or not an Employee');
      mockEmployeeTargetMiddleware.mockRejectedValue(error);

      await expect(validateCommandRequest(mockContext, targetEmail)).rejects.toThrow('badRequest called');
      
      expect(mockBadRequest).toHaveBeenCalledWith(mockContext, 'Target user not found or not an Employee');
    });

    it('should handle authorization service errors', async () => {
      const targetEmail = 'employee@example.com';
      const error = new Error('Authorization service unavailable');
      mockCommandPermissionMiddleware.mockRejectedValue(error);

      await expect(validateCommandRequest(mockContext, targetEmail)).rejects.toThrow('Authorization service unavailable');
      
      expect(mockUnauthorized).not.toHaveBeenCalled();
      expect(mockBadRequest).not.toHaveBeenCalled();
    });

    it('should handle validation service errors', async () => {
      const targetEmail = 'employee@example.com';
      const error = new Error('Validation service unavailable');
      mockEmployeeTargetMiddleware.mockRejectedValue(error);

      await expect(validateCommandRequest(mockContext, targetEmail)).rejects.toThrow('Validation service unavailable');
      
      expect(mockUnauthorized).not.toHaveBeenCalled();
      expect(mockBadRequest).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle context with minimal properties', async () => {
      mockContext = {} as any;
      const targetEmail = 'employee@example.com';

      await validateCommandRequest(mockContext, targetEmail);

      expect(mockExtractCallerId).toHaveBeenCalledWith(mockContext);
      expect(mockCommandPermissionMiddleware).toHaveBeenCalledWith(mockContext);
      expect(mockEmployeeTargetMiddleware).toHaveBeenCalledWith(mockContext, targetEmail);
    });

    it('should handle very long target email', async () => {
      const targetEmail = 'a'.repeat(100) + '@example.com';

      await validateCommandRequest(mockContext, targetEmail);

      expect(mockEmployeeTargetMiddleware).toHaveBeenCalledWith(mockContext, targetEmail);
    });

    it('should handle special characters in target email', async () => {
      const targetEmail = 'user+test@example-domain.co.uk';

      await validateCommandRequest(mockContext, targetEmail);

      expect(mockEmployeeTargetMiddleware).toHaveBeenCalledWith(mockContext, targetEmail);
    });

    it('should handle unicode characters in target email', async () => {
      const targetEmail = 'usér@éxample.com';

      await validateCommandRequest(mockContext, targetEmail);

      expect(mockEmployeeTargetMiddleware).toHaveBeenCalledWith(mockContext, targetEmail);
    });

    it('should handle multiple consecutive calls', async () => {
      const targetEmail = 'employee@example.com';

      await validateCommandRequest(mockContext, targetEmail);
      await validateCommandRequest(mockContext, targetEmail);
      await validateCommandRequest(mockContext, targetEmail);

      expect(mockExtractCallerId).toHaveBeenCalledTimes(3);
      expect(mockRequireCommandPermission).toHaveBeenCalledTimes(3);
      expect(mockRequireEmployeeTarget).toHaveBeenCalledTimes(3);
    });
  });
});
