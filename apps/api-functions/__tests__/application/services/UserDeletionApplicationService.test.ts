import { UserDeletionApplicationService } from '../../../src/application/services/UserDeletionApplicationService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../../src/domain/interfaces/IAuthorizationService';
import { IAuditService } from '../../../src/domain/interfaces/IAuditService';
import { IPresenceService } from '../../../src/domain/interfaces/IPresenceService';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { UserDeletionRequest } from '../../../src/domain/value-objects/UserDeletionRequest';
import { UserDeletionResult } from '../../../src/domain/value-objects/UserDeletionResult';
import { UserDeletionError, UserDeletionErrorCode } from '../../../src/domain/errors';
import { UserDeletionType } from '../../../src/domain/enums/UserDeletionType';
import { User } from '../../../src/domain/entities/User';
import { UserRole } from '@prisma/client';

describe('UserDeletionApplicationService', () => {
  let service: UserDeletionApplicationService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockAuditService: jest.Mocked<IAuditService>;
  let mockPresenceService: jest.Mocked<IPresenceService>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
      findByEmail: jest.fn(),
      changeUserRole: jest.fn(),
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

    service = new UserDeletionApplicationService(
      mockUserRepository,
      mockAuthorizationService,
      mockAuditService,
      mockPresenceService,
      mockWebPubSubService
    );
  });

  describe('validateDeletionRequest', () => {
    const callerId = 'test-caller-id';

    it('should successfully validate deletion request', async () => {
      const request = UserDeletionRequest.create('pso@example.com', UserDeletionType.SOFT_DELETE);
      const caller = new User({
        id: 'caller-id',
        azureAdObjectId: callerId,
        email: 'admin@example.com',
        fullName: 'Admin',
        role: UserRole.Admin,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const targetUser = new User({
        id: 'target-id',
        azureAdObjectId: 'target-azure-id',
        email: 'pso@example.com',
        fullName: 'PSO',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockUserRepository.findByEmail.mockResolvedValue(targetUser);

      await service.validateDeletionRequest(request, callerId);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('pso@example.com');
    });

    it('should throw error when email is invalid', async () => {
      const request = UserDeletionRequest.create('', UserDeletionType.SOFT_DELETE);

      await expect(service.validateDeletionRequest(request, callerId)).rejects.toThrow();
    });

    it('should throw error when deletion type is invalid', async () => {
      const request = UserDeletionRequest.create('user@example.com', 'INVALID' as any);

      await expect(service.validateDeletionRequest(request, callerId)).rejects.toThrow(
        UserDeletionError
      );
    });

    it('should throw error when caller not found', async () => {
      const request = UserDeletionRequest.create('pso@example.com', UserDeletionType.SOFT_DELETE);

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.validateDeletionRequest(request, callerId)).rejects.toThrow(
        UserDeletionError
      );
    });

    it('should throw error when target user not found', async () => {
      const request = UserDeletionRequest.create('pso@example.com', UserDeletionType.SOFT_DELETE);
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
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.validateDeletionRequest(request, callerId)).rejects.toThrow(
        UserDeletionError
      );
    });

    it('should throw error when caller lacks permissions', async () => {
      const request = UserDeletionRequest.create('admin@example.com', UserDeletionType.SOFT_DELETE);
      const caller = new User({
        id: 'caller-id',
        azureAdObjectId: callerId,
        email: 'supervisor@example.com',
        fullName: 'Supervisor',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const targetUser = new User({
        id: 'target-id',
        azureAdObjectId: 'target-azure-id',
        email: 'admin@example.com',
        fullName: 'Admin',
        role: UserRole.Admin,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockUserRepository.findByEmail.mockResolvedValue(targetUser);

      await expect(service.validateDeletionRequest(request, callerId)).rejects.toThrow(
        UserDeletionError
      );
    });
  });

  describe('deleteUser', () => {
    const callerId = 'test-caller-id';

    it('should successfully delete user', async () => {
      const request = UserDeletionRequest.create('pso@example.com', UserDeletionType.SOFT_DELETE);
      const existingUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'pso@example.com',
        fullName: 'PSO User',
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
      mockUserRepository.changeUserRole.mockResolvedValue(undefined);
      mockPresenceService.setUserOffline.mockResolvedValue(undefined);
      mockAuditService.logAudit.mockResolvedValue(undefined);

      const result = await service.deleteUser(request, callerId);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('pso@example.com');
      expect(mockUserRepository.changeUserRole).toHaveBeenCalledWith('user-id', UserRole.Unassigned);
      expect(mockPresenceService.setUserOffline).toHaveBeenCalledWith('pso@example.com');
      expect(result.success).toBe(true);
      expect(result.previousRole).toBe(UserRole.PSO);
    });

    it('should throw error when user not found', async () => {
      const request = UserDeletionRequest.create('pso@example.com', UserDeletionType.SOFT_DELETE);

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.deleteUser(request, callerId)).rejects.toThrow(UserDeletionError);
    });

    it('should throw error when user already unassigned', async () => {
      const request = UserDeletionRequest.create('user@example.com', UserDeletionType.SOFT_DELETE);
      const existingUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
        fullName: 'User',
        role: UserRole.Unassigned,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.deleteUser(request, callerId)).rejects.toThrow(UserDeletionError);
    });

    it('should broadcast supervisor removal when deleting Supervisor', async () => {
      const request = UserDeletionRequest.create('supervisor@example.com', UserDeletionType.SOFT_DELETE);
      const existingUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor',
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
      mockUserRepository.changeUserRole.mockResolvedValue(undefined);
      mockPresenceService.setUserOffline.mockResolvedValue(undefined);
      mockAuditService.logAudit.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastSupervisorListChanged.mockResolvedValue(undefined);

      await service.deleteUser(request, callerId);

      expect(mockWebPubSubService.broadcastSupervisorListChanged).toHaveBeenCalledWith({
        email: 'supervisor@example.com',
        fullName: 'Supervisor',
        azureAdObjectId: 'azure-id',
        action: 'removed',
      });
    });

    it('should not broadcast when deleting non-Supervisor user', async () => {
      const request = UserDeletionRequest.create('pso@example.com', UserDeletionType.SOFT_DELETE);
      const existingUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'pso@example.com',
        fullName: 'PSO',
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
      mockUserRepository.changeUserRole.mockResolvedValue(undefined);
      mockPresenceService.setUserOffline.mockResolvedValue(undefined);
      mockAuditService.logAudit.mockResolvedValue(undefined);

      await service.deleteUser(request, callerId);

      expect(mockWebPubSubService.broadcastSupervisorListChanged).not.toHaveBeenCalled();
    });

    it('should throw error when deletion fails', async () => {
      const request = UserDeletionRequest.create('pso@example.com', UserDeletionType.SOFT_DELETE);
      const existingUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'pso@example.com',
        fullName: 'PSO',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      mockUserRepository.changeUserRole.mockRejectedValue(new Error('Database error'));

      await expect(service.deleteUser(request, callerId)).rejects.toThrow(UserDeletionError);
    });
  });
});

