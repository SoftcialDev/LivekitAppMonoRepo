import { AuditRepository } from '../../../src/infrastructure/repositories/AuditRepository';
import { AuditLog } from '../../../src/domain/entities/AuditLog';
import { getCentralAmericaTime } from '../../../src/utils/dateUtils';
import { wrapEntityCreationError, wrapDatabaseQueryError } from '../../../src/utils/error/ErrorHelpers';
import { Prisma } from '@prisma/client';
import { EntityCreationError, DatabaseQueryError } from '../../../src/domain/errors/RepositoryErrors';
import { createMockPrismaClient, createMockAuditLog, mockDate } from '../../shared/mocks';

jest.mock('../../../src/utils/dateUtils');
jest.mock('../../../src/utils/error/ErrorHelpers');
jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();
const mockGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;
const mockWrapEntityCreationError = wrapEntityCreationError as jest.MockedFunction<typeof wrapEntityCreationError>;
const mockWrapDatabaseQueryError = wrapDatabaseQueryError as jest.MockedFunction<typeof wrapDatabaseQueryError>;

describe('AuditRepository', () => {
  let repository: AuditRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new AuditRepository();
    mockGetCentralAmericaTime.mockReturnValue(mockDate);
  });

  describe('create', () => {
    it('should create an audit log successfully', async () => {
      const auditLog = new AuditLog({
        id: 'audit-log-id',
        entity: 'User',
        entityId: 'user-id',
        action: 'CREATE',
        changedById: 'user-id',
        timestamp: mockDate,
        dataBefore: { name: 'Old' },
        dataAfter: { name: 'New' },
      });

      const prismaAuditLog = createMockAuditLog({
        dataBefore: { name: 'Old' },
        dataAfter: { name: 'New' },
      });

      mockPrismaClient.auditLog.create.mockResolvedValue(prismaAuditLog);

      const result = await repository.create(auditLog);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          id: auditLog.id,
          entity: auditLog.entity,
          entityId: auditLog.entityId,
          action: auditLog.action,
          changedById: auditLog.changedById,
          timestamp: mockDate,
          dataBefore: auditLog.dataBefore as Prisma.InputJsonValue,
          dataAfter: auditLog.dataAfter as Prisma.InputJsonValue,
        },
      });
      expect(result).toBeInstanceOf(AuditLog);
      expect(result.id).toBe(auditLog.id);
    });

    it('should handle null dataBefore and dataAfter', async () => {
      const auditLog = new AuditLog({
        id: 'audit-log-id',
        entity: 'User',
        entityId: 'user-id',
        action: 'CREATE',
        changedById: 'user-id',
        timestamp: mockDate,
        dataBefore: null,
        dataAfter: null,
      });

      const prismaAuditLog = createMockAuditLog({
        dataBefore: null,
        dataAfter: null,
      });

      mockPrismaClient.auditLog.create.mockResolvedValue(prismaAuditLog);

      const result = await repository.create(auditLog);

      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          id: auditLog.id,
          entity: auditLog.entity,
          entityId: auditLog.entityId,
          action: auditLog.action,
          changedById: auditLog.changedById,
          timestamp: mockDate,
          dataBefore: Prisma.JsonNull,
          dataAfter: Prisma.JsonNull,
        },
      });
      expect(result).toBeInstanceOf(AuditLog);
      expect(result.dataBefore).toBeNull();
      expect(result.dataAfter).toBeNull();
    });

    it('should throw EntityCreationError on create failure', async () => {
      const auditLog = new AuditLog({
        id: 'audit-log-id',
        entity: 'User',
        entityId: 'user-id',
        action: 'CREATE',
        changedById: 'user-id',
        timestamp: mockDate,
      });

      const error = new Error('Database error');
      mockPrismaClient.auditLog.create.mockRejectedValue(error);
      const wrappedError = new EntityCreationError('Failed to create audit log', error);
      mockWrapEntityCreationError.mockReturnValue(wrappedError);

      await expect(repository.create(auditLog)).rejects.toThrow(EntityCreationError);
      expect(mockWrapEntityCreationError).toHaveBeenCalledWith('Failed to create audit log', error);
    });
  });

  describe('findByEntity', () => {
    it('should find audit logs by entity and entityId', async () => {
      const prismaAuditLogs = [
        createMockAuditLog({ id: 'log-1' }),
        createMockAuditLog({ id: 'log-2' }),
      ];

      mockPrismaClient.auditLog.findMany.mockResolvedValue(prismaAuditLogs);

      const result = await repository.findByEntity('User', 'user-id');

      expect(mockPrismaClient.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entity: 'User',
          entityId: 'user-id',
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(AuditLog);
      expect(result[0].id).toBe('log-1');
    });

    it('should return empty array when no logs found', async () => {
      mockPrismaClient.auditLog.findMany.mockResolvedValue([]);

      const result = await repository.findByEntity('User', 'user-id');

      expect(result).toHaveLength(0);
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.auditLog.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to find audit logs by entity', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.findByEntity('User', 'user-id')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to find audit logs by entity', error);
    });
  });

  describe('findByUser', () => {
    it('should find audit logs by changedById', async () => {
      const prismaAuditLogs = [createMockAuditLog({ changedById: 'user-id' })];

      mockPrismaClient.auditLog.findMany.mockResolvedValue(prismaAuditLogs);

      const result = await repository.findByUser('user-id');

      expect(mockPrismaClient.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          changedById: 'user-id',
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].changedById).toBe('user-id');
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.auditLog.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to find audit logs by user', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.findByUser('user-id')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to find audit logs by user', error);
    });
  });

  describe('findByDateRange', () => {
    it('should find audit logs by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const prismaAuditLogs = [createMockAuditLog()];

      mockPrismaClient.auditLog.findMany.mockResolvedValue(prismaAuditLogs);

      const result = await repository.findByDateRange(startDate, endDate);

      expect(mockPrismaClient.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
      expect(result).toHaveLength(1);
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const error = new Error('Database error');
      mockPrismaClient.auditLog.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to find audit logs by date range', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.findByDateRange(startDate, endDate)).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to find audit logs by date range', error);
    });
  });
});
