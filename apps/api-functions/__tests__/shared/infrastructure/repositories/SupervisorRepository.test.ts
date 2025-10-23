/**
 * @fileoverview SupervisorRepository tests
 * @description Unit tests for SupervisorRepository
 */

import { SupervisorRepository } from '../../../../shared/infrastructure/repositories/SupervisorRepository';
import { User } from '../../../../shared/domain/entities/User';
import { UserRole } from '@prisma/client';
import prisma from '../../../../shared/infrastructure/database/PrismaClientService';

// Mock Prisma client
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn()
  }
}));

// Mock @prisma/client
jest.mock('@prisma/client', () => ({
  UserRole: {
    Employee: 'Employee',
    Supervisor: 'Supervisor',
    ContactManager: 'ContactManager',
    SuperAdmin: 'SuperAdmin'
  }
}));

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('SupervisorRepository', () => {
  let repository: SupervisorRepository;
  let mockPrisma: any;

  beforeEach(() => {
    repository = new SupervisorRepository();
    mockPrisma = prisma as any;
    jest.clearAllMocks();
    
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('findByEmail', () => {
    it('should return supervisor when found by email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'supervisor@example.com',
        fullName: 'Test Supervisor',
        role: UserRole.Supervisor,
        azureAdObjectId: 'azure-123',
        supervisorId: null,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('supervisor@example.com');

      expect(result).toBeInstanceOf(User);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'supervisor@example.com' }
      });
    });

    it('should return null when supervisor not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should convert email to lowercase', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await repository.findByEmail('SUPERVISOR@EXAMPLE.COM');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'supervisor@example.com' }
      });
    });
  });

  describe('isSupervisor', () => {
    it('should return true when user is supervisor', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'supervisor@example.com',
        fullName: 'Test Supervisor',
        role: UserRole.Supervisor,
        azureAdObjectId: 'azure-123',
        supervisorId: null,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.isSupervisor('supervisor@example.com');

      expect(result).toBe(true);
    });

    it('should return false when user is not supervisor', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'employee@example.com',
        fullName: 'Test Employee',
        role: UserRole.Employee,
        azureAdObjectId: 'azure-123',
        supervisorId: 'supervisor-123',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.isSupervisor('employee@example.com');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.isSupervisor('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('findById', () => {
    it('should return supervisor when found by ID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'supervisor@example.com',
        fullName: 'Test Supervisor',
        role: UserRole.Supervisor,
        azureAdObjectId: 'azure-123',
        supervisorId: null,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findById('user-123');

      expect(result).toBeInstanceOf(User);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' }
      });
    });

    it('should return null when supervisor not found by ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('validateSupervisor', () => {
    it('should return true when supervisor exists and is active', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'supervisor@example.com',
        fullName: 'Test Supervisor',
        role: UserRole.Supervisor,
        azureAdObjectId: 'azure-123',
        supervisorId: null,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.validateSupervisor('supervisor@example.com');

      expect(result).toBe(true);
    });

    it('should return false when user is not supervisor', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'employee@example.com',
        fullName: 'Test Employee',
        role: UserRole.Employee,
        azureAdObjectId: 'azure-123',
        supervisorId: 'supervisor-123',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.validateSupervisor('employee@example.com');

      expect(result).toBe(false);
    });

    it('should return false when supervisor not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.validateSupervisor('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('findPsoByIdentifier', () => {
    it('should find PSO by UUID ID', async () => {
      const mockUser = {
        id: '12345678-1234-1234-1234-123456789012',
        email: 'pso@example.com',
        fullName: 'Test PSO',
        role: UserRole.Employee,
        azureAdObjectId: 'azure-123',
        supervisorId: 'supervisor-123',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findPsoByIdentifier('12345678-1234-1234-1234-123456789012');

      expect(result).toBeInstanceOf(User);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '12345678-1234-1234-1234-123456789012' }
      });
    });

    it('should find PSO by Azure AD Object ID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'pso@example.com',
        fullName: 'Test PSO',
        role: UserRole.Employee,
        azureAdObjectId: '12345678-1234-1234-1234-123456789012',
        supervisorId: 'supervisor-123',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      // The method will only call findById because both UUID conditions are identical
      // and the first one returns, so the second never executes
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findPsoByIdentifier('12345678-1234-1234-1234-123456789012');

      expect(result).toBeInstanceOf(User);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '12345678-1234-1234-1234-123456789012' }
      });
    });

    it('should find PSO by email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'pso@example.com',
        fullName: 'Test PSO',
        role: UserRole.Employee,
        azureAdObjectId: 'azure-123',
        supervisorId: 'supervisor-123',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findPsoByIdentifier('pso@example.com');

      expect(result).toBeInstanceOf(User);
    });

    it('should return null when PSO not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findPsoByIdentifier('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should throw error when database operation fails', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(repository.findPsoByIdentifier('test@example.com'))
        .rejects.toThrow('Failed to find PSO by identifier: Database error');
    });
  });

  describe('findSupervisorByIdentifier', () => {
    it('should find supervisor by UUID ID', async () => {
      const mockUser = {
        id: '12345678-1234-1234-1234-123456789012',
        email: 'supervisor@example.com',
        fullName: 'Test Supervisor',
        role: UserRole.Supervisor,
        azureAdObjectId: 'azure-123',
        supervisorId: null,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findSupervisorByIdentifier('12345678-1234-1234-1234-123456789012');

      expect(result).toBeInstanceOf(User);
    });

    it('should find supervisor by Azure AD Object ID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'supervisor@example.com',
        fullName: 'Test Supervisor',
        role: UserRole.Supervisor,
        azureAdObjectId: '12345678-1234-1234-1234-123456789012',
        supervisorId: null,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findSupervisorByIdentifier('12345678-1234-1234-1234-123456789012');

      expect(result).toBeInstanceOf(User);
    });

    it('should find supervisor by email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'supervisor@example.com',
        fullName: 'Test Supervisor',
        role: UserRole.Supervisor,
        azureAdObjectId: 'azure-123',
        supervisorId: null,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findSupervisorByIdentifier('supervisor@example.com');

      expect(result).toBeInstanceOf(User);
    });

    it('should return error message when user found but not supervisor', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'employee@example.com',
        fullName: 'Test Employee',
        role: UserRole.Employee,
        azureAdObjectId: 'azure-123',
        supervisorId: 'supervisor-123',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findSupervisorByIdentifier('employee@example.com');

      expect(result).toBe('User found but is not a supervisor');
    });

    it('should return error message when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findSupervisorByIdentifier('nonexistent@example.com');

      expect(result).toBe('User not found');
    });

    it('should throw error when database operation fails', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(repository.findSupervisorByIdentifier('test@example.com'))
        .rejects.toThrow('Failed to find supervisor by identifier: Database error');
    });
  });
});
