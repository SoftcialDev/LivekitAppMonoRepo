import { 
  requireCommandPermission, 
  requireUserManagementPermission, 
  requireSuperAdminAccess 
} from '../../../shared/middleware/authorization';
import { Context } from '@azure/functions';
import { AuthorizationService } from '../../../shared/domain/services/AuthorizationService';
import { UserRepository } from '../../../shared/infrastructure/repositories/UserRepository';
import { extractCallerId } from '../../../shared/utils/authHelpers';

// Mock dependencies
jest.mock('../../../shared/domain/services/AuthorizationService');
jest.mock('../../../shared/infrastructure/repositories/UserRepository');
jest.mock('../../../shared/utils/authHelpers');

const MockedAuthorizationService = AuthorizationService as jest.MockedClass<typeof AuthorizationService>;
const MockedUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;
const mockExtractCallerId = extractCallerId as jest.MockedFunction<typeof extractCallerId>;

describe('authorization middleware', () => {
  let mockContext: Context;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockContext = {
      bindings: {}
    } as any;
    
    // Create mock instances
    mockUserRepository = {
      // Add any methods you need to mock
    } as any;
    
    mockAuthorizationService = {
      canSendCommands: jest.fn(),
      canManageUsers: jest.fn(),
      canAccessAdmin: jest.fn(),
      isSuperAdmin: jest.fn()
    } as any;
    
    // Mock the constructors
    MockedUserRepository.mockImplementation(() => mockUserRepository);
    MockedAuthorizationService.mockImplementation(() => mockAuthorizationService);
    
    jest.clearAllMocks();
  });

  describe('requireCommandPermission', () => {
    it('should create middleware that checks command permissions', async () => {
      const callerId = 'user-123';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.canSendCommands.mockResolvedValue(true);

      const middleware = requireCommandPermission();
      await middleware(mockContext);

      expect(mockExtractCallerId).toHaveBeenCalledWith(mockContext);
      expect(mockAuthorizationService.canSendCommands).toHaveBeenCalledWith(callerId);
    });

    it('should throw error when user lacks command permissions', async () => {
      const callerId = 'user-123';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.canSendCommands.mockResolvedValue(false);

      const middleware = requireCommandPermission();
      
      await expect(middleware(mockContext)).rejects.toThrow('Insufficient privileges');
      
      expect(mockExtractCallerId).toHaveBeenCalledWith(mockContext);
      expect(mockAuthorizationService.canSendCommands).toHaveBeenCalledWith(callerId);
    });

    it('should handle different caller ID formats', async () => {
      const testCases = [
        'user-123-oid',
        'user@example.com',
        '12345678-1234-1234-1234-123456789012',
        'azure-ad-object-id'
      ];

      for (const callerId of testCases) {
        mockExtractCallerId.mockReturnValue(callerId);
        mockAuthorizationService.canSendCommands.mockResolvedValue(true);
        const middleware = requireCommandPermission();
        
        await middleware(mockContext);
        
        expect(mockAuthorizationService.canSendCommands).toHaveBeenCalledWith(callerId);
      }
    });

    it('should handle authorization service errors', async () => {
      const callerId = 'user-123';
      mockExtractCallerId.mockReturnValue(callerId);
      const authError = new Error('Authorization service unavailable');
      mockAuthorizationService.canSendCommands.mockRejectedValue(authError);

      const middleware = requireCommandPermission();
      
      await expect(middleware(mockContext)).rejects.toThrow('Authorization service unavailable');
    });

    it('should create new service instances for each middleware', () => {
      const middleware1 = requireCommandPermission();
      const middleware2 = requireCommandPermission();
      
      expect(MockedAuthorizationService).toHaveBeenCalledTimes(2);
      expect(MockedUserRepository).toHaveBeenCalledTimes(2);
      expect(middleware1).not.toBe(middleware2);
    });
  });

  describe('requireUserManagementPermission', () => {
    it('should create middleware that checks user management permissions', async () => {
      const callerId = 'admin-123';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.canManageUsers.mockResolvedValue(true);

      const middleware = requireUserManagementPermission();
      await middleware(mockContext);

      expect(mockExtractCallerId).toHaveBeenCalledWith(mockContext);
      expect(mockAuthorizationService.canManageUsers).toHaveBeenCalledWith(callerId);
    });

    it('should throw error when user lacks user management permissions', async () => {
      const callerId = 'user-123';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.canManageUsers.mockResolvedValue(false);

      const middleware = requireUserManagementPermission();
      
      await expect(middleware(mockContext)).rejects.toThrow('Insufficient privileges');
      
      expect(mockExtractCallerId).toHaveBeenCalledWith(mockContext);
      expect(mockAuthorizationService.canManageUsers).toHaveBeenCalledWith(callerId);
    });

    it('should handle different caller ID formats', async () => {
      const testCases = [
        'admin-123-oid',
        'admin@example.com',
        '12345678-1234-1234-1234-123456789012',
        'azure-ad-object-id'
      ];

      for (const callerId of testCases) {
        mockExtractCallerId.mockReturnValue(callerId);
        mockAuthorizationService.canManageUsers.mockResolvedValue(true);
        const middleware = requireUserManagementPermission();
        
        await middleware(mockContext);
        
        expect(mockAuthorizationService.canManageUsers).toHaveBeenCalledWith(callerId);
      }
    });

    it('should handle authorization service errors', async () => {
      const callerId = 'admin-123';
      mockExtractCallerId.mockReturnValue(callerId);
      const authError = new Error('Authorization service unavailable');
      mockAuthorizationService.canManageUsers.mockRejectedValue(authError);

      const middleware = requireUserManagementPermission();
      
      await expect(middleware(mockContext)).rejects.toThrow('Authorization service unavailable');
    });

    it('should create new service instances for each middleware', () => {
      const middleware1 = requireUserManagementPermission();
      const middleware2 = requireUserManagementPermission();
      
      expect(MockedAuthorizationService).toHaveBeenCalledTimes(2);
      expect(MockedUserRepository).toHaveBeenCalledTimes(2);
      expect(middleware1).not.toBe(middleware2);
    });
  });

  describe('requireAdminAccess', () => {
    it('should create middleware that checks admin access', async () => {
      const callerId = 'admin-123';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.isSuperAdmin.mockResolvedValue(true);

      const middleware = requireSuperAdminAccess();
      await middleware(mockContext);

      expect(mockAuthorizationService.isSuperAdmin).toHaveBeenCalledWith(callerId);
    });

    it('should throw error when caller ID is not found in context', async () => {
      mockExtractCallerId.mockImplementation(() => {
        throw new Error('Cannot determine caller identity');
      });

      const middleware = requireSuperAdminAccess();
      
      await expect(middleware(mockContext)).rejects.toThrow('Cannot determine caller identity');
      
      expect(mockAuthorizationService.isSuperAdmin).not.toHaveBeenCalled();
    });

    it('should throw error when caller ID is null', async () => {
      mockExtractCallerId.mockImplementation(() => {
        throw new Error('Cannot determine caller identity');
      });

      const middleware = requireSuperAdminAccess();
      
      await expect(middleware(mockContext)).rejects.toThrow('Cannot determine caller identity');
      
      expect(mockAuthorizationService.isSuperAdmin).not.toHaveBeenCalled();
    });

    it('should throw error when caller ID is undefined', async () => {
      mockExtractCallerId.mockImplementation(() => {
        throw new Error('Cannot determine caller identity');
      });

      const middleware = requireSuperAdminAccess();
      
      await expect(middleware(mockContext)).rejects.toThrow('Cannot determine caller identity');
      
      expect(mockAuthorizationService.isSuperAdmin).not.toHaveBeenCalled();
    });

    it('should throw error when user lacks admin access', async () => {
      const callerId = 'user-123';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.isSuperAdmin.mockResolvedValue(false);

      const middleware = requireSuperAdminAccess();
      
      await expect(middleware(mockContext)).rejects.toThrow('Insufficient privileges');
      
      expect(mockAuthorizationService.isSuperAdmin).toHaveBeenCalledWith(callerId);
    });

    it('should handle different caller ID formats', async () => {
      const testCases = [
        'admin-123-oid',
        'admin@example.com',
        '12345678-1234-1234-1234-123456789012',
        'azure-ad-object-id'
      ];

      for (const callerId of testCases) {
        mockExtractCallerId.mockReturnValue(callerId);
        mockAuthorizationService.isSuperAdmin.mockResolvedValue(true);
        const middleware = requireSuperAdminAccess();
        
        await middleware(mockContext);
        
        expect(mockAuthorizationService.isSuperAdmin).toHaveBeenCalledWith(callerId);
      }
    });

    it('should handle authorization service errors', async () => {
      const callerId = 'admin-123';
      mockExtractCallerId.mockReturnValue(callerId);
      const authError = new Error('Authorization service unavailable');
      mockAuthorizationService.isSuperAdmin.mockRejectedValue(authError);

      const middleware = requireSuperAdminAccess();
      
      await expect(middleware(mockContext)).rejects.toThrow('Authorization service unavailable');
    });

    it('should create new service instances for each middleware', () => {
      const middleware1 = requireSuperAdminAccess();
      const middleware2 = requireSuperAdminAccess();
      
      expect(MockedAuthorizationService).toHaveBeenCalledTimes(2);
      expect(MockedUserRepository).toHaveBeenCalledTimes(2);
      expect(middleware1).not.toBe(middleware2);
    });
  });

  describe('edge cases', () => {
    it('should handle context with minimal properties', async () => {
      mockContext = {} as any;
      const callerId = 'user-123';
      mockExtractCallerId.mockReturnValue(callerId);
      mockAuthorizationService.canSendCommands.mockResolvedValue(true);

      const middleware = requireCommandPermission();
      await middleware(mockContext);

      expect(mockAuthorizationService.canSendCommands).toHaveBeenCalledWith(callerId);
    });

    it('should handle empty caller ID', async () => {
      mockExtractCallerId.mockReturnValue('');
      mockAuthorizationService.canSendCommands.mockResolvedValue(false);

      const middleware = requireCommandPermission();
      
      await expect(middleware(mockContext)).rejects.toThrow('Insufficient privileges');
    });

    it('should handle very long caller ID', async () => {
      const longCallerId = 'a'.repeat(1000);
      mockExtractCallerId.mockReturnValue(longCallerId);
      mockAuthorizationService.canSendCommands.mockResolvedValue(true);

      const middleware = requireCommandPermission();
      await middleware(mockContext);

      expect(mockAuthorizationService.canSendCommands).toHaveBeenCalledWith(longCallerId);
    });

    it('should handle special characters in caller ID', async () => {
      const specialCallerId = 'user+test@example-domain.co.uk';
      mockExtractCallerId.mockReturnValue(specialCallerId);
      mockAuthorizationService.canSendCommands.mockResolvedValue(true);

      const middleware = requireCommandPermission();
      await middleware(mockContext);

      expect(mockAuthorizationService.canSendCommands).toHaveBeenCalledWith(specialCallerId);
    });

    it('should handle unicode characters in caller ID', async () => {
      const unicodeCallerId = 'usér@éxample.com';
      mockExtractCallerId.mockReturnValue(unicodeCallerId);
      mockAuthorizationService.canSendCommands.mockResolvedValue(true);

      const middleware = requireCommandPermission();
      await middleware(mockContext);

      expect(mockAuthorizationService.canSendCommands).toHaveBeenCalledWith(unicodeCallerId);
    });
  });
});
