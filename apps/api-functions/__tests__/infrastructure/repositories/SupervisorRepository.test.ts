import { SupervisorRepository } from '../../../src/infrastructure/repositories/SupervisorRepository';
import { User } from '../../../src/domain/entities/User';
import { wrapPsoFetchError, wrapSupervisorFetchError } from '../../../src/utils/error/ErrorHelpers';
import { PsoFetchError, SupervisorFetchError } from '../../../src/domain/errors/RepositoryErrors';
import { createMockPrismaClient, mockDate } from '../../shared/mocks';

jest.mock('../../../src/utils/error/ErrorHelpers');
jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();
const mockWrapPsoFetchError = wrapPsoFetchError as jest.MockedFunction<typeof wrapPsoFetchError>;
const mockWrapSupervisorFetchError = wrapSupervisorFetchError as jest.MockedFunction<typeof wrapSupervisorFetchError>;

describe('SupervisorRepository', () => {
  let repository: SupervisorRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new SupervisorRepository();
  });

  describe('findByEmail', () => {
    it('should find a supervisor by email', async () => {
      const prismaUser = {
        id: 'user-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        role: 'Supervisor',
        azureAdObjectId: 'ad-id',
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.findByEmail('supervisor@example.com');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'supervisor@example.com' },
      });
      expect(result).toBeInstanceOf(User);
      expect(result?.email).toBe('supervisor@example.com');
    });

    it('should lowercase email when searching', async () => {
      const prismaUser = {
        id: 'user-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        role: 'Supervisor',
        azureAdObjectId: 'ad-id',
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      await repository.findByEmail('SUPERVISOR@EXAMPLE.COM');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'supervisor@example.com' },
      });
    });

    it('should return null when supervisor not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('isSupervisor', () => {
    it('should return true if user is a supervisor', async () => {
      const prismaUser = {
        id: 'user-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        role: 'Supervisor',
        azureAdObjectId: 'ad-id',
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.isSupervisor('supervisor@example.com');

      expect(result).toBe(true);
    });

    it('should return false if user is not a supervisor', async () => {
      const prismaUser = {
        id: 'user-id',
        email: 'pso@example.com',
        fullName: 'PSO Name',
        role: 'PSO',
        azureAdObjectId: 'ad-id',
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.isSupervisor('pso@example.com');

      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.isSupervisor('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('findById', () => {
    it('should find a supervisor by id', async () => {
      const prismaUser = {
        id: 'user-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        role: 'Supervisor',
        azureAdObjectId: 'ad-id',
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.findById('user-id');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe('user-id');
    });

    it('should return null when supervisor not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('validateSupervisor', () => {
    it('should return true if supervisor exists and is active', async () => {
      const prismaUser = {
        id: 'user-id',
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        role: 'Supervisor',
        azureAdObjectId: 'ad-id',
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.validateSupervisor('supervisor@example.com');

      expect(result).toBe(true);
    });

    it('should return false if user is not a supervisor', async () => {
      const prismaUser = {
        id: 'user-id',
        email: 'pso@example.com',
        fullName: 'PSO Name',
        role: 'PSO',
        azureAdObjectId: 'ad-id',
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.validateSupervisor('pso@example.com');

      expect(result).toBe(false);
    });
  });

  describe('findPsoByIdentifier', () => {
    it('should find PSO by UUID', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const prismaUser = {
        id: uuid,
        email: 'pso@example.com',
        fullName: 'PSO Name',
        role: 'PSO',
        azureAdObjectId: 'ad-id',
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.findPsoByIdentifier(uuid);

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: uuid },
      });
      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe(uuid);
    });

    it('should find PSO by email', async () => {
      const email = 'pso@example.com';
      const prismaUser = {
        id: 'user-id',
        email: email,
        fullName: 'PSO Name',
        role: 'PSO',
        azureAdObjectId: 'ad-id',
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.findPsoByIdentifier(email);

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: email.toLowerCase() },
      });
      expect(result).toBeInstanceOf(User);
    });

    it('should return null when PSO not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findPsoByIdentifier('non-existent');

      expect(result).toBeNull();
    });

    it('should throw PsoFetchError on error', async () => {
      const error = new Error('Database error');
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaClient.user.findUnique.mockRejectedValue(error);
      const wrappedError = new PsoFetchError('Failed to find PSO by identifier', error);
      mockWrapPsoFetchError.mockReturnValue(wrappedError);

      await expect(repository.findPsoByIdentifier(uuid)).rejects.toThrow();
      expect(mockWrapPsoFetchError).toHaveBeenCalledWith('Failed to find PSO by identifier', error);
    });
  });

  describe('findSupervisorByIdentifier', () => {
    it('should find supervisor by UUID', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const prismaUser = {
        id: uuid,
        email: 'supervisor@example.com',
        fullName: 'Supervisor Name',
        role: 'Supervisor',
        azureAdObjectId: 'ad-id',
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.findSupervisorByIdentifier(uuid);

      expect(result).toBeInstanceOf(User);
      expect((result as User).id).toBe(uuid);
    });

    it('should find supervisor by email', async () => {
      const email = 'supervisor@example.com';
      const prismaUser = {
        id: 'user-id',
        email: email,
        fullName: 'Supervisor Name',
        role: 'Supervisor',
        azureAdObjectId: 'ad-id',
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.findSupervisorByIdentifier(email);

      expect(result).toBeInstanceOf(User);
    });

    it('should return error message when user is not a supervisor', async () => {
      const prismaUser = {
        id: 'user-id',
        email: 'pso@example.com',
        fullName: 'PSO Name',
        role: 'PSO',
        azureAdObjectId: 'ad-id',
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.findSupervisorByIdentifier('pso@example.com');

      expect(result).toBe('User found but is not a supervisor');
    });

    it('should return error message when user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await repository.findSupervisorByIdentifier('non-existent');

      expect(result).toBe('User not found');
    });

    it('should throw SupervisorFetchError on error', async () => {
      const error = new Error('Database error');
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaClient.user.findUnique.mockRejectedValue(error);
      const wrappedError = new SupervisorFetchError('Failed to find supervisor by identifier', error);
      mockWrapSupervisorFetchError.mockReturnValue(wrappedError);

      await expect(repository.findSupervisorByIdentifier(uuid)).rejects.toThrow();
      expect(mockWrapSupervisorFetchError).toHaveBeenCalledWith('Failed to find supervisor by identifier', error);
    });
  });
});

