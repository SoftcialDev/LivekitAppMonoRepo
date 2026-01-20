import { GetPsosBySupervisorDomainService } from '../../../src/domain/services/GetPsosBySupervisorDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { GetPsosBySupervisorRequest } from '../../../src/domain/value-objects/GetPsosBySupervisorRequest';
import { GetPsosBySupervisorResponse } from '../../../src/domain/value-objects/GetPsosBySupervisorResponse';
import { ApplicationError } from '../../../src/domain/errors/DomainError';
import { createMockUserRepository } from './domainServiceTestSetup';

describe('GetPsosBySupervisorDomainService', () => {
  let service: GetPsosBySupervisorDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    service = new GetPsosBySupervisorDomainService(mockUserRepository);
  });

  describe('getPsosBySupervisor', () => {
    it('should successfully return PSOs when found', async () => {
      const request = new GetPsosBySupervisorRequest('caller-id', 'supervisor-id');
      const mockPsos = [
        { email: 'pso1@example.com', supervisorName: 'Supervisor One' },
        { email: 'pso2@example.com', supervisorName: 'Supervisor Two' },
      ];

      mockUserRepository.getPsosBySupervisor.mockResolvedValue(mockPsos);

      const result = await service.getPsosBySupervisor(request);

      expect(mockUserRepository.getPsosBySupervisor).toHaveBeenCalledWith('supervisor-id');
      expect(result.psos).toEqual(mockPsos);
      expect(result.psos).toHaveLength(2);
    });

    it('should successfully return empty array when no PSOs found', async () => {
      const request = new GetPsosBySupervisorRequest('caller-id', 'supervisor-id');

      mockUserRepository.getPsosBySupervisor.mockResolvedValue([]);

      const result = await service.getPsosBySupervisor(request);

      expect(result.psos).toEqual([]);
      expect(result.psos).toHaveLength(0);
    });

    it('should throw ApplicationError when repository throws error', async () => {
      const request = new GetPsosBySupervisorRequest('caller-id', 'supervisor-id');

      mockUserRepository.getPsosBySupervisor.mockRejectedValue(new Error('Database error'));

      await expect(service.getPsosBySupervisor(request)).rejects.toThrow(ApplicationError);
    });

    it('should handle request without supervisorId', async () => {
      const request = new GetPsosBySupervisorRequest('caller-id');
      const mockPsos = [
        { email: 'pso1@example.com', supervisorName: 'Supervisor One' },
      ];

      mockUserRepository.getPsosBySupervisor.mockResolvedValue(mockPsos);

      const result = await service.getPsosBySupervisor(request);

      expect(result.psos).toEqual(mockPsos);
    });
  });
});






