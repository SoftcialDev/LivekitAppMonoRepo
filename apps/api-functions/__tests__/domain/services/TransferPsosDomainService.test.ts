import { TransferPsosDomainService } from '../../../src/domain/services/TransferPsosDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { ICommandMessagingService } from '../../../src/domain/interfaces/ICommandMessagingService';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { TransferPsosRequest } from '../../../src/domain/value-objects/TransferPsosRequest';
import { TransferPsosResponse } from '../../../src/domain/value-objects/TransferPsosResponse';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { ValidationError } from '../../../src/domain/errors/DomainError';
import { createMockUserRepository, createMockCommandMessagingService, createMockWebPubSubService, createMockUser, createMockSupervisor } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';

describe('TransferPsosDomainService', () => {
  let service: TransferPsosDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockCommandMessagingService: jest.Mocked<ICommandMessagingService>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockCommandMessagingService = createMockCommandMessagingService();
    mockWebPubSubService = createMockWebPubSubService();
    service = new TransferPsosDomainService(
      mockUserRepository,
      mockCommandMessagingService,
      mockWebPubSubService
    );
  });

  describe('transferPsos', () => {
    it('should transfer PSOs successfully', async () => {
      const request = new TransferPsosRequest('caller-id', 'newsupervisor@example.com');
      const caller = createMockSupervisor({
        id: 'caller-id',
        azureAdObjectId: 'caller-id',
        email: 'caller@example.com',
        fullName: 'Caller Supervisor',
      });
      const targetSupervisor = createMockSupervisor({
        id: 'target-id',
        email: 'newsupervisor@example.com',
        fullName: 'New Supervisor',
      });
      const pso1 = createMockUser({
        id: 'pso-1',
        email: 'pso1@example.com',
        fullName: 'PSO One',
        role: UserRole.PSO,
      });
      const pso2 = createMockUser({
        id: 'pso-2',
        email: 'pso2@example.com',
        fullName: 'PSO Two',
        role: UserRole.PSO,
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockUserRepository.findByEmail.mockResolvedValue(targetSupervisor);
      mockUserRepository.findBySupervisor.mockResolvedValue([pso1, pso2]);
      mockUserRepository.updateMultipleSupervisors.mockResolvedValue(undefined);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastSupervisorChangeNotification.mockResolvedValue(undefined);

      const result = await service.transferPsos(request);

      expect(mockUserRepository.updateMultipleSupervisors).toHaveBeenCalledWith([
        { email: 'pso1@example.com', supervisorId: 'target-id' },
        { email: 'pso2@example.com', supervisorId: 'target-id' },
      ]);
      expect(result.movedCount).toBe(2);
      expect(result.message).toContain('2 PSO(s)');
    });

    it('should throw error when caller not found', async () => {
      const request = new TransferPsosRequest('caller-id', 'newsupervisor@example.com');

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.transferPsos(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw error when caller is not a Supervisor', async () => {
      const request = new TransferPsosRequest('caller-id', 'newsupervisor@example.com');
      const caller = createMockUser({
        id: 'caller-id',
        azureAdObjectId: 'caller-id',
        role: UserRole.PSO,
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);

      await expect(service.transferPsos(request)).rejects.toThrow(ValidationError);
    });

    it('should throw error when target supervisor not found', async () => {
      const request = new TransferPsosRequest('caller-id', 'newsupervisor@example.com');
      const caller = createMockSupervisor({
        id: 'caller-id',
        azureAdObjectId: 'caller-id',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.transferPsos(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should return zero when no PSOs to transfer', async () => {
      const request = new TransferPsosRequest('caller-id', 'newsupervisor@example.com');
      const caller = createMockSupervisor({
        id: 'caller-id',
        azureAdObjectId: 'caller-id',
      });
      const targetSupervisor = createMockSupervisor({
        id: 'target-id',
        email: 'newsupervisor@example.com',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller);
      mockUserRepository.findByEmail.mockResolvedValue(targetSupervisor);
      mockUserRepository.findBySupervisor.mockResolvedValue([]);

      const result = await service.transferPsos(request);

      expect(result.movedCount).toBe(0);
      expect(result.message).toContain('No PSOs to transfer');
    });
  });
});





