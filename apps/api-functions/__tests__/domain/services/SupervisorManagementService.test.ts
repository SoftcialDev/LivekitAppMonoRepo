import { SupervisorManagementService } from '../../../src/domain/services/SupervisorManagementService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { ISupervisorRepository } from '../../../src/domain/interfaces/ISupervisorRepository';
import { SupervisorAssignment } from '../../../src/domain/value-objects/SupervisorAssignment';
import { SupervisorChangeResult } from '../../../src/domain/value-objects/SupervisorChangeResult';
import { SupervisorError, ValidationError } from '../../../src/domain/errors/DomainError';
import { createMockUserRepository, createMockSupervisorRepository, createMockUser, createMockSupervisor } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';

describe('SupervisorManagementService', () => {
  let service: SupervisorManagementService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockSupervisorRepository: jest.Mocked<ISupervisorRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockSupervisorRepository = createMockSupervisorRepository();
    service = new SupervisorManagementService(mockUserRepository, mockSupervisorRepository);
  });

  describe('changeUserSupervisor', () => {
    it('should change supervisor for multiple users successfully', async () => {
      const assignment = new SupervisorAssignment(['pso1@example.com', 'pso2@example.com'], 'supervisor@example.com', new Date());
      const mockSupervisor = createMockSupervisor({ id: 'supervisor-id', email: 'supervisor@example.com' });
      const mockPso1 = createMockUser({ id: 'pso1-id', email: 'pso1@example.com', role: UserRole.PSO });
      const mockPso2 = createMockUser({ id: 'pso2-id', email: 'pso2@example.com', role: UserRole.PSO });

      mockSupervisorRepository.findByEmail.mockResolvedValue(mockSupervisor);
      mockUserRepository.findByEmail
        .mockResolvedValueOnce(mockPso1)
        .mockResolvedValueOnce(mockPso2);
      mockUserRepository.updateSupervisor.mockResolvedValue(undefined);

      const result = await service.changeUserSupervisor(assignment);

      expect(result.updatedCount).toBe(2);
      expect(result.skippedCount).toBe(0);
    });

    it('should skip non-PSO users', async () => {
      const assignment = new SupervisorAssignment(['admin@example.com'], 'supervisor@example.com', new Date());
      const mockSupervisor = createMockSupervisor({ id: 'supervisor-id', email: 'supervisor@example.com' });
      const mockAdmin = createMockUser({ id: 'admin-id', email: 'admin@example.com', role: UserRole.Admin });

      mockSupervisorRepository.findByEmail.mockResolvedValue(mockSupervisor);
      mockUserRepository.findByEmail.mockResolvedValue(mockAdmin);

      const result = await service.changeUserSupervisor(assignment);

      expect(result.updatedCount).toBe(0);
      expect(result.skippedCount).toBe(1);
    });
  });

  describe('validateSupervisorAssignment', () => {
    it('should return null for unassign operation', async () => {
      const result = await service.validateSupervisorAssignment(null);
      expect(result).toBeNull();
    });

    it('should return supervisor ID for valid supervisor', async () => {
      const mockSupervisor = createMockSupervisor({ id: 'supervisor-id', email: 'supervisor@example.com' });
      mockSupervisorRepository.findByEmail.mockResolvedValue(mockSupervisor);

      const result = await service.validateSupervisorAssignment('supervisor@example.com');

      expect(result).toBe('supervisor-id');
    });

    it('should throw ValidationError when supervisor not found', async () => {
      mockSupervisorRepository.findByEmail.mockResolvedValue(null);

      await expect(service.validateSupervisorAssignment('notfound@example.com')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when supervisor is deleted', async () => {
      const mockSupervisor = createMockUser({ id: 'supervisor-id', email: 'supervisor@example.com', role: UserRole.Supervisor, deletedAt: new Date() });
      mockSupervisorRepository.findByEmail.mockResolvedValue(mockSupervisor);

      await expect(service.validateSupervisorAssignment('supervisor@example.com')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when target is not a Supervisor', async () => {
      const mockUser = createMockUser({ id: 'user-id', email: 'user@example.com', role: UserRole.PSO });
      mockSupervisorRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.validateSupervisorAssignment('user@example.com')).rejects.toThrow(ValidationError);
    });
  });

  describe('validateUsersForSupervisorChange', () => {
    it('should return valid user emails', async () => {
      const emails = ['pso1@example.com', 'pso2@example.com'];
      const mockPso1 = createMockUser({ id: 'pso1-id', email: 'pso1@example.com', role: UserRole.PSO });
      const mockPso2 = createMockUser({ id: 'pso2-id', email: 'pso2@example.com', role: UserRole.PSO });

      mockUserRepository.findByEmail
        .mockResolvedValueOnce(mockPso1)
        .mockResolvedValueOnce(mockPso2);

      const result = await service.validateUsersForSupervisorChange(emails);

      expect(result).toEqual(emails);
    });

    it('should include non-existent users', async () => {
      const emails = ['newuser@example.com'];
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await service.validateUsersForSupervisorChange(emails);

      expect(result).toEqual(emails);
    });

    it('should throw ValidationError for inactive users', async () => {
      const emails = ['inactive@example.com'];
      const mockUser = createMockUser({ id: 'user-id', email: 'inactive@example.com', deletedAt: new Date() });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.validateUsersForSupervisorChange(emails)).rejects.toThrow(ValidationError);
    });
  });

  describe('assignSupervisor', () => {
    it('should assign supervisor to PSOs successfully', async () => {
      const emails = ['pso1@example.com', 'pso2@example.com'];
      const supervisorEmail = 'supervisor@example.com';
      const mockSupervisor = createMockSupervisor({ id: 'supervisor-id', email: supervisorEmail });
      const mockPso1 = createMockUser({ id: 'pso1-id', email: 'pso1@example.com', role: UserRole.PSO, supervisorId: null });
      const mockPso2 = createMockUser({ id: 'pso2-id', email: 'pso2@example.com', role: UserRole.PSO, supervisorId: null });

      mockSupervisorRepository.findByEmail.mockResolvedValue(mockSupervisor);
      mockUserRepository.findByEmail
        .mockResolvedValueOnce(mockPso1)
        .mockResolvedValueOnce(mockPso2);
      mockUserRepository.updateMultipleSupervisors.mockResolvedValue(undefined);

      const result = await service.assignSupervisor(emails, supervisorEmail);

      expect(result.updatedCount).toBe(2);
      expect(result.skippedCount).toBe(0);
    });

    it('should skip users with same supervisor', async () => {
      const emails = ['pso1@example.com'];
      const supervisorEmail = 'supervisor@example.com';
      const mockSupervisor = createMockSupervisor({ id: 'supervisor-id', email: supervisorEmail });
      const mockPso = createMockUser({ id: 'pso1-id', email: 'pso1@example.com', role: UserRole.PSO, supervisorId: 'supervisor-id' });

      mockSupervisorRepository.findByEmail.mockResolvedValue(mockSupervisor);
      mockUserRepository.findByEmail.mockResolvedValue(mockPso);

      const result = await service.assignSupervisor(emails, supervisorEmail);

      expect(result.updatedCount).toBe(0);
      expect(result.skippedCount).toBe(1);
    });

    it('should throw SupervisorError when supervisor not found', async () => {
      mockSupervisorRepository.findByEmail.mockResolvedValue(null);

      await expect(service.assignSupervisor(['pso@example.com'], 'notfound@example.com')).rejects.toThrow(SupervisorError);
    });
  });
});

