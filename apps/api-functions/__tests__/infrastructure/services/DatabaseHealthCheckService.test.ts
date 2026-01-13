import { DatabaseHealthCheckService } from '../../../src/infrastructure/services/DatabaseHealthCheckService';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { HealthStatus } from '../../../src/domain/enums/HealthStatus';

jest.mock('@prisma/client');
jest.mock('@prisma/adapter-pg');
jest.mock('pg');

const MockPrismaClient = PrismaClient as jest.MockedClass<typeof PrismaClient>;
const MockPrismaPg = PrismaPg as jest.MockedClass<typeof PrismaPg>;
const MockPool = Pool as jest.MockedClass<typeof Pool>;

describe('DatabaseHealthCheckService', () => {
  let service: DatabaseHealthCheckService;
  let mockPool: jest.Mocked<Pool>;
  let mockAdapter: jest.Mocked<PrismaPg>;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPool = {
      end: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockAdapter = {} as any;

    mockPrisma = {
      $queryRaw: jest.fn(),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      user: {
        findMany: jest.fn(),
      },
    } as any;

    MockPool.mockImplementation(() => mockPool);
    MockPrismaPg.mockImplementation(() => mockAdapter);
    MockPrismaClient.mockImplementation(() => mockPrisma as any);

    service = new DatabaseHealthCheckService();
  });

  describe('checkDatabaseConnectivity', () => {
    it('should return OK status when database connection succeeds', async () => {
      const databaseUrl = 'postgresql://user:pass@localhost:5432/db';
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.checkDatabaseConnectivity(databaseUrl, false);

      expect(MockPool).toHaveBeenCalledWith({ connectionString: databaseUrl });
      expect(MockPrismaPg).toHaveBeenCalledWith(mockPool);
      expect(MockPrismaClient).toHaveBeenCalledWith({ adapter: mockAdapter });
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result.status).toBe(HealthStatus.OK);
      expect(result.message).toBe('Database connectivity OK (SELECT 1 succeeded).');
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should return FAIL status when database connection fails', async () => {
      const databaseUrl = 'postgresql://user:pass@localhost:5432/db';
      const error = new Error('Connection failed');
      mockPrisma.$queryRaw.mockRejectedValue(error);

      const result = await service.checkDatabaseConnectivity(databaseUrl, false);

      expect(result.status).toBe(HealthStatus.FAIL);
      expect(result.message).toBe('Database connectivity failed.');
      expect(result.details).toEqual({ message: 'Connection failed' });
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should include full error details when verbose is true', async () => {
      const databaseUrl = 'postgresql://user:pass@localhost:5432/db';
      const error = new Error('Connection failed');
      error.name = 'DatabaseError';
      error.stack = 'Error stack trace';
      mockPrisma.$queryRaw.mockRejectedValue(error);

      const result = await service.checkDatabaseConnectivity(databaseUrl, true);

      expect(result.status).toBe(HealthStatus.FAIL);
      expect(result.details).toEqual({
        name: 'DatabaseError',
        message: 'Connection failed',
        stack: 'Error stack trace',
      });
    });

    it('should handle disconnect errors gracefully', async () => {
      const databaseUrl = 'postgresql://user:pass@localhost:5432/db';
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      mockPrisma.$disconnect.mockRejectedValue(new Error('Disconnect failed'));
      (mockPool.end as jest.Mock).mockRejectedValue(new Error('Pool end failed'));

      const result = await service.checkDatabaseConnectivity(databaseUrl, false);

      expect(result.status).toBe(HealthStatus.OK);
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', async () => {
      const databaseUrl = 'postgresql://user:pass@localhost:5432/db';
      mockPrisma.$queryRaw.mockRejectedValue('String error');

      const result = await service.checkDatabaseConnectivity(databaseUrl, false);

      expect(result.status).toBe(HealthStatus.FAIL);
      expect(result.details).toEqual({ message: 'String error' });
    });
  });

  describe('fetchUsers', () => {
    it('should return users array when query succeeds', async () => {
      const databaseUrl = 'postgresql://user:pass@localhost:5432/db';
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          fullName: 'User 1',
          role: 'PSO',
          azureAdObjectId: 'azure-id-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          fullName: 'User 2',
          role: 'Supervisor',
          azureAdObjectId: 'azure-id-2',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      (mockPrisma.user as any).findMany.mockResolvedValue(mockUsers);

      const result = await service.fetchUsers(databaseUrl);

      expect(MockPool).toHaveBeenCalledWith({ connectionString: databaseUrl });
      expect(MockPrismaPg).toHaveBeenCalledWith(mockPool);
      expect(MockPrismaClient).toHaveBeenCalledWith({ adapter: mockAdapter });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          azureAdObjectId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
        orderBy: {
          email: 'asc',
        },
      });
      expect(result).toEqual(mockUsers);
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should return error object when query fails', async () => {
      const databaseUrl = 'postgresql://user:pass@localhost:5432/db';
      const error = new Error('Query failed');

      (mockPrisma.user as any).findMany.mockRejectedValue(error);

      const result = await service.fetchUsers(databaseUrl);

      expect(result).toEqual({ error: 'Query failed' });
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions in fetchUsers', async () => {
      const databaseUrl = 'postgresql://user:pass@localhost:5432/db';

      (mockPrisma.user as any).findMany.mockRejectedValue('String error');

      const result = await service.fetchUsers(databaseUrl);

      expect(result).toEqual({ error: 'String error' });
    });

    it('should handle disconnect errors gracefully in fetchUsers', async () => {
      const databaseUrl = 'postgresql://user:pass@localhost:5432/db';
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          fullName: 'User 1',
          role: 'PSO',
          azureAdObjectId: 'azure-id-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      (mockPrisma.user as any).findMany.mockResolvedValue(mockUsers);
      mockPrisma.$disconnect.mockRejectedValue(new Error('Disconnect failed'));
      (mockPool.end as jest.Mock).mockRejectedValue(new Error('Pool end failed'));

      const result = await service.fetchUsers(databaseUrl);

      expect(result).toEqual(mockUsers);
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});

