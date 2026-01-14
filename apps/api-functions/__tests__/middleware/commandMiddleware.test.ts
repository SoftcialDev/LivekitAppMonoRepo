import { Context } from '@azure/functions';
import { validateCommandRequest } from '../../src/middleware/commandMiddleware';
import { requireCommandPermission } from '../../src/middleware/authorization';
import { requirePSOTarget } from '../../src/middleware/validation';
import { extractCallerId } from '../../src/utils/authHelpers';
import { mapMiddlewareErrorToResponse } from '../../src/utils';
import { CallerIdNotFoundError, InsufficientPrivilegesError, TargetNotPsoError } from '../../src/domain/errors';
import { TestUtils } from '../setup';

jest.mock('../../src/middleware/authorization');
jest.mock('../../src/middleware/validation');
jest.mock('../../src/utils/authHelpers');
jest.mock('../../src/utils');

describe('commandMiddleware', () => {
  let mockContext: Context;
  let mockCommandPermissionMiddleware: jest.Mock;
  let mockPSOTargetMiddleware: jest.Mock;
  let mockExtractCallerId: jest.MockedFunction<typeof extractCallerId>;
  let mockMapMiddlewareErrorToResponse: jest.MockedFunction<typeof mapMiddlewareErrorToResponse>;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    mockCommandPermissionMiddleware = jest.fn().mockResolvedValue(undefined);
    mockPSOTargetMiddleware = jest.fn().mockResolvedValue(undefined);
    mockExtractCallerId = extractCallerId as jest.MockedFunction<typeof extractCallerId>;
    mockMapMiddlewareErrorToResponse = mapMiddlewareErrorToResponse as jest.MockedFunction<typeof mapMiddlewareErrorToResponse>;

    (requireCommandPermission as jest.Mock) = jest.fn().mockReturnValue(mockCommandPermissionMiddleware);
    (requirePSOTarget as jest.Mock) = jest.fn().mockReturnValue(mockPSOTargetMiddleware);

    jest.clearAllMocks();
  });

  it('should successfully validate command request', async () => {
    const targetEmail = 'pso@example.com';
    mockExtractCallerId.mockReturnValue('caller-id');

    await validateCommandRequest(mockContext, targetEmail);

    expect(mockExtractCallerId).toHaveBeenCalledWith(mockContext);
    expect(requireCommandPermission).toHaveBeenCalled();
    expect(mockCommandPermissionMiddleware).toHaveBeenCalledWith(mockContext);
    expect(requirePSOTarget).toHaveBeenCalled();
    expect(mockPSOTargetMiddleware).toHaveBeenCalledWith(mockContext, targetEmail);
  });

  it('should handle CallerIdNotFoundError', async () => {
    const targetEmail = 'pso@example.com';
    const error = new CallerIdNotFoundError('Caller ID not found');
    mockExtractCallerId.mockImplementation(() => {
      throw error;
    });
    mockMapMiddlewareErrorToResponse.mockReturnValue(true);

    await validateCommandRequest(mockContext, targetEmail);

    expect(mockMapMiddlewareErrorToResponse).toHaveBeenCalledWith(mockContext, error);
  });

  it('should handle InsufficientPrivilegesError', async () => {
    const targetEmail = 'pso@example.com';
    const error = new InsufficientPrivilegesError('Insufficient privileges');
    mockExtractCallerId.mockReturnValue('caller-id');
    mockCommandPermissionMiddleware.mockRejectedValue(error);
    mockMapMiddlewareErrorToResponse.mockReturnValue(true);

    await validateCommandRequest(mockContext, targetEmail);

    expect(mockMapMiddlewareErrorToResponse).toHaveBeenCalledWith(mockContext, error);
  });

  it('should handle TargetNotPsoError', async () => {
    const targetEmail = 'not-pso@example.com';
    const error = new TargetNotPsoError('Target is not a PSO');
    mockExtractCallerId.mockReturnValue('caller-id');
    mockPSOTargetMiddleware.mockRejectedValue(error);
    mockMapMiddlewareErrorToResponse.mockReturnValue(true);

    await validateCommandRequest(mockContext, targetEmail);

    expect(mockMapMiddlewareErrorToResponse).toHaveBeenCalledWith(mockContext, error);
  });

  it('should re-throw unknown errors', async () => {
    const targetEmail = 'pso@example.com';
    const error = new Error('Unknown error');
    mockExtractCallerId.mockReturnValue('caller-id');
    mockCommandPermissionMiddleware.mockRejectedValue(error);
    mockMapMiddlewareErrorToResponse.mockReturnValue(false);

    await expect(validateCommandRequest(mockContext, targetEmail)).rejects.toThrow('Unknown error');
  });

  it('should not proceed if extractCallerId throws', async () => {
    const targetEmail = 'pso@example.com';
    const error = new CallerIdNotFoundError('Caller ID not found');
    mockExtractCallerId.mockImplementation(() => {
      throw error;
    });
    mockMapMiddlewareErrorToResponse.mockReturnValue(true);

    await validateCommandRequest(mockContext, targetEmail);

    expect(requireCommandPermission).not.toHaveBeenCalled();
    expect(requirePSOTarget).not.toHaveBeenCalled();
  });
});

