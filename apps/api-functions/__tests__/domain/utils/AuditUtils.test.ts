import { AuditUtils } from '../../../src/domain/utils/AuditUtils';
import { IAuditService } from '../../../src/domain/interfaces/IAuditService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { User } from '../../../src/domain/entities/User';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { UserRole } from '@prisma/client';

describe('AuditUtils', () => {
  let mockAuditService: jest.Mocked<IAuditService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockCaller: User;
  let mockUser: User;

  beforeEach(() => {
    mockAuditService = {
      logAudit: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockCaller = {
      id: 'caller-id',
      email: 'caller@example.com',
      azureAdObjectId: 'caller-azure-id',
    } as User;

    mockUser = {
      id: 'user-id',
      email: 'user@example.com',
      role: UserRole.PSO,
    } as User;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn().mockResolvedValue(mockCaller),
    } as any;
  });

  describe('logAuditWithCaller', () => {
    it('should throw UserNotFoundError when caller not found', async () => {
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(
        AuditUtils.logAuditWithCaller(
          mockAuditService,
          mockUserRepository,
          'non-existent-id',
          {
            entity: 'User',
            entityId: 'user-id',
            action: 'CREATE',
          }
        )
      ).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('logUserCreation', () => {
    it('should log user creation audit', async () => {
      await AuditUtils.logUserCreation(
        mockAuditService,
        mockUserRepository,
        'caller-azure-id',
        mockUser
      );

      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        entity: 'User',
        entityId: 'user-id',
        action: 'CREATE',
        changedById: 'caller-id',
        dataAfter: mockUser,
      });
    });
  });

  describe('logUserUpdate', () => {
    it('should log user update audit', async () => {
      const userBefore = new User({
        id: 'user-id',
        azureAdObjectId: 'user-azure-id',
        email: 'user@example.com',
        fullName: 'User Name',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const userAfter = new User({
        id: 'user-id',
        azureAdObjectId: 'user-azure-id',
        email: 'user@example.com',
        fullName: 'User Name',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await AuditUtils.logUserUpdate(
        mockAuditService,
        mockUserRepository,
        'caller-azure-id',
        userBefore,
        userAfter
      );

      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        entity: 'User',
        entityId: 'user-id',
        action: 'UPDATE',
        changedById: 'caller-id',
        dataBefore: userBefore,
        dataAfter: userAfter,
      });
    });
  });

  describe('logSupervisorChange', () => {
    it('should log supervisor change audit', async () => {
      await AuditUtils.logSupervisorChange(
        mockAuditService,
        mockUserRepository,
        'caller-azure-id',
        'user-id',
        'supervisor-1',
        'supervisor-2'
      );

      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        entity: 'User',
        entityId: 'user-id',
        action: 'SUPERVISOR_CHANGE',
        changedById: 'caller-id',
        dataBefore: { supervisorId: 'supervisor-1' },
        dataAfter: { supervisorId: 'supervisor-2' },
      });
    });
  });

  describe('logCommandExecution', () => {
    it('should log command execution audit', async () => {
      await AuditUtils.logCommandExecution(
        mockAuditService,
        mockUserRepository,
        'caller-azure-id',
        'START_CAMERA',
        'target@example.com'
      );

      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        entity: 'Command',
        entityId: 'START_CAMERA-target@example.com',
        action: 'EXECUTE',
        changedById: 'caller-id',
        dataAfter: {
          command: 'START_CAMERA',
          targetUser: 'target@example.com',
        },
      });
    });
  });
});

