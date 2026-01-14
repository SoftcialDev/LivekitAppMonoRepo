import { UserRoleChangeApplicationService } from '../../../src/application/services/UserRoleChangeApplicationService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../../src/domain/interfaces/IAuthorizationService';
import { IAuditService } from '../../../src/domain/interfaces/IAuditService';
import { IPresenceService } from '../../../src/domain/interfaces/IPresenceService';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { UserRoleChangeRequest } from '../../../src/domain/value-objects/UserRoleChangeRequest';
import { UserRoleChangeResult } from '../../../src/domain/value-objects/UserRoleChangeResult';
import { UserRoleChangeError, UserRoleChangeErrorCode } from '../../../src/domain/errors';
import { User } from '../../../src/domain/entities/User';
import { UserRole } from '@prisma/client';

describe('UserRoleChangeApplicationService', () => {
  let service: UserRoleChangeApplicationService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockAuditService: jest.Mocked<IAuditService>;
  let mockPresenceService: jest.Mocked<IPresenceService>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
      findByEmail: jest.fn(),
      upsertUser: jest.fn(),
    } as any;

    mockAuthorizationService = {} as any;

    mockAuditService = {
      logAudit: jest.fn(),
    } as any;

    mockPresenceService = {
      setUserOffline: jest.fn(),
    } as any;

    mockWebPubSubService = {
      broadcastSupervisorListChanged: jest.fn(),
    } as any;

    service = new UserRoleChangeApplicationService(
      mockUserRepository,
      mockAuthorizationService,
      mockAuditService,
      mockPresenceService,
      mockWebPubSubService
    );
  });

  describe('validateRoleChangeRequest', () => {
    const callerId = 'test-caller-id';

    it('should successfully validate role change request for Supervisor assigning PSO', async () => {
      const request = new UserRoleChangeRequest('pso@example.com', UserRole.PSO, new Date());
      const caller = new User({
        id: 'caller-id',
        azureAdObjectId: callerId,
        email: 'supervisor@example.com',
        fullName: 'Supervisor',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await service.validateRoleChangeRequest(request, callerId);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
    });

    it('should throw error when Supervisor tries to assign non-PSO role', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.Admin, new Date());
      const caller = new User({
        id: 'caller-id',
        azureAdObjectId: callerId,
        email: 'supervisor@example.com',
        fullName: 'Supervisor',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(service.validateRoleChangeRequest(request, callerId)).rejects.toThrow(
        UserRoleChangeError
      );
    });

    it('should throw error when invalid role is provided', async () => {
      const request = new UserRoleChangeRequest('user@example.com', 'InvalidRole' as any, new Date());
      const caller = new User({
        id: 'caller-id',
        azureAdObjectId: callerId,
        email: 'admin@example.com',
        fullName: 'Admin',
        role: UserRole.Admin,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(service.validateRoleChangeRequest(request, callerId)).rejects.toThrow(
        UserRoleChangeError
      );
    });

    it('should throw error when caller not found', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.PSO, new Date());

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.validateRoleChangeRequest(request, callerId)).rejects.toThrow(
        UserRoleChangeError
      );
    });

    it('should throw error when Admin tries to assign role above their level', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.SuperAdmin, new Date());
      const caller = new User({
        id: 'caller-id',
        azureAdObjectId: callerId,
        email: 'admin@example.com',
        fullName: 'Admin',
        role: UserRole.Admin,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(service.validateRoleChangeRequest(request, callerId)).rejects.toThrow(
        UserRoleChangeError
      );
    });

    it('should successfully validate when Admin assigns valid role', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.Supervisor, new Date());
      const caller = new User({
        id: 'caller-id',
        azureAdObjectId: callerId,
        email: 'admin@example.com',
        fullName: 'Admin',
        role: UserRole.Admin,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await service.validateRoleChangeRequest(request, callerId);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
    });

    it('should successfully validate deletion request (null role)', async () => {
      const request = new UserRoleChangeRequest('user@example.com', null as any, new Date());

      await service.validateRoleChangeRequest(request, callerId);

      expect(mockUserRepository.findByAzureAdObjectId).not.toHaveBeenCalled();
    });
  });

  describe('changeUserRole', () => {
    const callerId = 'test-caller-id';

    it('should successfully change user role for existing user', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.Supervisor, new Date());
      const existingUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
        fullName: 'User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const updatedUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
        fullName: 'User',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(new User({
        id: 'caller-id',
        azureAdObjectId: callerId,
        email: 'admin@example.com',
        fullName: 'Admin',
        role: UserRole.Admin,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser);
      mockAuditService.logAudit.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastSupervisorListChanged.mockResolvedValue(undefined);

      const result = await service.changeUserRole(request, callerId);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(mockUserRepository.upsertUser).toHaveBeenCalled();
      expect(result.previousRole).toBe(UserRole.PSO);
      expect(result.newRole).toBe(UserRole.Supervisor);
      expect(result.userCreated).toBe(false);
    });

    it('should successfully create new user when user does not exist', async () => {
      const request = new UserRoleChangeRequest('newuser@example.com', UserRole.PSO, new Date());
      const newUser = new User({
        id: 'new-user-id',
        azureAdObjectId: 'new-azure-id',
        email: 'newuser@example.com',
        fullName: 'newuser@example.com',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(new User({
        id: 'caller-id',
        azureAdObjectId: callerId,
        email: 'admin@example.com',
        fullName: 'Admin',
        role: UserRole.Admin,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      mockUserRepository.upsertUser.mockResolvedValue(newUser);
      mockAuditService.logAudit.mockResolvedValue(undefined);
      mockPresenceService.setUserOffline.mockResolvedValue(undefined);

      const result = await service.changeUserRole(request, callerId);

      expect(result.userCreated).toBe(true);
      expect(result.previousRole).toBeNull();
      expect(mockPresenceService.setUserOffline).toHaveBeenCalledWith('newuser@example.com');
    });

    it('should throw error when newRole is null', async () => {
      const request = new UserRoleChangeRequest('user@example.com', null as any, new Date());

      await expect(service.changeUserRole(request, callerId)).rejects.toThrow(
        UserRoleChangeError
      );
    });

    it('should set user offline when assigning PSO role', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.PSO, new Date());
      const existingUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
        fullName: 'User',
        role: UserRole.ContactManager,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const updatedUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
        fullName: 'User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(new User({
        id: 'caller-id',
        azureAdObjectId: callerId,
        email: 'admin@example.com',
        fullName: 'Admin',
        role: UserRole.Admin,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser);
      mockAuditService.logAudit.mockResolvedValue(undefined);
      mockPresenceService.setUserOffline.mockResolvedValue(undefined);

      await service.changeUserRole(request, callerId);

      expect(mockPresenceService.setUserOffline).toHaveBeenCalledWith('user@example.com');
    });

    it('should broadcast supervisor list changed when promoting to Supervisor', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.Supervisor, new Date());
      const existingUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
        fullName: 'User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const updatedUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
        fullName: 'User',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser);
      mockAuditService.logAudit.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastSupervisorListChanged.mockResolvedValue(undefined);

      await service.changeUserRole(request, callerId);

      expect(mockWebPubSubService.broadcastSupervisorListChanged).toHaveBeenCalledWith({
        email: 'user@example.com',
        fullName: 'User',
        azureAdObjectId: 'azure-id',
        action: 'added',
      });
    });

    it('should broadcast supervisor list changed when demoting from Supervisor', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.PSO, new Date());
      const existingUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
        fullName: 'User',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const updatedUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
        fullName: 'User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser);
      mockAuditService.logAudit.mockResolvedValue(undefined);
      mockPresenceService.setUserOffline.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastSupervisorListChanged.mockResolvedValue(undefined);

      await service.changeUserRole(request, callerId);

      expect(mockWebPubSubService.broadcastSupervisorListChanged).toHaveBeenCalledWith({
        email: 'user@example.com',
        fullName: 'User',
        azureAdObjectId: 'azure-id',
        action: 'removed',
      });
    });

    it('should not broadcast when role change does not involve Supervisor', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.ContactManager, new Date());
      const existingUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
        fullName: 'User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const updatedUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
        fullName: 'User',
        role: UserRole.ContactManager,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(new User({
        id: 'caller-id',
        azureAdObjectId: callerId,
        email: 'admin@example.com',
        fullName: 'Admin',
        role: UserRole.Admin,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser);
      mockAuditService.logAudit.mockResolvedValue(undefined);

      await service.changeUserRole(request, callerId);

      expect(mockWebPubSubService.broadcastSupervisorListChanged).not.toHaveBeenCalled();
    });

    it('should throw error when change fails', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.PSO, new Date());

      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(service.changeUserRole(request, callerId)).rejects.toThrow(UserRoleChangeError);
    });

    it('should use existing user azureAdObjectId when upserting', async () => {
      const request = new UserRoleChangeRequest('user@example.com', UserRole.PSO, new Date());
      const existingUser = new User({
        id: 'user-id',
        azureAdObjectId: 'existing-azure-id',
        email: 'user@example.com',
        fullName: 'Existing User',
        role: UserRole.ContactManager,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const updatedUser = new User({
        id: 'user-id',
        azureAdObjectId: 'existing-azure-id',
        email: 'user@example.com',
        fullName: 'Existing User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(new User({
        id: 'caller-id',
        azureAdObjectId: callerId,
        email: 'admin@example.com',
        fullName: 'Admin',
        role: UserRole.Admin,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      mockUserRepository.upsertUser.mockResolvedValue(updatedUser);
      mockAuditService.logAudit.mockResolvedValue(undefined);
      mockPresenceService.setUserOffline.mockResolvedValue(undefined);

      await service.changeUserRole(request, callerId);

      expect(mockUserRepository.upsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          azureAdObjectId: 'existing-azure-id',
          fullName: 'Existing User',
        })
      );
    });

    it('should use email as fullName when creating new user', async () => {
      const request = new UserRoleChangeRequest('newuser@example.com', UserRole.PSO, new Date());
      const newUser = new User({
        id: 'new-user-id',
        azureAdObjectId: '',
        email: 'newuser@example.com',
        fullName: 'newuser@example.com',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.upsertUser.mockResolvedValue(newUser);
      mockAuditService.logAudit.mockResolvedValue(undefined);
      mockPresenceService.setUserOffline.mockResolvedValue(undefined);

      await service.changeUserRole(request, callerId);

      expect(mockUserRepository.upsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'newuser@example.com',
        })
      );
    });
  });
});

