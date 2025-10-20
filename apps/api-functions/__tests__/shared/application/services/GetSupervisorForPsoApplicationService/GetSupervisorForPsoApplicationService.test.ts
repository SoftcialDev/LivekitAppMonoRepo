/**
 * @fileoverview GetSupervisorForPsoApplicationService - unit tests
 * @summary Tests for GetSupervisorForPsoApplicationService functionality
 * @description Validates supervisor lookup operations, authorization, and business logic
 */

import { GetSupervisorForPsoApplicationService } from '../../../../../shared/application/services/GetSupervisorForPsoApplicationService';
import { GetSupervisorForPsoRequest } from '../../../../../shared/domain/value-objects/GetSupervisorForPsoRequest';
import { GetSupervisorForPsoResponse } from '../../../../../shared/domain/value-objects/GetSupervisorForPsoResponse';
import { GetSupervisorForPsoDomainService } from '../../../../../shared/domain/services/GetSupervisorForPsoDomainService';
import { IUserRepository } from '../../../../../shared/domain/interfaces/IUserRepository';
// Use string values directly instead of importing from Prisma

// Mock dependencies
const mockGetSupervisorForPsoDomainService: jest.Mocked<GetSupervisorForPsoDomainService> = {
  getSupervisorForPso: jest.fn()
} as any;

const mockUserRepository: jest.Mocked<IUserRepository> = {
  findByAzureAdObjectId: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAllUsers: jest.fn(),
  existsAndActive: jest.fn(),
  hasRole: jest.fn(),
  hasAnyRole: jest.fn(),
  isEmployee: jest.fn(),
  updateSupervisor: jest.fn(),
  createEmployee: jest.fn(),
  updateMultipleSupervisors: jest.fn(),
  findBySupervisor: jest.fn(),
  deleteUser: jest.fn(),
  upsertUser: jest.fn(),
  findByRoles: jest.fn(),
  findUsersWithUnassignedRole: jest.fn(),
  changeUserRole: jest.fn(),
  createContactManager: jest.fn(),
  createContactManagerProfile: jest.fn(),
  createContactManagerStatusHistory: jest.fn(),
  createSuperAdmin: jest.fn(),
  createSuperAdminAuditLog: jest.fn(),
  findContactManagerProfile: jest.fn(),
  deleteContactManagerProfile: jest.fn(),
  createContactManagerAuditLog: jest.fn(),
  findAllContactManagers: jest.fn(),
  findContactManagerProfileByUserId: jest.fn(),
  findAllSuperAdmins: jest.fn(),
  updateContactManagerStatus: jest.fn(),
  getPsosBySupervisor: jest.fn(),
  findByRolesWithSupervisor: jest.fn(),
  findUsersWithUnassignedRoleWithSupervisor: jest.fn()
};

describe('GetSupervisorForPsoApplicationService', () => {
  let service: GetSupervisorForPsoApplicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GetSupervisorForPsoApplicationService(
      mockGetSupervisorForPsoDomainService,
      mockUserRepository
    );
  });

  describe('constructor', () => {
    it('should create service with dependencies', () => {
      expect(service).toBeInstanceOf(GetSupervisorForPsoApplicationService);
    });
  });

  describe('getSupervisorForPso', () => {
    it('should throw error when caller is not found', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorForPsoRequest('pso-456');

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.getSupervisorForPso(callerId, request)).rejects.toThrow('Caller not found');

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorForPsoDomainService.getSupervisorForPso).not.toHaveBeenCalled();
    });

    it('should allow employee to query their own supervisor', async () => {
      const callerId = 'employee-123';
      const request = new GetSupervisorForPsoRequest('employee-123');

      const caller = {
        id: 'employee-123',
        azureAdObjectId: 'employee-123',
        email: 'employee@example.com',
        role: 'Employee',
        supervisorId: 'supervisor-456'
      };

      const expectedResponse = new GetSupervisorForPsoResponse({
        id: 'supervisor-456',
        azureAdObjectId: 'supervisor-456',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetSupervisorForPsoDomainService.getSupervisorForPso.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorForPso(callerId, request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorForPsoDomainService.getSupervisorForPso).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should allow employee to query their own supervisor by email', async () => {
      const callerId = 'employee-123';
      const request = new GetSupervisorForPsoRequest('employee@example.com');

      const caller = {
        id: 'employee-123',
        azureAdObjectId: 'employee-123',
        email: 'employee@example.com',
        role: 'Employee',
        supervisorId: 'supervisor-456'
      };

      const expectedResponse = new GetSupervisorForPsoResponse({
        id: 'supervisor-456',
        azureAdObjectId: 'supervisor-456',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetSupervisorForPsoDomainService.getSupervisorForPso.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorForPso(callerId, request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorForPsoDomainService.getSupervisorForPso).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should throw error when employee tries to query other employee supervisor', async () => {
      const callerId = 'employee-123';
      const request = new GetSupervisorForPsoRequest('other-employee-456');

      const caller = {
        id: 'employee-123',
        azureAdObjectId: 'employee-123',
        email: 'employee@example.com',
        role: 'Employee',
        supervisorId: 'supervisor-456'
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);

      await expect(service.getSupervisorForPso(callerId, request)).rejects.toThrow('Employees can only query their own supervisor information');

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorForPsoDomainService.getSupervisorForPso).not.toHaveBeenCalled();
    });

    it('should allow supervisor to query supervisor for their assigned PSO', async () => {
      const callerId = 'supervisor-123';
      const request = new GetSupervisorForPsoRequest('pso-456');

      const caller = {
        id: 'supervisor-123',
        azureAdObjectId: 'supervisor-123',
        email: 'supervisor@example.com',
        role: 'Supervisor'
      };

      const pso = {
        id: 'pso-456',
        azureAdObjectId: 'pso-456',
        email: 'pso@example.com',
        role: 'Employee',
        supervisorId: 'supervisor-123'
      };

      const expectedResponse = new GetSupervisorForPsoResponse({
        id: 'supervisor-123',
        azureAdObjectId: 'supervisor-123',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValueOnce(caller as any);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValueOnce(pso as any);
      mockGetSupervisorForPsoDomainService.getSupervisorForPso.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorForPso(callerId, request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorForPsoDomainService.getSupervisorForPso).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should throw error when supervisor tries to query supervisor for unassigned PSO', async () => {
      const callerId = 'supervisor-123';
      const request = new GetSupervisorForPsoRequest('other-pso-456');

      const caller = {
        id: 'supervisor-123',
        azureAdObjectId: 'supervisor-123',
        email: 'supervisor@example.com',
        role: 'Supervisor'
      };

      const pso = {
        id: 'other-pso-456',
        azureAdObjectId: 'other-pso-456',
        email: 'other-pso@example.com',
        role: 'Employee',
        supervisorId: 'other-supervisor-789'
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValueOnce(caller as any);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValueOnce(pso as any);

      await expect(service.getSupervisorForPso(callerId, request)).rejects.toThrow('Supervisors can only query supervisor information for their assigned PSOs');

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorForPsoDomainService.getSupervisorForPso).not.toHaveBeenCalled();
    });

    it('should allow admin to query any supervisor information', async () => {
      const callerId = 'admin-123';
      const request = new GetSupervisorForPsoRequest('pso-456');

      const caller = {
        id: 'admin-123',
        azureAdObjectId: 'admin-123',
        email: 'admin@example.com',
        role: 'Admin'
      };

      const expectedResponse = new GetSupervisorForPsoResponse({
        id: 'supervisor-456',
        azureAdObjectId: 'supervisor-456',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetSupervisorForPsoDomainService.getSupervisorForPso.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorForPso(callerId, request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorForPsoDomainService.getSupervisorForPso).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should allow super admin to query any supervisor information', async () => {
      const callerId = 'superadmin-123';
      const request = new GetSupervisorForPsoRequest('pso-456');

      const caller = {
        id: 'superadmin-123',
        azureAdObjectId: 'superadmin-123',
        email: 'superadmin@example.com',
        role: 'SuperAdmin'
      };

      const expectedResponse = new GetSupervisorForPsoResponse({
        id: 'supervisor-456',
        azureAdObjectId: 'supervisor-456',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetSupervisorForPsoDomainService.getSupervisorForPso.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorForPso(callerId, request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorForPsoDomainService.getSupervisorForPso).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should throw error for contact manager role', async () => {
      const callerId = 'contactmanager-123';
      const request = new GetSupervisorForPsoRequest('pso-456');

      const caller = {
        id: 'contactmanager-123',
        azureAdObjectId: 'contactmanager-123',
        email: 'contactmanager@example.com',
        role: 'ContactManager'
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);

      await expect(service.getSupervisorForPso(callerId, request)).rejects.toThrow('Insufficient privileges to access supervisor information');

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetSupervisorForPsoDomainService.getSupervisorForPso).not.toHaveBeenCalled();
    });

    it('should handle supervisor querying by email', async () => {
      const callerId = 'supervisor-123';
      const request = new GetSupervisorForPsoRequest('pso@example.com');

      const caller = {
        id: 'supervisor-123',
        azureAdObjectId: 'supervisor-123',
        email: 'supervisor@example.com',
        role: 'Supervisor'
      };

      const pso = {
        id: 'pso-456',
        azureAdObjectId: 'pso-456',
        email: 'pso@example.com',
        role: 'Employee',
        supervisorId: 'supervisor-123'
      };

      const expectedResponse = new GetSupervisorForPsoResponse({
        id: 'supervisor-123',
        azureAdObjectId: 'supervisor-123',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValueOnce(caller as any);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValueOnce(null);
      mockUserRepository.findByEmail.mockResolvedValue(pso as any);
      mockGetSupervisorForPsoDomainService.getSupervisorForPso.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorForPso(callerId, request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('pso@example.com');
      expect(mockGetSupervisorForPsoDomainService.getSupervisorForPso).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should handle supervisor querying by ID', async () => {
      const callerId = 'supervisor-123';
      const request = new GetSupervisorForPsoRequest('pso-456');

      const caller = {
        id: 'supervisor-123',
        azureAdObjectId: 'supervisor-123',
        email: 'supervisor@example.com',
        role: 'Supervisor'
      };

      const pso = {
        id: 'pso-456',
        azureAdObjectId: 'pso-456',
        email: 'pso@example.com',
        role: 'Employee',
        supervisorId: 'supervisor-123'
      };

      const expectedResponse = new GetSupervisorForPsoResponse({
        id: 'supervisor-123',
        azureAdObjectId: 'supervisor-123',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValueOnce(caller as any);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValueOnce(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValue(pso as any);
      mockGetSupervisorForPsoDomainService.getSupervisorForPso.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorForPso(callerId, request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('pso-456');
      expect(mockGetSupervisorForPsoDomainService.getSupervisorForPso).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });
  });

  describe('error handling', () => {
    it('should handle user repository errors', async () => {
      const callerId = 'user-123';
      const request = new GetSupervisorForPsoRequest('pso-456');

      mockUserRepository.findByAzureAdObjectId.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getSupervisorForPso(callerId, request)).rejects.toThrow('Database connection failed');
    });

    it('should handle domain service errors', async () => {
      const callerId = 'admin-123';
      const request = new GetSupervisorForPsoRequest('pso-456');

      const caller = {
        id: 'admin-123',
        azureAdObjectId: 'admin-123',
        email: 'admin@example.com',
        role: 'Admin'
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetSupervisorForPsoDomainService.getSupervisorForPso.mockRejectedValue(new Error('Domain service error'));

      await expect(service.getSupervisorForPso(callerId, request)).rejects.toThrow('Domain service error');
    });
  });

  describe('edge cases', () => {
    it('should handle supervisor not found for PSO', async () => {
      const callerId = 'employee-123';
      const request = new GetSupervisorForPsoRequest('employee-123');

      const caller = {
        id: 'employee-123',
        azureAdObjectId: 'employee-123',
        email: 'employee@example.com',
        role: 'Employee',
        supervisorId: null
      };

      const expectedResponse = new GetSupervisorForPsoResponse(undefined, 'No supervisor assigned');

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetSupervisorForPsoDomainService.getSupervisorForPso.mockResolvedValue(expectedResponse);

      const result = await service.getSupervisorForPso(callerId, request);

      expect(result).toBe(expectedResponse);
      expect(result.supervisor).toBeUndefined();
    });

    it('should handle PSO not found for supervisor', async () => {
      const callerId = 'supervisor-123';
      const request = new GetSupervisorForPsoRequest('non-existent-pso');

      const caller = {
        id: 'supervisor-123',
        azureAdObjectId: 'supervisor-123',
        email: 'supervisor@example.com',
        role: 'Supervisor'
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValueOnce(caller as any);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValueOnce(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.getSupervisorForPso(callerId, request)).rejects.toThrow('Supervisors can only query supervisor information for their assigned PSOs');
    });
  });
});
