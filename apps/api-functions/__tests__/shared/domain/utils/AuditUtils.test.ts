/**
 * @fileoverview Tests for AuditUtils
 * @description Tests for audit logging utilities
 */

import { AuditUtils } from '../../../../shared/domain/utils/AuditUtils';
import { IAuditService } from '../../../../shared/domain/interfaces/IAuditService';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { User } from '../../../../shared/domain/entities/User';

describe('AuditUtils', () => {
  let mockAuditService: jest.Mocked<IAuditService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockAuditService = {
      logAudit: jest.fn().mockResolvedValue(undefined),
    };

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
    } as any;
  });

  describe('logAuditWithCaller', () => {
    it('should log audit with caller successfully', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      const caller = { id: 'user-123', email: 'caller@test.com' } as User;
      const auditData = {
        entity: 'TestEntity',
        entityId: 'entity-123',
        action: 'CREATE',
        dataBefore: { old: 'value' },
        dataAfter: { new: 'value' },
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      // Act
      await AuditUtils.logAuditWithCaller(
        mockAuditService,
        mockUserRepository,
        callerId,
        auditData
      );

      // Assert
      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        entity: auditData.entity,
        entityId: auditData.entityId,
        action: auditData.action,
        changedById: caller.id,
        dataBefore: auditData.dataBefore,
        dataAfter: auditData.dataAfter,
      });
    });

    it('should throw error when caller is not found', async () => {
      // Arrange
      const callerId = 'non-existent-caller-id';
      const auditData = {
        entity: 'TestEntity',
        entityId: 'entity-123',
        action: 'CREATE',
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuditUtils.logAuditWithCaller(
          mockAuditService,
          mockUserRepository,
          callerId,
          auditData
        )
      ).rejects.toThrow(`Caller not found for Azure AD Object ID: ${callerId}`);
    });
  });

  describe('logUserCreation', () => {
    it('should log user creation audit', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      const caller = { id: 'user-123', email: 'caller@test.com' } as User;
      const user = { id: 'new-user-123', email: 'newuser@test.com' } as User;

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      // Act
      await AuditUtils.logUserCreation(
        mockAuditService,
        mockUserRepository,
        callerId,
        user
      );

      // Assert
      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        entity: 'User',
        entityId: user.id,
        action: 'CREATE',
        changedById: caller.id,
        dataAfter: user,
      });
    });
  });

  describe('logUserUpdate', () => {
    it('should log user update audit', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      const caller = { id: 'user-123', email: 'caller@test.com' } as User;
      const userBefore = { id: 'user-456', email: 'old@test.com' } as User;
      const userAfter = { id: 'user-456', email: 'new@test.com' } as User;

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      // Act
      await AuditUtils.logUserUpdate(
        mockAuditService,
        mockUserRepository,
        callerId,
        userBefore,
        userAfter
      );

      // Assert
      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        entity: 'User',
        entityId: userAfter.id,
        action: 'UPDATE',
        changedById: caller.id,
        dataBefore: userBefore,
        dataAfter: userAfter,
      });
    });
  });

  describe('logUserDeletion', () => {
    it('should log user deletion audit', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      const caller = { id: 'user-123', email: 'caller@test.com' } as User;
      const user = { id: 'user-456', email: 'deleted@test.com' } as User;

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      // Act
      await AuditUtils.logUserDeletion(
        mockAuditService,
        mockUserRepository,
        callerId,
        user
      );

      // Assert
      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        entity: 'User',
        entityId: user.id,
        action: 'DELETE',
        changedById: caller.id,
        dataBefore: user,
      });
    });
  });

  describe('logRoleChange', () => {
    it('should log role change audit', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      const caller = { id: 'user-123', email: 'caller@test.com' } as User;
      const userBefore = { id: 'user-456', role: 'EMPLOYEE' } as any;
      const userAfter = { id: 'user-456', role: 'SUPERVISOR' } as any;

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      // Act
      await AuditUtils.logRoleChange(
        mockAuditService,
        mockUserRepository,
        callerId,
        userBefore,
        userAfter
      );

      // Assert
      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        entity: 'User',
        entityId: userAfter.id,
        action: 'ROLE_CHANGE',
        changedById: caller.id,
        dataBefore: userBefore,
        dataAfter: userAfter,
      });
    });

    it('should log role change audit with null userBefore', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      const caller = { id: 'user-123', email: 'caller@test.com' } as User;
      const userAfter = { id: 'user-456', role: 'SUPERVISOR' } as any;

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      // Act
      await AuditUtils.logRoleChange(
        mockAuditService,
        mockUserRepository,
        callerId,
        null,
        userAfter
      );

      // Assert
      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        entity: 'User',
        entityId: userAfter.id,
        action: 'ROLE_CHANGE',
        changedById: caller.id,
        dataBefore: null,
        dataAfter: userAfter,
      });
    });
  });

  describe('logSupervisorChange', () => {
    it('should log supervisor change audit', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      const caller = { id: 'user-123', email: 'caller@test.com' } as User;
      const userId = 'user-456';
      const supervisorBefore = 'supervisor-1';
      const supervisorAfter = 'supervisor-2';

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      // Act
      await AuditUtils.logSupervisorChange(
        mockAuditService,
        mockUserRepository,
        callerId,
        userId,
        supervisorBefore,
        supervisorAfter
      );

      // Assert
      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        entity: 'User',
        entityId: userId,
        action: 'SUPERVISOR_CHANGE',
        changedById: caller.id,
        dataBefore: { supervisorId: supervisorBefore },
        dataAfter: { supervisorId: supervisorAfter },
      });
    });

    it('should log supervisor change audit with null supervisors', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      const caller = { id: 'user-123', email: 'caller@test.com' } as User;
      const userId = 'user-456';

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      // Act
      await AuditUtils.logSupervisorChange(
        mockAuditService,
        mockUserRepository,
        callerId,
        userId,
        null,
        null
      );

      // Assert
      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        entity: 'User',
        entityId: userId,
        action: 'SUPERVISOR_CHANGE',
        changedById: caller.id,
        dataBefore: { supervisorId: null },
        dataAfter: { supervisorId: null },
      });
    });
  });

  describe('logCommandExecution', () => {
    it('should log command execution audit', async () => {
      // Arrange
      const callerId = 'test-caller-id';
      const caller = { id: 'user-123', email: 'caller@test.com' } as User;
      const command = 'CAMERA_START';
      const targetUser = 'target@test.com';

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      // Act
      await AuditUtils.logCommandExecution(
        mockAuditService,
        mockUserRepository,
        callerId,
        command,
        targetUser
      );

      // Assert
      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        entity: 'Command',
        entityId: `${command}-${targetUser}`,
        action: 'EXECUTE',
        changedById: caller.id,
        dataAfter: { command, targetUser },
      });
    });
  });
});
