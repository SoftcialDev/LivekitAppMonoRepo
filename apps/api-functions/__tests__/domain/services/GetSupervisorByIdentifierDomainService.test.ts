import { GetSupervisorByIdentifierDomainService } from '../../../src/domain/services/GetSupervisorByIdentifierDomainService';
import { ISupervisorRepository } from '../../../src/domain/interfaces/ISupervisorRepository';
import { GetSupervisorByIdentifierRequest } from '../../../src/domain/value-objects/GetSupervisorByIdentifierRequest';
import { GetSupervisorByIdentifierResponse } from '../../../src/domain/value-objects/GetSupervisorByIdentifierResponse';
import { createMockSupervisorRepository, createMockSupervisor } from './domainServiceTestSetup';
import { User } from '../../../src/domain/entities/User';
import { UserRole } from '@prisma/client';

describe('GetSupervisorByIdentifierDomainService', () => {
  let service: GetSupervisorByIdentifierDomainService;
  let mockSupervisorRepository: jest.Mocked<ISupervisorRepository>;

  beforeEach(() => {
    mockSupervisorRepository = createMockSupervisorRepository();
    service = new GetSupervisorByIdentifierDomainService(mockSupervisorRepository);
  });

  describe('getSupervisorByIdentifier', () => {
    it('should successfully return supervisor when found', async () => {
      const request = new GetSupervisorByIdentifierRequest('supervisor-id');
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
      });

      mockSupervisorRepository.findSupervisorByIdentifier.mockResolvedValue(supervisor);

      const result = await service.getSupervisorByIdentifier(request);

      expect(mockSupervisorRepository.findSupervisorByIdentifier).toHaveBeenCalledWith('supervisor-id');
      expect(result.supervisor).toBeDefined();
      expect(result.supervisor?.id).toBe('supervisor-id');
      expect(result.supervisor?.email).toBe('supervisor@example.com');
      expect(result.supervisor?.fullName).toBe('Supervisor Name');
    });

    it('should return message when no supervisor assigned', async () => {
      const request = new GetSupervisorByIdentifierRequest('identifier');

      mockSupervisorRepository.findSupervisorByIdentifier.mockResolvedValue('No supervisor assigned');

      const result = await service.getSupervisorByIdentifier(request);

      expect(result.message).toBe('No supervisor assigned');
      expect(result.supervisor).toBeUndefined();
    });

    it('should return message when user found but is not a supervisor', async () => {
      const request = new GetSupervisorByIdentifierRequest('identifier');

      mockSupervisorRepository.findSupervisorByIdentifier.mockResolvedValue('User found but is not a supervisor');

      const result = await service.getSupervisorByIdentifier(request);

      expect(result.message).toBe('User found but is not a supervisor');
    });

    it('should return message when user not found', async () => {
      const request = new GetSupervisorByIdentifierRequest('identifier');

      mockSupervisorRepository.findSupervisorByIdentifier.mockResolvedValue('User not found');

      const result = await service.getSupervisorByIdentifier(request);

      expect(result.message).toBe('User not found');
    });

    it('should return generic error message for other error strings', async () => {
      const request = new GetSupervisorByIdentifierRequest('identifier');

      mockSupervisorRepository.findSupervisorByIdentifier.mockResolvedValue('Some other error');

      const result = await service.getSupervisorByIdentifier(request);

      expect(result.message).toBe('Some other error');
    });

    it('should handle repository errors gracefully', async () => {
      const request = new GetSupervisorByIdentifierRequest('identifier');

      mockSupervisorRepository.findSupervisorByIdentifier.mockRejectedValue(new Error('Database error'));

      const result = await service.getSupervisorByIdentifier(request);

      expect(result.message).toContain('Failed to find supervisor');
      expect(result.message).toContain('Database error');
    });
  });
});



