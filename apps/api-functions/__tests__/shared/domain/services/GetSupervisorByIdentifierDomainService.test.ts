import { GetSupervisorByIdentifierDomainService } from '../../../../shared/domain/services/GetSupervisorByIdentifierDomainService';
import { GetSupervisorByIdentifierRequest } from '../../../../shared/domain/value-objects/GetSupervisorByIdentifierRequest';
import { ISupervisorRepository } from '../../../../shared/domain/interfaces/ISupervisorRepository';

describe('GetSupervisorByIdentifierDomainService', () => {
  let service: GetSupervisorByIdentifierDomainService;
  let supervisorRepository: jest.Mocked<ISupervisorRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    supervisorRepository = { findSupervisorByIdentifier: jest.fn() } as any;
    service = new GetSupervisorByIdentifierDomainService(supervisorRepository);
  });

  describe('getSupervisorByIdentifier', () => {
    it('should return supervisor when found', async () => {
      const mockSupervisor = { id: 'sup-123', azureAdObjectId: 'azure-123', email: 'supervisor@example.com', fullName: 'Test Supervisor' };
      supervisorRepository.findSupervisorByIdentifier.mockResolvedValue(mockSupervisor as any);
      const request = new GetSupervisorByIdentifierRequest('identifier-123');
      const result = await service.getSupervisorByIdentifier(request);
      expect(result.supervisor).toBeDefined();
      expect(result.supervisor?.email).toBe('supervisor@example.com');
    });

    it('should return message when no supervisor assigned', async () => {
      supervisorRepository.findSupervisorByIdentifier.mockResolvedValue('No supervisor assigned');
      const request = new GetSupervisorByIdentifierRequest('identifier-123');
      const result = await service.getSupervisorByIdentifier(request);
      expect(result.message).toBe('No supervisor assigned');
      expect(result.supervisor).toBeUndefined();
    });

    it('should return message when user is not a supervisor', async () => {
      supervisorRepository.findSupervisorByIdentifier.mockResolvedValue('User found but is not a supervisor');
      const request = new GetSupervisorByIdentifierRequest('identifier-123');
      const result = await service.getSupervisorByIdentifier(request);
      expect(result.message).toBe('User found but is not a supervisor');
    });

    it('should handle repository exceptions', async () => {
      supervisorRepository.findSupervisorByIdentifier.mockRejectedValue(new Error('Database error'));
      const request = new GetSupervisorByIdentifierRequest('identifier-123');
      const result = await service.getSupervisorByIdentifier(request);
      expect(result.message).toContain('Failed to find supervisor');
    });
  });
});
