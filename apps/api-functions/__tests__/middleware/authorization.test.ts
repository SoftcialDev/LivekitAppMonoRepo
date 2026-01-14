import { Context } from '@azure/functions';
import { requireCommandPermission, requireUserManagementPermission, requireAdminOrSuperAdminAccess, requireSuperAdminAccess } from '../../src/middleware/authorization';
import { AuthorizationService } from '../../src/domain/services/AuthorizationService';
import { UserRepository } from '../../src/infrastructure/repositories/UserRepository';
import { extractCallerId } from '../../src/utils/authHelpers';
import { InsufficientPrivilegesError, AdminAccessRequiredError, SuperAdminAccessRequiredError } from '../../src/domain/errors';
import { TestUtils } from '../setup';

jest.mock('../../src/domain/services/AuthorizationService');
jest.mock('../../src/infrastructure/repositories/UserRepository');
jest.mock('../../src/utils/authHelpers');

describe('authorization middleware', () => {
  let mockContext: Context;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockExtractCallerId: jest.MockedFunction<typeof extractCallerId>;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockAuthorizationService = new AuthorizationService(mockUserRepository) as jest.Mocked<AuthorizationService>;
    mockExtractCallerId = extractCallerId as jest.MockedFunction<typeof extractCallerId>;

    (AuthorizationService as jest.MockedClass<typeof AuthorizationService>).mockImplementation(() => mockAuthorizationService);
    (UserRepository as jest.MockedClass<typeof UserRepository>).mockImplementation(() => mockUserRepository);

    jest.clearAllMocks();
  });

  describe('requireCommandPermission', () => {
    it('should pass when user has command permission', async () => {
      const callerId = 'user-id';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.canSendCommands.mockResolvedValue(true);

      const middleware = requireCommandPermission();
      await middleware(mockContext);

      expect(mockExtractCallerId).toHaveBeenCalledWith(mockContext);
      expect(mockAuthorizationService.canSendCommands).toHaveBeenCalledWith(callerId);
    });

    it('should throw InsufficientPrivilegesError when user lacks command permission', async () => {
      const callerId = 'user-id';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.canSendCommands.mockResolvedValue(false);

      const middleware = requireCommandPermission();
      
      await expect(middleware(mockContext)).rejects.toThrow(InsufficientPrivilegesError);
      await expect(middleware(mockContext)).rejects.toThrow('Insufficient privileges');
    });
  });

  describe('requireUserManagementPermission', () => {
    it('should pass when user has user management permission', async () => {
      const callerId = 'user-id';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.canManageUsers.mockResolvedValue(true);

      const middleware = requireUserManagementPermission();
      await middleware(mockContext);

      expect(mockExtractCallerId).toHaveBeenCalledWith(mockContext);
      expect(mockAuthorizationService.canManageUsers).toHaveBeenCalledWith(callerId);
    });

    it('should throw InsufficientPrivilegesError when user lacks user management permission', async () => {
      const callerId = 'user-id';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.canManageUsers.mockResolvedValue(false);

      const middleware = requireUserManagementPermission();
      
      await expect(middleware(mockContext)).rejects.toThrow(InsufficientPrivilegesError);
      await expect(middleware(mockContext)).rejects.toThrow('Insufficient privileges');
    });
  });

  describe('requireAdminOrSuperAdminAccess', () => {
    it('should pass when user is admin or super admin', async () => {
      const callerId = 'user-id';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.isAdminOrSuperAdmin.mockResolvedValue(true);

      const middleware = requireAdminOrSuperAdminAccess();
      await middleware(mockContext);

      expect(mockExtractCallerId).toHaveBeenCalledWith(mockContext);
      expect(mockAuthorizationService.isAdminOrSuperAdmin).toHaveBeenCalledWith(callerId);
    });

    it('should throw AdminAccessRequiredError when user is not admin or super admin', async () => {
      const callerId = 'user-id';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.isAdminOrSuperAdmin.mockResolvedValue(false);

      const middleware = requireAdminOrSuperAdminAccess();
      
      await expect(middleware(mockContext)).rejects.toThrow(AdminAccessRequiredError);
      await expect(middleware(mockContext)).rejects.toThrow('Insufficient privileges - Admin or SuperAdmin role required');
    });
  });

  describe('requireSuperAdminAccess', () => {
    it('should pass when user is super admin', async () => {
      const callerId = 'user-id';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.isSuperAdmin.mockResolvedValue(true);

      const middleware = requireSuperAdminAccess();
      await middleware(mockContext);

      expect(mockExtractCallerId).toHaveBeenCalledWith(mockContext);
      expect(mockAuthorizationService.isSuperAdmin).toHaveBeenCalledWith(callerId);
    });

    it('should throw SuperAdminAccessRequiredError when user is not super admin', async () => {
      const callerId = 'user-id';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.isSuperAdmin.mockResolvedValue(false);

      const middleware = requireSuperAdminAccess();
      
      await expect(middleware(mockContext)).rejects.toThrow(SuperAdminAccessRequiredError);
      await expect(middleware(mockContext)).rejects.toThrow('Insufficient privileges - SuperAdmin role required');
    });
  });
});

