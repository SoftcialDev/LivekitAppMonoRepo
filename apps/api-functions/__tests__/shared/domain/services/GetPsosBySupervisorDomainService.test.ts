import { GetPsosBySupervisorDomainService } from '../../../../shared/domain/services/GetPsosBySupervisorDomainService';
import { GetPsosBySupervisorRequest } from '../../../../shared/domain/value-objects/GetPsosBySupervisorRequest';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';

describe('GetPsosBySupervisorDomainService', () => {
  let service: GetPsosBySupervisorDomainService;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = { getPsosBySupervisor: jest.fn() } as any;
    service = new GetPsosBySupervisorDomainService(userRepository);
  });

  describe('getPsosBySupervisor', () => {
    it('should return PSOs when found', async () => {
      const mockPsos = [{ id: 'pso1', email: 'pso1@example.com', fullName: 'PSO One' }];
      userRepository.getPsosBySupervisor.mockResolvedValue(mockPsos as any);
      const request = new GetPsosBySupervisorRequest('caller-123', 'supervisor-123');
      const result = await service.getPsosBySupervisor(request);
      expect(userRepository.getPsosBySupervisor).toHaveBeenCalledWith('supervisor-123');
      expect(result.psos).toHaveLength(1);
    });

    it('should return empty array when no PSOs found', async () => {
      userRepository.getPsosBySupervisor.mockResolvedValue([]);
      const request = new GetPsosBySupervisorRequest('caller-123', 'supervisor-123');
      const result = await service.getPsosBySupervisor(request);
      expect(result.psos).toHaveLength(0);
    });

    it('should throw error when repository fails', async () => {
      userRepository.getPsosBySupervisor.mockRejectedValue(new Error('Database error'));
      const request = new GetPsosBySupervisorRequest('caller-123', 'supervisor-123');
      await expect(service.getPsosBySupervisor(request)).rejects.toThrow('Failed to get PSOs: Database error');
    });
  });
});
