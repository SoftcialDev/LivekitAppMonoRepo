/**
 * @fileoverview GetPsosBySupervisorApplicationService - unit tests
 * @summary Tests for GetPsosBySupervisorApplicationService functionality
 * @description Validates PSOs lookup operations, authorization, and business logic
 */

import { GetPsosBySupervisorApplicationService } from '../../../../../shared/application/services/GetPsosBySupervisorApplicationService';
import { GetPsosBySupervisorRequest } from '../../../../../shared/domain/value-objects/GetPsosBySupervisorRequest';
import { GetPsosBySupervisorResponse } from '../../../../../shared/domain/value-objects/GetPsosBySupervisorResponse';
import { GetPsosBySupervisorDomainService } from '../../../../../shared/domain/services/GetPsosBySupervisorDomainService';
import { IUserRepository } from '../../../../../shared/domain/interfaces/IUserRepository';
import { UserRole } from '../../../../../shared/domain/enums/UserRole';

// Mock dependencies
const mockGetPsosBySupervisorDomainService: jest.Mocked<GetPsosBySupervisorDomainService> = {
  getPsosBySupervisor: jest.fn()
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

describe('GetPsosBySupervisorApplicationService', () => {
  let service: GetPsosBySupervisorApplicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GetPsosBySupervisorApplicationService(
      mockGetPsosBySupervisorDomainService,
      mockUserRepository
    );
  });

  describe('constructor', () => {
    it('should create service with dependencies', () => {
      expect(service).toBeInstanceOf(GetPsosBySupervisorApplicationService);
    });
  });

  describe('getPsosBySupervisor', () => {
    it('should throw error when caller is not found', async () => {
      const callerId = 'user-123';
      const request = new GetPsosBySupervisorRequest(callerId, 'supervisor-456');

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.getPsosBySupervisor(callerId, request)).rejects.toThrow('Caller not found');

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetPsosBySupervisorDomainService.getPsosBySupervisor).not.toHaveBeenCalled();
    });

    it('should allow supervisor to query their own PSOs when no supervisorId provided', async () => {
      const callerId = 'supervisor-123';
      const request = new GetPsosBySupervisorRequest(callerId, undefined);

      const caller = {
        id: 'supervisor-123',
        azureAdObjectId: callerId,
        role: UserRole.Supervisor,
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      };

      const expectedResponse = new GetPsosBySupervisorResponse([
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor Name'
        },
        {
          email: 'pso2@example.com',
          supervisorName: 'Supervisor Name'
        }
      ]);

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetPsosBySupervisorDomainService.getPsosBySupervisor.mockResolvedValue(expectedResponse);

      const result = await service.getPsosBySupervisor(callerId, request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetPsosBySupervisorDomainService.getPsosBySupervisor).toHaveBeenCalledWith(
        expect.objectContaining({
          callerId: callerId,
          supervisorId: caller.id
        })
      );
      expect(result).toBe(expectedResponse);
    });

    it('should allow supervisor to query their own PSOs when supervisorId matches their ID', async () => {
      const callerId = 'supervisor-123';
      const request = new GetPsosBySupervisorRequest(callerId, 'supervisor-123');

      const caller = {
        id: 'supervisor-123',
        azureAdObjectId: callerId,
        role: UserRole.Supervisor,
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      };

      const expectedResponse = new GetPsosBySupervisorResponse([
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor Name'
        }
      ]);

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetPsosBySupervisorDomainService.getPsosBySupervisor.mockResolvedValue(expectedResponse);

      const result = await service.getPsosBySupervisor(callerId, request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetPsosBySupervisorDomainService.getPsosBySupervisor).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should allow supervisor to query their own PSOs when supervisorId matches their azureAdObjectId', async () => {
      const callerId = 'supervisor-123';
      const request = new GetPsosBySupervisorRequest(callerId, 'supervisor-123');

      const caller = {
        id: 'supervisor-123',
        azureAdObjectId: 'supervisor-123',
        role: UserRole.Supervisor,
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      };

      const expectedResponse = new GetPsosBySupervisorResponse([]);

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetPsosBySupervisorDomainService.getPsosBySupervisor.mockResolvedValue(expectedResponse);

      const result = await service.getPsosBySupervisor(callerId, request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetPsosBySupervisorDomainService.getPsosBySupervisor).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should allow supervisor to query other supervisors PSOs', async () => {
      const callerId = 'supervisor-123';
      const request = new GetPsosBySupervisorRequest(callerId, 'other-supervisor-456');

      const caller = {
        id: 'supervisor-123',
        azureAdObjectId: callerId,
        role: UserRole.Supervisor,
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      };

      const expectedResponse = new GetPsosBySupervisorResponse([
        {
          email: 'pso3@example.com',
          supervisorName: 'Supervisor Name'
        }
      ]);

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetPsosBySupervisorDomainService.getPsosBySupervisor.mockResolvedValue(expectedResponse);

      const result = await service.getPsosBySupervisor(callerId, request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetPsosBySupervisorDomainService.getPsosBySupervisor).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should allow admin to query all PSOs', async () => {
      const callerId = 'admin-123';
      const request = new GetPsosBySupervisorRequest(callerId, 'supervisor-456');

      const caller = {
        id: 'admin-123',
        azureAdObjectId: callerId,
        role: UserRole.Admin,
        email: 'admin@example.com',
        fullName: 'Admin Name'
      };

      const expectedResponse = new GetPsosBySupervisorResponse([
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor A'
        },
        {
          email: 'pso2@example.com',
          supervisorName: 'Supervisor B'
        }
      ]);

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetPsosBySupervisorDomainService.getPsosBySupervisor.mockResolvedValue(expectedResponse);

      const result = await service.getPsosBySupervisor(callerId, request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetPsosBySupervisorDomainService.getPsosBySupervisor).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should allow super admin to query all PSOs', async () => {
      const callerId = 'superadmin-123';
      const request = new GetPsosBySupervisorRequest(callerId, undefined);

      const caller = {
        id: 'superadmin-123',
        azureAdObjectId: callerId,
        role: UserRole.SuperAdmin,
        email: 'superadmin@example.com',
        fullName: 'Super Admin Name'
      };

      const expectedResponse = new GetPsosBySupervisorResponse([
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor Name'
        }
      ]);

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetPsosBySupervisorDomainService.getPsosBySupervisor.mockResolvedValue(expectedResponse);

      const result = await service.getPsosBySupervisor(callerId, request);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetPsosBySupervisorDomainService.getPsosBySupervisor).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should throw error for insufficient privileges', async () => {
      const callerId = 'employee-123';
      const request = new GetPsosBySupervisorRequest(callerId, 'supervisor-456');

      const caller = {
        id: 'employee-123',
        azureAdObjectId: callerId,
        role: UserRole.Employee,
        email: 'employee@example.com',
        fullName: 'Employee Name'
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);

      await expect(service.getPsosBySupervisor(callerId, request)).rejects.toThrow('Insufficient privileges to access PSOs');

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetPsosBySupervisorDomainService.getPsosBySupervisor).not.toHaveBeenCalled();
    });

    it('should throw error for contact manager role', async () => {
      const callerId = 'contactmanager-123';
      const request = new GetPsosBySupervisorRequest(callerId, 'supervisor-456');

      const caller = {
        id: 'contactmanager-123',
        azureAdObjectId: callerId,
        role: UserRole.ContactManager,
        email: 'contactmanager@example.com',
        fullName: 'Contact Manager Name'
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);

      await expect(service.getPsosBySupervisor(callerId, request)).rejects.toThrow('Insufficient privileges to access PSOs');

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockGetPsosBySupervisorDomainService.getPsosBySupervisor).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle user repository errors', async () => {
      const callerId = 'user-123';
      const request = new GetPsosBySupervisorRequest(callerId, 'supervisor-456');

      mockUserRepository.findByAzureAdObjectId.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getPsosBySupervisor(callerId, request)).rejects.toThrow('Database connection failed');
    });

    it('should handle domain service errors', async () => {
      const callerId = 'admin-123';
      const request = new GetPsosBySupervisorRequest(callerId, 'supervisor-456');

      const caller = {
        id: 'admin-123',
        azureAdObjectId: callerId,
        role: UserRole.Admin,
        email: 'admin@example.com',
        fullName: 'Admin Name'
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetPsosBySupervisorDomainService.getPsosBySupervisor.mockRejectedValue(new Error('Domain service error'));

      await expect(service.getPsosBySupervisor(callerId, request)).rejects.toThrow('Domain service error');
    });
  });

  describe('edge cases', () => {
    it('should handle empty PSOs response', async () => {
      const callerId = 'supervisor-123';
      const request = new GetPsosBySupervisorRequest(callerId, undefined);

      const caller = {
        id: 'supervisor-123',
        azureAdObjectId: callerId,
        role: UserRole.Supervisor,
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name'
      };

      const expectedResponse = new GetPsosBySupervisorResponse([]);

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetPsosBySupervisorDomainService.getPsosBySupervisor.mockResolvedValue(expectedResponse);

      const result = await service.getPsosBySupervisor(callerId, request);

      expect(result).toBe(expectedResponse);
      expect(result.psos).toHaveLength(0);
    });

    it('should handle large PSOs response', async () => {
      const callerId = 'admin-123';
      const request = new GetPsosBySupervisorRequest(callerId, 'supervisor-456');

      const caller = {
        id: 'admin-123',
        azureAdObjectId: callerId,
        role: UserRole.Admin,
        email: 'admin@example.com',
        fullName: 'Admin Name'
      };

      const psos = Array.from({ length: 100 }, (_, i) => ({
        email: `pso${i}@example.com`,
        supervisorName: `Supervisor ${i}`
      }));

      const expectedResponse = new GetPsosBySupervisorResponse(psos);

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(caller as any);
      mockGetPsosBySupervisorDomainService.getPsosBySupervisor.mockResolvedValue(expectedResponse);

      const result = await service.getPsosBySupervisor(callerId, request);

      expect(result).toBe(expectedResponse);
      expect(result.psos).toHaveLength(100);
    });
  });
});
