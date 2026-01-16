import { GetCurrentUserDomainService } from '../../../src/domain/services/GetCurrentUserDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { GetCurrentUserRequest } from '../../../src/domain/value-objects/GetCurrentUserRequest';
import { GetCurrentUserResponse } from '../../../src/domain/value-objects/GetCurrentUserResponse';
import { ApplicationError, ValidationError } from '../../../src/domain/errors/DomainError';
import { createMockUserRepository, createMockUser } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';
import { UserConstants } from '../../../src/domain/constants/UserConstants';

describe('GetCurrentUserDomainService', () => {
  let service: GetCurrentUserDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    service = new GetCurrentUserDomainService(mockUserRepository);
  });

  describe('getCurrentUser', () => {
    it('should return existing user', async () => {
      const request = new GetCurrentUserRequest('caller-id');
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        email: 'user@example.com',
        fullName: 'John Doe',
        role: UserRole.PSO,
      });
      const jwtPayload = { email: 'user@example.com', name: 'John Doe' };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue(['permission1']);

      const result = await service.getCurrentUser(request, jwtPayload);

      expect(result.email).toBe('user@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.isNewUser).toBe(false);
    });

    it('should create new user when not found', async () => {
      const request = new GetCurrentUserRequest('caller-id');
      const newUser = createMockUser({
        id: 'new-user-id',
        azureAdObjectId: 'caller-id',
        email: 'newuser@example.com',
        fullName: 'New User',
        role: UserRole.PSO,
      });
      const jwtPayload = { email: 'newuser@example.com', name: 'New User' };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);
      mockUserRepository.upsertUser.mockResolvedValue(newUser);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([]);

      const result = await service.getCurrentUser(request, jwtPayload);

      expect(mockUserRepository.upsertUser).toHaveBeenCalled();
      expect(result.isNewUser).toBe(true);
    });

    it('should promote user to SuperAdmin when email has prefix', async () => {
      const request = new GetCurrentUserRequest('caller-id');
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        email: `${UserConstants.SUPER_ADMIN_EMAIL_PREFIX}user@example.com`,
        role: UserRole.PSO,
      });
      const updatedUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        email: `${UserConstants.SUPER_ADMIN_EMAIL_PREFIX}user@example.com`,
        role: UserRole.SuperAdmin,
      });
      const jwtPayload = { email: `${UserConstants.SUPER_ADMIN_EMAIL_PREFIX}user@example.com` };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRepository.changeUserRole.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValueOnce(user).mockResolvedValueOnce(updatedUser);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([]);

      const result = await service.getCurrentUser(request, jwtPayload);

      expect(mockUserRepository.changeUserRole).toHaveBeenCalledWith('user-id', UserRole.SuperAdmin);
      expect(result.role).toBe(UserRole.SuperAdmin);
    });

    it('should promote Unassigned user to PSO', async () => {
      const request = new GetCurrentUserRequest('caller-id');
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        role: UserRole.Unassigned,
      });
      const updatedUser = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        role: UserRole.PSO,
      });
      const jwtPayload = { email: 'user@example.com' };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValueOnce(user).mockResolvedValueOnce(updatedUser);
      mockUserRepository.changeUserRole.mockResolvedValue(undefined);
      mockUserRepository.syncUserRoleAssignments.mockResolvedValue(undefined);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([]);

      const result = await service.getCurrentUser(request, jwtPayload);

      expect(mockUserRepository.changeUserRole).toHaveBeenCalledWith('user-id', UserRole.PSO);
      expect(mockUserRepository.syncUserRoleAssignments).toHaveBeenCalledWith('user-id', UserRole.PSO);
      expect(result.role).toBe(UserRole.PSO);
    });

    it('should sync role assignments defensively for existing users', async () => {
      const request = new GetCurrentUserRequest('caller-id');
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        email: 'user@example.com',
        fullName: 'John Doe',
        role: UserRole.ContactManager,
      });
      const jwtPayload = { email: 'user@example.com', name: 'John Doe' };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRepository.syncUserRoleAssignments.mockResolvedValue(undefined);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue(['permission1']);

      await service.getCurrentUser(request, jwtPayload);

      // Verify defensive synchronization is called
      expect(mockUserRepository.syncUserRoleAssignments).toHaveBeenCalledWith('user-id', UserRole.ContactManager);
    });

    it('should throw error when email not found in JWT for new user', async () => {
      const request = new GetCurrentUserRequest('caller-id');
      const jwtPayload = {};

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.getCurrentUser(request, jwtPayload)).rejects.toThrow(ValidationError);
    });

    it('should split full name correctly', async () => {
      const request = new GetCurrentUserRequest('caller-id');
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        fullName: 'John Michael Doe',
        role: UserRole.PSO,
      });
      const jwtPayload = { email: 'user@example.com' };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockUserRepository.getEffectivePermissionCodesByAzureId.mockResolvedValue([]);

      const result = await service.getCurrentUser(request, jwtPayload);

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Michael Doe');
    });
  });
});



