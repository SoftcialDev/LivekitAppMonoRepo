import { GetSupervisorForPsoDomainService } from '../../../../shared/domain/services/GetSupervisorForPsoDomainService';
import { GetSupervisorForPsoRequest } from '../../../../shared/domain/value-objects/GetSupervisorForPsoRequest';
import { ISupervisorRepository } from '../../../../shared/domain/interfaces/ISupervisorRepository';

describe('GetSupervisorForPsoDomainService', () => {
  let service: GetSupervisorForPsoDomainService;
  let supervisorRepository: jest.Mocked<ISupervisorRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    supervisorRepository = { findPsoByIdentifier: jest.fn(), findById: jest.fn() } as any;
    service = new GetSupervisorForPsoDomainService(supervisorRepository);
  });

  describe('getSupervisorForPso', () => {
    it('should return supervisor when PSO has one assigned', async () => {
      const mockPso = { id: 'pso-123', email: 'pso@example.com', role: 'Employee', supervisorId: 'sup-123' };
      const mockSupervisor = { id: 'sup-123', azureAdObjectId: 'azure-123', email: 'supervisor@example.com', fullName: 'Test Supervisor', isSupervisor: () => true };
      supervisorRepository.findPsoByIdentifier.mockResolvedValue(mockPso as any);
      supervisorRepository.findById.mockResolvedValue(mockSupervisor as any);
      const request = new GetSupervisorForPsoRequest('pso-identifier');
      const result = await service.getSupervisorForPso(request);
      expect(result.supervisor).toBeDefined();
      expect(result.supervisor?.email).toBe('supervisor@example.com');
    });

    it('should return error when PSO not found', async () => {
      supervisorRepository.findPsoByIdentifier.mockResolvedValue(null);
      const request = new GetSupervisorForPsoRequest('pso-identifier');
      const result = await service.getSupervisorForPso(request);
      expect(result.error).toBe('PSO not found');
    });

    it('should return message when no supervisor assigned', async () => {
      const mockPso = { id: 'pso-123', email: 'pso@example.com', role: 'Employee', supervisorId: null };
      supervisorRepository.findPsoByIdentifier.mockResolvedValue(mockPso as any);
      const request = new GetSupervisorForPsoRequest('pso-identifier');
      const result = await service.getSupervisorForPso(request);
      expect(result.message).toBe('No supervisor assigned');
    });

    it('should return error when supervisor not found', async () => {
      const mockPso = { id: 'pso-123', email: 'pso@example.com', role: 'Employee', supervisorId: 'sup-123' };
      supervisorRepository.findPsoByIdentifier.mockResolvedValue(mockPso as any);
      supervisorRepository.findById.mockResolvedValue(null);
      const request = new GetSupervisorForPsoRequest('pso-identifier');
      const result = await service.getSupervisorForPso(request);
      expect(result.error).toBe('Supervisor not found');
    });

    it('should throw error when repository fails', async () => {
      supervisorRepository.findPsoByIdentifier.mockRejectedValue(new Error('Database error'));
      const request = new GetSupervisorForPsoRequest('pso-identifier');
      await expect(service.getSupervisorForPso(request)).rejects.toThrow('Failed to get supervisor: Database error');
    });
  });
});
