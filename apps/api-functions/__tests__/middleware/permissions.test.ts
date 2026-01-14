import { Context } from '@azure/functions';
import { requirePermission, requireAnyPermission } from '../../src/middleware/permissions';
import { ServiceContainer } from '../../src/infrastructure/container/ServiceContainer';
import { IAuthorizationService } from '../../src/domain/interfaces/IAuthorizationService';
import { Permission } from '../../src/domain/enums/Permission';
import { getCallerAdId } from '../../src/utils/authHelpers';
import { unauthorized } from '../../src/utils/response';
import { TestUtils } from '../setup';

jest.mock('../../src/infrastructure/container/ServiceContainer');
jest.mock('../../src/utils/authHelpers');
jest.mock('../../src/utils/response');

describe('permissions middleware', () => {
  let mockContext: Context;
  let mockServiceContainer: jest.Mocked<ServiceContainer>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockGetCallerAdId: jest.MockedFunction<typeof getCallerAdId>;
  let mockUnauthorized: jest.MockedFunction<typeof unauthorized>;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    mockAuthorizationService = {
      authorizePermission: jest.fn().mockResolvedValue(undefined),
      authorizeAnyPermission: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockServiceContainer = {
      getInstance: jest.fn().mockReturnThis(),
      initialize: jest.fn(),
      resolve: jest.fn().mockReturnValue(mockAuthorizationService),
    } as any;

    (ServiceContainer.getInstance as jest.Mock) = jest.fn().mockReturnValue(mockServiceContainer);
    mockGetCallerAdId = getCallerAdId as jest.MockedFunction<typeof getCallerAdId>;
    mockUnauthorized = unauthorized as jest.MockedFunction<typeof unauthorized>;

    jest.clearAllMocks();
  });

  describe('requirePermission', () => {
    it('should authorize permission successfully', async () => {
      const callerId = 'user-id';
      const permission = Permission.CommandsSend;
      const userClaims = { oid: callerId };

      mockContext.bindings = { user: userClaims } as any;
      mockGetCallerAdId.mockReturnValue(callerId);

      const middleware = requirePermission(permission);
      await middleware(mockContext);

      expect(mockGetCallerAdId).toHaveBeenCalledWith(userClaims);
      expect(mockServiceContainer.initialize).toHaveBeenCalled();
      expect(mockServiceContainer.resolve).toHaveBeenCalledWith('AuthorizationService');
      expect(mockAuthorizationService.authorizePermission).toHaveBeenCalledWith(callerId, permission);
    });

    it('should throw unauthorized if caller ID cannot be determined', async () => {
      const permission = Permission.CommandsSend;
      const userClaims = { email: 'user@example.com' };

      mockContext.bindings = { user: userClaims } as any;
      mockGetCallerAdId.mockReturnValue(undefined);
      mockUnauthorized.mockImplementation(() => {
        throw new Error('Unauthorized');
      });

      const middleware = requirePermission(permission);
      
      await expect(middleware(mockContext)).rejects.toThrow('Unauthorized');
      expect(mockUnauthorized).toHaveBeenCalledWith(mockContext, 'Cannot determine caller identity');
    });

    it('should handle null caller ID', async () => {
      const permission = Permission.CommandsSend;
      const userClaims = { email: 'user@example.com' };

      mockContext.bindings = { user: userClaims } as any;
      mockGetCallerAdId.mockReturnValue(null as any);
      mockUnauthorized.mockImplementation(() => {
        throw new Error('Unauthorized');
      });

      const middleware = requirePermission(permission);
      
      await expect(middleware(mockContext)).rejects.toThrow('Unauthorized');
    });
  });

  describe('requireAnyPermission', () => {
    it('should authorize any permission successfully', async () => {
      const callerId = 'user-id';
      const permissions = [Permission.CommandsSend, Permission.UsersUpdate];
      const userClaims = { oid: callerId };

      mockContext.bindings = { user: userClaims } as any;
      mockGetCallerAdId.mockReturnValue(callerId);

      const middleware = requireAnyPermission(permissions);
      await middleware(mockContext);

      expect(mockGetCallerAdId).toHaveBeenCalledWith(userClaims);
      expect(mockServiceContainer.initialize).toHaveBeenCalled();
      expect(mockServiceContainer.resolve).toHaveBeenCalledWith('AuthorizationService');
      expect(mockAuthorizationService.authorizeAnyPermission).toHaveBeenCalledWith(callerId, permissions);
    });

    it('should throw unauthorized if caller ID cannot be determined', async () => {
      const permissions = [Permission.CommandsSend];
      const userClaims = { email: 'user@example.com' };

      mockContext.bindings = { user: userClaims } as any;
      mockGetCallerAdId.mockReturnValue(undefined);
      mockUnauthorized.mockImplementation(() => {
        throw new Error('Unauthorized');
      });

      const middleware = requireAnyPermission(permissions);
      
      await expect(middleware(mockContext)).rejects.toThrow('Unauthorized');
      expect(mockUnauthorized).toHaveBeenCalledWith(mockContext, 'Cannot determine caller identity');
    });

    it('should handle empty permissions array', async () => {
      const callerId = 'user-id';
      const permissions: Permission[] = [];
      const userClaims = { oid: callerId };

      mockContext.bindings = { user: userClaims } as any;
      mockGetCallerAdId.mockReturnValue(callerId);

      const middleware = requireAnyPermission(permissions);
      await middleware(mockContext);

      expect(mockAuthorizationService.authorizeAnyPermission).toHaveBeenCalledWith(callerId, []);
    });
  });
});

