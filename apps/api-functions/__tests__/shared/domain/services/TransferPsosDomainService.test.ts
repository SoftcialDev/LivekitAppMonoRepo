import { TransferPsosDomainService } from '../../../../shared/domain/services/TransferPsosDomainService';
import { TransferPsosRequest } from '../../../../shared/domain/value-objects/TransferPsosRequest';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { ICommandMessagingService } from '../../../../shared/domain/interfaces/ICommandMessagingService';
import { IWebPubSubService } from '../../../../shared/domain/interfaces/IWebPubSubService';
import { UserNotFoundError } from '../../../../shared/domain/errors/UserErrors';
import { UserRole } from '../../../../shared/domain/enums/UserRole';

describe('TransferPsosDomainService', () => {
  let service: TransferPsosDomainService;
  let userRepository: jest.Mocked<IUserRepository>;
  let commandMessagingService: jest.Mocked<ICommandMessagingService>;
  let webPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = { findByAzureAdObjectId: jest.fn(), findByEmail: jest.fn(), findBySupervisor: jest.fn(), updateMultipleSupervisors: jest.fn() } as any;
    commandMessagingService = {} as any;
    webPubSubService = { broadcastMessage: jest.fn() } as any;
    service = new TransferPsosDomainService(userRepository, commandMessagingService, webPubSubService);
  });

  describe('transferPsos', () => {
    it('should transfer PSOs successfully', async () => {
      const mockCaller = { id: 'caller-123', role: UserRole.Supervisor, deletedAt: null };
      const mockTargetSupervisor = { id: 'target-123', role: UserRole.Supervisor, fullName: 'Target Supervisor', deletedAt: null };
      const mockPsos = [{ id: 'pso-1', email: 'pso1@example.com', role: UserRole.Employee }];
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
      userRepository.findByEmail.mockResolvedValue(mockTargetSupervisor as any);
      userRepository.findBySupervisor.mockResolvedValue(mockPsos as any);
      const request = new TransferPsosRequest('caller-123', 'target@example.com');
      const result = await service.transferPsos(request);
      expect(result.movedCount).toBe(1);
    });

    it('should throw error when caller not a Supervisor', async () => {
      const mockCaller = { id: 'caller-123', role: UserRole.Employee, deletedAt: null };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
      const request = new TransferPsosRequest('caller-123', 'target@example.com');
      await expect(service.transferPsos(request)).rejects.toThrow('Only Supervisors may transfer PSOs');
    });

    it('should return message when no PSOs to transfer', async () => {
      const mockCaller = { id: 'caller-123', role: UserRole.Supervisor, deletedAt: null };
      const mockTargetSupervisor = { id: 'target-123', role: UserRole.Supervisor, deletedAt: null };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
      userRepository.findByEmail.mockResolvedValue(mockTargetSupervisor as any);
      userRepository.findBySupervisor.mockResolvedValue([]);
      const request = new TransferPsosRequest('caller-123', 'target@example.com');
      const result = await service.transferPsos(request);
      expect(result.movedCount).toBe(0);
    });
  });
});