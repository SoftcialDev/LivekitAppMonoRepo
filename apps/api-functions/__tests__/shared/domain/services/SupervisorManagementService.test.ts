// Mock Prisma enums using centralized mock
jest.mock('@prisma/client', () => require('../../../mocks/prisma-enums').PrismaMock);

import { SupervisorManagementService } from '../../../../shared/domain/services/SupervisorManagementService';
import { SupervisorAssignment } from '../../../../shared/domain/value-objects/SupervisorAssignment';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { ISupervisorRepository } from '../../../../shared/domain/interfaces/ISupervisorRepository';
import { ValidationError } from '../../../../shared/domain/errors/DomainError';
import { UserRole } from '@prisma/client';

describe('SupervisorManagementService', () => {
  let service: SupervisorManagementService;
  let userRepository: jest.Mocked<IUserRepository>;
  let supervisorRepository: jest.Mocked<ISupervisorRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = { findByEmail: jest.fn(), updateMultipleSupervisors: jest.fn(), updateSupervisor: jest.fn() } as any;
    supervisorRepository = { findByEmail: jest.fn() } as any;
    service = new SupervisorManagementService(userRepository, supervisorRepository);
  });

  describe('changeUserSupervisor', () => {
    it('should update users with new supervisor', async () => {
      const mockUser = { id: 'user-123', email: 'employee@example.com', role: UserRole.Employee };
      const mockSupervisor = { id: 'supervisor-123', email: 'supervisor@example.com', role: UserRole.Supervisor };
      userRepository.findByEmail.mockImplementation(async (email: string) => {
        if (email === 'employee@example.com') return mockUser as any;
        if (email === 'supervisor@example.com') return mockSupervisor as any;
        return null;
      });
      supervisorRepository.findByEmail.mockResolvedValue(mockSupervisor as any);
      userRepository.updateSupervisor.mockResolvedValue(undefined);
      const assignment = SupervisorAssignment.fromRequest({ userEmails: ['employee@example.com'], newSupervisorEmail: 'supervisor@example.com' });
      const result = await service.changeUserSupervisor(assignment);
      expect(result.updatedCount).toBeGreaterThan(0);
    });

    it('should skip users with non-Employee roles', async () => {
      const mockAdmin = { id: 'admin-123', email: 'admin@example.com', role: UserRole.Admin };
      userRepository.findByEmail.mockResolvedValue(mockAdmin as any);
      const assignment = SupervisorAssignment.fromRequest({ userEmails: ['admin@example.com'], newSupervisorEmail: 'supervisor@example.com' });
      const result = await service.changeUserSupervisor(assignment);
      expect(result.skippedCount).toBe(1);
    });
  });

  describe('validateSupervisorAssignment', () => {
    it('should return null for unassign operation', async () => {
      const result = await service.validateSupervisorAssignment(null);
      expect(result).toBeNull();
    });

    it('should return supervisor ID when valid', async () => {
      const mockSupervisor = { id: 'sup-123', role: UserRole.Supervisor, deletedAt: null };
      supervisorRepository.findByEmail.mockResolvedValue(mockSupervisor as any);
      const result = await service.validateSupervisorAssignment('supervisor@example.com');
      expect(result).toBe('sup-123');
    });

    it('should throw ValidationError when supervisor not found', async () => {
      supervisorRepository.findByEmail.mockResolvedValue(null);
      await expect(service.validateSupervisorAssignment('supervisor@example.com')).rejects.toThrow(ValidationError);
    });
  });
});