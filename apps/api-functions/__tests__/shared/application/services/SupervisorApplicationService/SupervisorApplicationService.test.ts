/**
 * @fileoverview SupervisorApplicationService - unit tests
 * @summary Tests for SupervisorApplicationService functionality
 * @description Validates supervisor operations, authorization, and business logic
 */

import { SupervisorApplicationService } from '../../../../../shared/application/services/SupervisorApplicationService';
import { SupervisorAssignment } from '../../../../../shared/domain/value-objects/SupervisorAssignment';
import { SupervisorChangeResult } from '../../../../../shared/domain/value-objects/SupervisorChangeResult';
import { IUserRepository } from '../../../../../shared/domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../../../../shared/domain/interfaces/IAuthorizationService';
import { ISupervisorRepository } from '../../../../../shared/domain/interfaces/ISupervisorRepository';
import { ICommandMessagingService } from '../../../../../shared/domain/interfaces/ICommandMessagingService';
import { ISupervisorManagementService } from '../../../../../shared/domain/interfaces/ISupervisorManagementService';
import { IAuditService } from '../../../../../shared/domain/interfaces/IAuditService';
import { IWebPubSubService } from '../../../../../shared/domain/interfaces/IWebPubSubService';
import { SupervisorError } from '../../../../../shared/domain/errors/DomainError';
import { SupervisorErrorCode } from '../../../../../shared/domain/errors/ErrorCodes';
import { SupervisorChangeType } from '../../../../../shared/domain/enums/SupervisorChangeType';

// Mock dependencies
const mockUserRepository: jest.Mocked<IUserRepository> = {
  findByAzureAdObjectId: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAllUsers: jest.fn(),
  existsAndActive: jest.fn(),
  hasRole: jest.fn(),
  hasAnyRole: jest.fn(),
  isEmployee: jest.fn(),
  updateSupervisor: jest.fn(),
  createEmployee: jest.fn(),
  updateMultipleSupervisors: jest.fn(),
  findBySupervisor: jest.fn(),
  deleteUser: jest.fn(),
  upsertUser: jest.fn(),
  findByRoles: jest.fn(),
  findUsersWithUnassignedRole: jest.fn(),
  changeUserRole: jest.fn(),
  createContactManager: jest.fn(),
  createContactManagerProfile: jest.fn(),
  createContactManagerStatusHistory: jest.fn(),
  createSuperAdmin: jest.fn(),
  createSuperAdminAuditLog: jest.fn(),
  findContactManagerProfile: jest.fn(),
  deleteContactManagerProfile: jest.fn(),
  createContactManagerAuditLog: jest.fn(),
  findAllContactManagers: jest.fn(),
  findContactManagerProfileByUserId: jest.fn(),
  findAllSuperAdmins: jest.fn(),
  updateContactManagerStatus: jest.fn(),
  getPsosBySupervisor: jest.fn(),
  findByRolesWithSupervisor: jest.fn(),
  findUsersWithUnassignedRoleWithSupervisor: jest.fn()
};

const mockAuthorizationService: jest.Mocked<IAuthorizationService> = {
  canSendCommands: jest.fn(),
  authorizeUserQuery: jest.fn(),
  canManageUsers: jest.fn(),
  canAccessAdmin: jest.fn(),
  isUserActive: jest.fn(),
  authorizeCommandAcknowledgment: jest.fn(),
  canAccessStreamingStatus: jest.fn()
};

const mockSupervisorRepository: jest.Mocked<ISupervisorRepository> = {
  findByEmail: jest.fn(),
  isSupervisor: jest.fn(),
  findById: jest.fn(),
  validateSupervisor: jest.fn(),
  findSupervisorByIdentifier: jest.fn(),
  findPsoByIdentifier: jest.fn()
};

const mockCommandMessagingService: jest.Mocked<ICommandMessagingService> = {
  sendToGroup: jest.fn()
};

const mockSupervisorManagementService: jest.Mocked<ISupervisorManagementService> = {
  assignSupervisor: jest.fn(),
  validateSupervisorAssignment: jest.fn(),
  validateUsersForSupervisorChange: jest.fn()
};

const mockAuditService: jest.Mocked<IAuditService> = {
  logAudit: jest.fn()
};

const mockWebPubSubService: jest.Mocked<IWebPubSubService> = {
  generateToken: jest.fn(),
  broadcastPresence: jest.fn(),
  broadcastMessage: jest.fn(),
  listAllGroupsAndUsers: jest.fn(),
  getActiveUsersInPresenceGroup: jest.fn(),
  syncAllUsersWithDatabase: jest.fn(),
  debugSync: jest.fn(),
  logActiveUsersInPresenceGroup: jest.fn(),
  broadcastSupervisorChangeNotification: jest.fn()
};

describe('SupervisorApplicationService', () => {
  let service: SupervisorApplicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SupervisorApplicationService(
      mockUserRepository,
      mockAuthorizationService,
      mockSupervisorRepository,
      mockCommandMessagingService,
      mockSupervisorManagementService,
      mockAuditService,
      mockWebPubSubService
    );
  });

  describe('constructor', () => {
    it('should create service with all dependencies', () => {
      expect(service).toBeInstanceOf(SupervisorApplicationService);
    });
  });

  describe('authorizeSupervisorChange', () => {
    it('should authorize user for supervisor change', async () => {
      const callerId = 'user-123';
      mockAuthorizationService.isUserActive.mockResolvedValue(true);
      mockAuthorizationService.canManageUsers.mockResolvedValue(true);

      await service.authorizeSupervisorChange(callerId);

      expect(mockAuthorizationService.isUserActive).toHaveBeenCalledWith(callerId);
      expect(mockAuthorizationService.canManageUsers).toHaveBeenCalledWith(callerId);
    });

    it('should throw error when user is not authorized', async () => {
      const callerId = 'user-123';
      mockAuthorizationService.isUserActive.mockResolvedValue(false);

      await expect(service.authorizeSupervisorChange(callerId)).rejects.toThrow('User not found or inactive');
    });
  });

  describe('validateSupervisorAssignment', () => {
    it('should validate assignment with supervisor', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com', 'user2@example.com'],
        'supervisor@example.com',
        new Date()
      );

      const supervisorUser = {
        id: 'supervisor-123',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        role: 'Supervisor',
        getDisplayName: () => 'Supervisor Name'
      };

      mockSupervisorRepository.findByEmail.mockResolvedValue(supervisorUser as any);
      mockSupervisorManagementService.validateUsersForSupervisorChange.mockResolvedValue(['user1@example.com', 'user2@example.com']);

      await service.validateSupervisorAssignment(assignment);

      expect(mockSupervisorRepository.findByEmail).toHaveBeenCalledWith('supervisor@example.com');
      expect(mockSupervisorManagementService.validateUsersForSupervisorChange).toHaveBeenCalledWith(['user1@example.com', 'user2@example.com']);
    });

    it('should validate assignment without supervisor (unassign)', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        null,
        new Date()
      );

      mockSupervisorManagementService.validateUsersForSupervisorChange.mockResolvedValue(['user1@example.com', 'user2@example.com']);

      await service.validateSupervisorAssignment(assignment);

      expect(mockSupervisorManagementService.validateUsersForSupervisorChange).toHaveBeenCalledWith(['user1@example.com']);
    });

    it('should throw error for invalid assignment', async () => {
      const assignment = new SupervisorAssignment(
        ['invalid-email'],
        'supervisor@example.com',
        new Date()
      );

      await expect(service.validateSupervisorAssignment(assignment)).rejects.toThrow();
    });
  });

  describe('changeSupervisor', () => {
    it('should change supervisor successfully', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        'supervisor@example.com',
        new Date()
      );

      const expectedResult = new SupervisorChangeResult(1, 0, 1);

      mockSupervisorManagementService.assignSupervisor.mockResolvedValue(expectedResult);
      mockCommandMessagingService.sendToGroup.mockResolvedValue();
      mockSupervisorRepository.findByEmail.mockResolvedValue({
        id: 'supervisor-123',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        getDisplayName: () => 'Supervisor Name'
      } as any);

      const result = await service.changeSupervisor(assignment);

      expect(mockSupervisorManagementService.assignSupervisor).toHaveBeenCalledWith(
        ['user1@example.com'],
        'supervisor@example.com'
      );
      expect(result).toBe(expectedResult);
    });

    it('should handle supervisor change failure', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        'supervisor@example.com',
        new Date()
      );

      mockSupervisorManagementService.assignSupervisor.mockRejectedValue(new Error('Database error'));

      await expect(service.changeSupervisor(assignment)).rejects.toThrow(SupervisorError);
      await expect(service.changeSupervisor(assignment)).rejects.toThrow('Failed to change supervisor: Database error');
    });

    it('should handle unassign supervisor', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        null,
        new Date()
      );

      const expectedResult = new SupervisorChangeResult(1, 0, 1);

      mockSupervisorManagementService.assignSupervisor.mockResolvedValue(expectedResult);
      mockCommandMessagingService.sendToGroup.mockResolvedValue();

      const result = await service.changeSupervisor(assignment);

      expect(mockSupervisorManagementService.assignSupervisor).toHaveBeenCalledWith(
        ['user1@example.com'],
        null
      );
      expect(result).toBe(expectedResult);
    });

    it('should handle notification failures gracefully', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        'supervisor@example.com',
        new Date()
      );

      const expectedResult = new SupervisorChangeResult(1, 0, 1);

      mockSupervisorManagementService.assignSupervisor.mockResolvedValue(expectedResult);
      mockCommandMessagingService.sendToGroup.mockRejectedValue(new Error('Notification failed'));
      mockSupervisorRepository.findByEmail.mockResolvedValue({
        id: 'supervisor-123',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        getDisplayName: () => 'Supervisor Name'
      } as any);

      // Should not throw error even if notifications fail
      const result = await service.changeSupervisor(assignment);

      expect(result).toBe(expectedResult);
    });
  });

  describe('notifyUsersOfSupervisorChange', () => {
    it('should notify users with supervisor name', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com', 'user2@example.com'],
        'supervisor@example.com',
        new Date('2023-01-01T10:00:00Z')
      );

      mockSupervisorRepository.findByEmail.mockResolvedValue({
        id: 'supervisor-123',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        getDisplayName: () => 'Supervisor Name'
      } as any);

      mockCommandMessagingService.sendToGroup.mockResolvedValue();

      // Access private method through any casting
      await (service as any).notifyUsersOfSupervisorChange(assignment);

      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledTimes(2);
      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledWith('commands:user1@example.com', {
        type: SupervisorChangeType.SUPERVISOR_CHANGED,
        newSupervisorName: 'Supervisor Name',
        timestamp: '2023-01-01T10:00:00.000Z'
      });
    });

    it('should notify users without supervisor name for unassign', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        null,
        new Date('2023-01-01T10:00:00Z')
      );

      mockCommandMessagingService.sendToGroup.mockResolvedValue();

      // Access private method through any casting
      await (service as any).notifyUsersOfSupervisorChange(assignment);

      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledWith('commands:user1@example.com', {
        type: SupervisorChangeType.SUPERVISOR_CHANGED,
        newSupervisorName: null,
        timestamp: '2023-01-01T10:00:00.000Z'
      });
    });

    it('should handle notification errors gracefully', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        'supervisor@example.com',
        new Date()
      );

      mockSupervisorRepository.findByEmail.mockResolvedValue({
        id: 'supervisor-123',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        getDisplayName: () => 'Supervisor Name'
      } as any);

      mockCommandMessagingService.sendToGroup.mockRejectedValue(new Error('Notification failed'));

      // Should not throw error
      await expect((service as any).notifyUsersOfSupervisorChange(assignment)).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw SupervisorError with correct error code', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        'supervisor@example.com',
        new Date()
      );

      mockSupervisorManagementService.assignSupervisor.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.changeSupervisor(assignment)).rejects.toThrow(SupervisorError);
      await expect(service.changeSupervisor(assignment)).rejects.toThrow('Failed to change supervisor: Database connection failed');
    });
  });

  describe('broadcastSupervisorChangeNotification', () => {
    it('should broadcast supervisor change notification successfully', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com', 'user2@example.com'],
        'supervisor@example.com',
        new Date('2023-01-01T10:00:00Z')
      );

      const supervisor = {
        id: 'supervisor-123',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        azureAdObjectId: 'supervisor-azure-id',
        getDisplayName: () => 'Supervisor Name'
      };

      const pso1 = {
        id: 'pso-1',
        email: 'user1@example.com',
        fullName: 'PSO One'
      };

      const pso2 = {
        id: 'pso-2',
        email: 'user2@example.com',
        fullName: 'PSO Two'
      };

      mockSupervisorRepository.findByEmail.mockResolvedValue(supervisor as any);
      mockUserRepository.findByEmail
        .mockResolvedValueOnce(pso1 as any)
        .mockResolvedValueOnce(pso2 as any);
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockResolvedValue();

      // Access private method through any casting
      await (service as any).broadcastSupervisorChangeNotification(assignment, 'Supervisor Name');

      expect(mockSupervisorRepository.findByEmail).toHaveBeenCalledWith('supervisor@example.com');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user1@example.com');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user2@example.com');
      expect(mockWebPubSubService.broadcastSupervisorChangeNotification).toHaveBeenCalledWith({
        psoEmails: ['user1@example.com', 'user2@example.com'],
        oldSupervisorEmail: undefined,
        newSupervisorEmail: 'supervisor@example.com',
        newSupervisorId: 'supervisor-azure-id',
        psoNames: ['PSO One', 'PSO Two'],
        newSupervisorName: 'Supervisor Name'
      });
    });

    it('should handle unassign supervisor notification', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        null,
        new Date('2023-01-01T10:00:00Z')
      );

      const pso1 = {
        id: 'pso-1',
        email: 'user1@example.com',
        fullName: 'PSO One'
      };

      mockUserRepository.findByEmail.mockResolvedValue(pso1 as any);
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockResolvedValue();

      // Access private method through any casting
      await (service as any).broadcastSupervisorChangeNotification(assignment, null);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user1@example.com');
      expect(mockWebPubSubService.broadcastSupervisorChangeNotification).toHaveBeenCalledWith({
        psoEmails: ['user1@example.com'],
        oldSupervisorEmail: undefined,
        newSupervisorEmail: '',
        newSupervisorId: undefined,
        psoNames: ['PSO One'],
        newSupervisorName: 'Unknown Supervisor'
      });
    });

    it('should handle broadcast notification errors gracefully', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com'],
        'supervisor@example.com',
        new Date('2023-01-01T10:00:00Z')
      );

      const supervisor = {
        id: 'supervisor-123',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        azureAdObjectId: 'supervisor-azure-id',
        getDisplayName: () => 'Supervisor Name'
      };

      const pso1 = {
        id: 'pso-1',
        email: 'user1@example.com',
        fullName: 'PSO One'
      };

      mockSupervisorRepository.findByEmail.mockResolvedValue(supervisor as any);
      mockUserRepository.findByEmail.mockResolvedValue(pso1 as any);
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockRejectedValue(new Error('Broadcast failed'));

      // Should not throw error
      await expect((service as any).broadcastSupervisorChangeNotification(assignment, 'Supervisor Name')).resolves.toBeUndefined();
    });

    it('should handle null PSO users gracefully', async () => {
      const assignment = new SupervisorAssignment(
        ['user1@example.com', 'user2@example.com'],
        'supervisor@example.com',
        new Date('2023-01-01T10:00:00Z')
      );

      const supervisor = {
        id: 'supervisor-123',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        azureAdObjectId: 'supervisor-azure-id',
        getDisplayName: () => 'Supervisor Name'
      };

      const pso1 = {
        id: 'pso-1',
        email: 'user1@example.com',
        fullName: 'PSO One'
      };

      mockSupervisorRepository.findByEmail.mockResolvedValue(supervisor as any);
      mockUserRepository.findByEmail
        .mockResolvedValueOnce(pso1 as any)
        .mockResolvedValueOnce(null); // Second user not found
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockResolvedValue();

      // Access private method through any casting
      await (service as any).broadcastSupervisorChangeNotification(assignment, 'Supervisor Name');

      expect(mockWebPubSubService.broadcastSupervisorChangeNotification).toHaveBeenCalledWith({
        psoEmails: ['user1@example.com', 'user2@example.com'],
        oldSupervisorEmail: undefined,
        newSupervisorEmail: 'supervisor@example.com',
        newSupervisorId: 'supervisor-azure-id',
        psoNames: ['PSO One'], // Only the found user
        newSupervisorName: 'Supervisor Name'
      });
    });
  });
});
