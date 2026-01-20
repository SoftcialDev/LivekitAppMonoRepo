import { GetSupervisorForPsoDomainService } from '../../../src/domain/services/GetSupervisorForPsoDomainService';
import { ISupervisorRepository } from '../../../src/domain/interfaces/ISupervisorRepository';
import { GetSupervisorForPsoRequest } from '../../../src/domain/value-objects/GetSupervisorForPsoRequest';
import { GetSupervisorForPsoResponse } from '../../../src/domain/value-objects/GetSupervisorForPsoResponse';
import { ApplicationError } from '../../../src/domain/errors/DomainError';
import { createMockSupervisorRepository, createMockUser, createMockSupervisor } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';

describe('GetSupervisorForPsoDomainService', () => {
  let service: GetSupervisorForPsoDomainService;
  let mockSupervisorRepository: jest.Mocked<ISupervisorRepository>;

  beforeEach(() => {
    mockSupervisorRepository = createMockSupervisorRepository();
    service = new GetSupervisorForPsoDomainService(mockSupervisorRepository);
  });

  describe('getSupervisorForPso', () => {
    it('should successfully return supervisor when PSO has supervisor', async () => {
      const request = new GetSupervisorForPsoRequest('pso-id');
      const pso = createMockUser({
        id: 'pso-id',
        email: 'pso@example.com',
        supervisorId: 'supervisor-id',
      });
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
      });

      mockSupervisorRepository.findPsoByIdentifier.mockResolvedValue(pso);
      mockSupervisorRepository.findById.mockResolvedValue(supervisor);

      const result = await service.getSupervisorForPso(request);

      expect(mockSupervisorRepository.findPsoByIdentifier).toHaveBeenCalledWith('pso-id');
      expect(mockSupervisorRepository.findById).toHaveBeenCalledWith('supervisor-id');
      expect(result.supervisor).toBeDefined();
      expect(result.supervisor?.id).toBe('supervisor-id');
      expect(result.supervisor?.email).toBe('supervisor@example.com');
    });

    it('should return error when PSO not found', async () => {
      const request = new GetSupervisorForPsoRequest('non-existent');

      mockSupervisorRepository.findPsoByIdentifier.mockResolvedValue(null);

      const result = await service.getSupervisorForPso(request);

      expect(result.error).toBe('PSO not found');
      expect(result.supervisor).toBeUndefined();
    });

    it('should return message when no supervisor assigned', async () => {
      const request = new GetSupervisorForPsoRequest('pso-id');
      const pso = createMockUser({
        id: 'pso-id',
        supervisorId: null,
      });

      mockSupervisorRepository.findPsoByIdentifier.mockResolvedValue(pso);

      const result = await service.getSupervisorForPso(request);

      expect(result.message).toBe('No supervisor assigned');
      expect(result.supervisor).toBeUndefined();
    });

    it('should return error when supervisor not found', async () => {
      const request = new GetSupervisorForPsoRequest('pso-id');
      const pso = createMockUser({
        id: 'pso-id',
        supervisorId: 'non-existent-supervisor',
      });

      mockSupervisorRepository.findPsoByIdentifier.mockResolvedValue(pso);
      mockSupervisorRepository.findById.mockResolvedValue(null);

      const result = await service.getSupervisorForPso(request);

      expect(result.error).toBe('Supervisor not found');
    });

    it('should return error when user found but is not a supervisor', async () => {
      const request = new GetSupervisorForPsoRequest('pso-id');
      const pso = createMockUser({
        id: 'pso-id',
        supervisorId: 'user-id',
      });
      const nonSupervisor = createMockUser({
        id: 'user-id',
        role: UserRole.PSO,
      });

      mockSupervisorRepository.findPsoByIdentifier.mockResolvedValue(pso);
      mockSupervisorRepository.findById.mockResolvedValue(nonSupervisor);

      const result = await service.getSupervisorForPso(request);

      expect(result.error).toBe('User found but is not a supervisor');
    });

    it('should throw ApplicationError when repository throws error', async () => {
      const request = new GetSupervisorForPsoRequest('pso-id');

      mockSupervisorRepository.findPsoByIdentifier.mockRejectedValue(new Error('Database error'));

      await expect(service.getSupervisorForPso(request)).rejects.toThrow(ApplicationError);
    });
  });
});






