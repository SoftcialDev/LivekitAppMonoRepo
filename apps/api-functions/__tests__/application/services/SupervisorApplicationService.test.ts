import { SupervisorApplicationService } from '../../../src/application/services/SupervisorApplicationService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../../src/domain/interfaces/IAuthorizationService';
import { ISupervisorRepository } from '../../../src/domain/interfaces/ISupervisorRepository';
import { ICommandMessagingService } from '../../../src/domain/interfaces/ICommandMessagingService';
import { ISupervisorManagementService } from '../../../src/domain/interfaces/ISupervisorManagementService';
import { IAuditService } from '../../../src/domain/interfaces/IAuditService';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { SupervisorAssignment } from '../../../src/domain/value-objects/SupervisorAssignment';
import { SupervisorChangeResult } from '../../../src/domain/value-objects/SupervisorChangeResult';
import { SupervisorError } from '../../../src/domain/errors/DomainError';
import { SupervisorChangeType } from '../../../src/domain/enums/SupervisorChangeType';
import { User } from '../../../src/domain/entities/User';
import { UserRole } from '@prisma/client';

describe('SupervisorApplicationService', () => {
  let service: SupervisorApplicationService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockSupervisorRepository: jest.Mocked<ISupervisorRepository>;
  let mockCommandMessagingService: jest.Mocked<ICommandMessagingService>;
  let mockSupervisorManagementService: jest.Mocked<ISupervisorManagementService>;
  let mockAuditService: jest.Mocked<IAuditService>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
    } as any;

    mockAuthorizationService = {} as any;

    mockSupervisorRepository = {
      findByEmail: jest.fn(),
    } as any;

    mockCommandMessagingService = {
      sendToGroup: jest.fn(),
    } as any;

    mockSupervisorManagementService = {
      assignSupervisor: jest.fn(),
      validateUsersForSupervisorChange: jest.fn(),
    } as any;

    mockAuditService = {} as any;

    mockWebPubSubService = {
      broadcastSupervisorChangeNotification: jest.fn(),
    } as any;

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

  describe('validateSupervisorAssignment', () => {
    it('should successfully validate supervisor assignment with supervisor', async () => {
      const assignment = new SupervisorAssignment(
        ['pso1@example.com', 'pso2@example.com'],
        'supervisor@example.com',
        new Date()
      );
      const supervisor = new User({
        id: 'supervisor-id',
        azureAdObjectId: 'supervisor-azure-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockSupervisorRepository.findByEmail.mockResolvedValue(supervisor);
      mockSupervisorManagementService.validateUsersForSupervisorChange.mockResolvedValue([
        'pso1@example.com',
        'pso2@example.com',
      ]);

      await service.validateSupervisorAssignment(assignment);

      expect(mockSupervisorRepository.findByEmail).toHaveBeenCalledWith('supervisor@example.com');
      expect(mockSupervisorManagementService.validateUsersForSupervisorChange).toHaveBeenCalledWith([
        'pso1@example.com',
        'pso2@example.com',
      ]);
    });

    it('should successfully validate supervisor assignment without supervisor (unassign)', async () => {
      const assignment = new SupervisorAssignment(['pso1@example.com'], null, new Date());

      mockSupervisorManagementService.validateUsersForSupervisorChange.mockResolvedValue([
        'pso1@example.com',
      ]);

      await service.validateSupervisorAssignment(assignment);

      expect(mockSupervisorRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockSupervisorManagementService.validateUsersForSupervisorChange).toHaveBeenCalled();
    });

    it('should throw error when supervisor validation fails', async () => {
      const assignment = new SupervisorAssignment(
        ['pso1@example.com'],
        'invalid@example.com',
        new Date()
      );

      mockSupervisorRepository.findByEmail.mockResolvedValue(null);

      await expect(service.validateSupervisorAssignment(assignment)).rejects.toThrow();
    });
  });

  describe('changeSupervisor', () => {
    it('should successfully change supervisor', async () => {
      const assignment = new SupervisorAssignment(
        ['pso1@example.com'],
        'supervisor@example.com',
        new Date()
      );
      const supervisor = new User({
        id: 'supervisor-id',
        azureAdObjectId: 'supervisor-azure-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const psoUser = new User({
        id: 'pso-id',
        azureAdObjectId: 'pso-azure-id',
        email: 'pso1@example.com',
        fullName: 'PSO User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResult = SupervisorChangeResult.success(1);

      mockSupervisorManagementService.assignSupervisor.mockResolvedValue(mockResult);
      mockSupervisorRepository.findByEmail.mockResolvedValue(supervisor);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockUserRepository.findByEmail.mockResolvedValue(psoUser);
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockResolvedValue(undefined);

      const result = await service.changeSupervisor(assignment);

      expect(mockSupervisorManagementService.assignSupervisor).toHaveBeenCalledWith(
        ['pso1@example.com'],
        'supervisor@example.com'
      );
      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledWith(
        'commands:pso1@example.com',
        expect.objectContaining({
          type: SupervisorChangeType.SUPERVISOR_CHANGED,
        })
      );
      expect(result).toBe(mockResult);
    });

    it('should successfully unassign supervisor', async () => {
      const assignment = new SupervisorAssignment(['pso1@example.com'], null, new Date());
      const psoUser = new User({
        id: 'pso-id',
        azureAdObjectId: 'pso-azure-id',
        email: 'pso1@example.com',
        fullName: 'PSO User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResult = SupervisorChangeResult.success(1);

      mockSupervisorManagementService.assignSupervisor.mockResolvedValue(mockResult);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockUserRepository.findByEmail.mockResolvedValue(psoUser);
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockResolvedValue(undefined);

      const result = await service.changeSupervisor(assignment);

      expect(mockSupervisorManagementService.assignSupervisor).toHaveBeenCalledWith(
        ['pso1@example.com'],
        null
      );
      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledWith(
        'commands:pso1@example.com',
        expect.objectContaining({
          type: SupervisorChangeType.SUPERVISOR_CHANGED,
          newSupervisorName: null,
        })
      );
      expect(result).toBe(mockResult);
    });

    it('should continue when notification fails for one user', async () => {
      const assignment = new SupervisorAssignment(
        ['pso1@example.com', 'pso2@example.com'],
        'supervisor@example.com',
        new Date()
      );
      const supervisor = new User({
        id: 'supervisor-id',
        azureAdObjectId: 'supervisor-azure-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResult = SupervisorChangeResult.success(2);

      mockSupervisorManagementService.assignSupervisor.mockResolvedValue(mockResult);
      mockSupervisorRepository.findByEmail.mockResolvedValue(supervisor);
      mockCommandMessagingService.sendToGroup
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Notification failed'));
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockResolvedValue(undefined);

      const result = await service.changeSupervisor(assignment);

      expect(result).toBe(mockResult);
      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledTimes(2);
    });

    it('should continue when broadcast fails', async () => {
      const assignment = new SupervisorAssignment(
        ['pso1@example.com'],
        'supervisor@example.com',
        new Date()
      );
      const supervisor = new User({
        id: 'supervisor-id',
        azureAdObjectId: 'supervisor-azure-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const psoUser = new User({
        id: 'pso-id',
        azureAdObjectId: 'pso-azure-id',
        email: 'pso1@example.com',
        fullName: 'PSO User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResult = SupervisorChangeResult.success(1);

      mockSupervisorManagementService.assignSupervisor.mockResolvedValue(mockResult);
      mockSupervisorRepository.findByEmail.mockResolvedValue(supervisor);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockUserRepository.findByEmail.mockResolvedValue(psoUser);
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockRejectedValue(
        new Error('Broadcast failed')
      );

      const result = await service.changeSupervisor(assignment);

      expect(result).toBe(mockResult);
    });

    it('should throw error when supervisor change fails', async () => {
      const assignment = new SupervisorAssignment(
        ['pso1@example.com'],
        'supervisor@example.com',
        new Date()
      );

      mockSupervisorManagementService.assignSupervisor.mockRejectedValue(
        new Error('Change failed')
      );

      await expect(service.changeSupervisor(assignment)).rejects.toThrow(SupervisorError);
    });

    it('should include PSO names in broadcast when available', async () => {
      const assignment = new SupervisorAssignment(
        ['pso1@example.com', 'pso2@example.com'],
        'supervisor@example.com',
        new Date()
      );
      const supervisor = new User({
        id: 'supervisor-id',
        azureAdObjectId: 'supervisor-azure-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const pso1 = new User({
        id: 'pso1-id',
        azureAdObjectId: 'pso1-azure-id',
        email: 'pso1@example.com',
        fullName: 'PSO One',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const pso2 = new User({
        id: 'pso2-id',
        azureAdObjectId: 'pso2-azure-id',
        email: 'pso2@example.com',
        fullName: 'PSO Two',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResult = SupervisorChangeResult.success(2);

      mockSupervisorManagementService.assignSupervisor.mockResolvedValue(mockResult);
      mockSupervisorRepository.findByEmail.mockResolvedValue(supervisor);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockUserRepository.findByEmail
        .mockResolvedValueOnce(pso1)
        .mockResolvedValueOnce(pso2);
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockResolvedValue(undefined);

      await service.changeSupervisor(assignment);

      expect(mockWebPubSubService.broadcastSupervisorChangeNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          psoEmails: ['pso1@example.com', 'pso2@example.com'],
          psoNames: ['PSO One', 'PSO Two'],
          newSupervisorName: 'Supervisor Name',
        })
      );
    });

    it('should handle null supervisor name when supervisor not found', async () => {
      const assignment = new SupervisorAssignment(
        ['pso1@example.com'],
        'supervisor@example.com',
        new Date()
      );
      const psoUser = new User({
        id: 'pso-id',
        azureAdObjectId: 'pso-azure-id',
        email: 'pso1@example.com',
        fullName: 'PSO User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResult = SupervisorChangeResult.success(1);

      mockSupervisorManagementService.assignSupervisor.mockResolvedValue(mockResult);
      mockSupervisorRepository.findByEmail.mockResolvedValue(null);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockUserRepository.findByEmail.mockResolvedValue(psoUser);
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockResolvedValue(undefined);

      await service.changeSupervisor(assignment);

      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledWith(
        'commands:pso1@example.com',
        expect.objectContaining({
          newSupervisorName: null,
        })
      );
    });

    it('should filter out null users when getting PSO names', async () => {
      const assignment = new SupervisorAssignment(
        ['pso1@example.com', 'pso2@example.com'],
        'supervisor@example.com',
        new Date()
      );
      const supervisor = new User({
        id: 'supervisor-id',
        azureAdObjectId: 'supervisor-azure-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const pso1 = new User({
        id: 'pso1-id',
        azureAdObjectId: 'pso1-azure-id',
        email: 'pso1@example.com',
        fullName: 'PSO One',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResult = SupervisorChangeResult.success(2);

      mockSupervisorManagementService.assignSupervisor.mockResolvedValue(mockResult);
      mockSupervisorRepository.findByEmail.mockResolvedValue(supervisor);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockUserRepository.findByEmail.mockResolvedValueOnce(pso1).mockResolvedValueOnce(null);
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockResolvedValue(undefined);

      await service.changeSupervisor(assignment);

      expect(mockWebPubSubService.broadcastSupervisorChangeNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          psoNames: ['PSO One'],
        })
      );
    });

    it('should use email prefix when supervisor name is empty', async () => {
      const assignment = new SupervisorAssignment(
        ['pso1@example.com'],
        'supervisor@example.com',
        new Date()
      );
      const supervisor = new User({
        id: 'supervisor-id',
        azureAdObjectId: 'supervisor-azure-id',
        email: 'supervisor@example.com',
        fullName: '',
        role: UserRole.Supervisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const psoUser = new User({
        id: 'pso-id',
        azureAdObjectId: 'pso-azure-id',
        email: 'pso1@example.com',
        fullName: 'PSO User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResult = SupervisorChangeResult.success(1);

      mockSupervisorManagementService.assignSupervisor.mockResolvedValue(mockResult);
      mockSupervisorRepository.findByEmail.mockResolvedValue(supervisor);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockUserRepository.findByEmail.mockResolvedValue(psoUser);
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockResolvedValue(undefined);

      await service.changeSupervisor(assignment);

      expect(mockWebPubSubService.broadcastSupervisorChangeNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          newSupervisorName: 'supervisor',
        })
      );
    });

    it('should use Unknown Supervisor when supervisor is not found', async () => {
      const assignment = new SupervisorAssignment(
        ['pso1@example.com'],
        'supervisor@example.com',
        new Date()
      );
      const psoUser = new User({
        id: 'pso-id',
        azureAdObjectId: 'pso-azure-id',
        email: 'pso1@example.com',
        fullName: 'PSO User',
        role: UserRole.PSO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockResult = SupervisorChangeResult.success(1);

      mockSupervisorManagementService.assignSupervisor.mockResolvedValue(mockResult);
      mockSupervisorRepository.findByEmail.mockResolvedValue(null);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockUserRepository.findByEmail.mockResolvedValue(psoUser);
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockResolvedValue(undefined);

      await service.changeSupervisor(assignment);

      expect(mockWebPubSubService.broadcastSupervisorChangeNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          newSupervisorName: 'Unknown Supervisor',
        })
      );
    });
  });
});

