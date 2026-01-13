import { ErrorLogRepository } from '../../../src/infrastructure/repositories/ErrorLogRepository';
import { ErrorSeverity } from '../../../src/domain/enums/ErrorSeverity';
import { ErrorSource } from '../../../src/domain/enums/ErrorSource';
import { getCentralAmericaTime } from '../../../src/utils/dateUtils';
import { wrapEntityCreationError, wrapDatabaseQueryError, wrapEntityUpdateError, wrapEntityDeletionError } from '../../../src/utils/error/ErrorHelpers';
import { Prisma } from '@prisma/client';
import { EntityCreationError, DatabaseQueryError, EntityUpdateError, EntityDeletionError } from '../../../src/domain/errors/RepositoryErrors';
import { ApiErrorLog } from '../../../src/domain/entities/ApiErrorLog';
import { createMockPrismaClient, createMockApiErrorLog, mockDate } from '../../shared/mocks';
import prisma from '../../../src/infrastructure/database/PrismaClientService';

jest.mock('../../../src/utils/dateUtils');
jest.mock('../../../src/utils/error/ErrorHelpers');
jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => 'generated-uuid'),
}));
jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();
const mockGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;
const mockWrapEntityCreationError = wrapEntityCreationError as jest.MockedFunction<typeof wrapEntityCreationError>;
const mockWrapDatabaseQueryError = wrapDatabaseQueryError as jest.MockedFunction<typeof wrapDatabaseQueryError>;
const mockWrapEntityUpdateError = wrapEntityUpdateError as jest.MockedFunction<typeof wrapEntityUpdateError>;
const mockWrapEntityDeletionError = wrapEntityDeletionError as jest.MockedFunction<typeof wrapEntityDeletionError>;

describe('ErrorLogRepository', () => {
  let repository: ErrorLogRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new ErrorLogRepository();
    mockGetCentralAmericaTime.mockReturnValue(mockDate);
  });

  describe('create', () => {
    it('should create an error log successfully', async () => {
      const data = {
        severity: ErrorSeverity.High,
        source: ErrorSource.Database,
        endpoint: '/api/test',
        functionName: 'testFunction',
        errorName: 'Error',
        errorMessage: 'Error message',
        stackTrace: 'stack trace',
        httpStatusCode: 500,
        userId: 'user-id',
        userEmail: 'test@example.com',
        requestId: 'request-id',
        context: { key: 'value' },
      };

      const prismaErrorLog = createMockApiErrorLog({
        id: 'generated-uuid',
        context: { key: 'value' },
      });

      mockPrismaClient.apiErrorLog.create.mockResolvedValue(prismaErrorLog);

      const result = await repository.create(data);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.apiErrorLog.create).toHaveBeenCalledWith({
        data: {
          id: 'generated-uuid',
          severity: data.severity,
          source: data.source,
          endpoint: data.endpoint,
          functionName: data.functionName,
          errorName: data.errorName,
          errorMessage: data.errorMessage,
          stackTrace: data.stackTrace,
          httpStatusCode: data.httpStatusCode,
          userId: data.userId,
          userEmail: data.userEmail,
          requestId: data.requestId,
          context: data.context as Prisma.InputJsonValue,
          resolved: false,
          createdAt: mockDate,
        },
      });
      expect(result).toBeInstanceOf(ApiErrorLog);
      expect(result.id).toBe('generated-uuid');
    });

    it('should handle null context', async () => {
      const data = {
        severity: ErrorSeverity.High,
        source: ErrorSource.Database,
        errorMessage: 'Error message',
      };

      const prismaErrorLog = createMockApiErrorLog({
        id: 'generated-uuid',
        context: null,
      });

      mockPrismaClient.apiErrorLog.create.mockResolvedValue(prismaErrorLog);

      const result = await repository.create(data);

      expect(mockPrismaClient.apiErrorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          context: Prisma.JsonNull,
        }),
      });
      expect(result).toBeInstanceOf(ApiErrorLog);
      expect(result.context).toBeNull();
    });

    it('should throw EntityCreationError on create failure', async () => {
      const data = {
        severity: ErrorSeverity.High,
        source: ErrorSource.Database,
        errorMessage: 'Error message',
      };

      const error = new Error('Database error');
      mockPrismaClient.apiErrorLog.create.mockRejectedValue(error);
      const wrappedError = new EntityCreationError('Failed to create error log', error);
      mockWrapEntityCreationError.mockReturnValue(wrappedError);

      await expect(repository.create(data)).rejects.toThrow(EntityCreationError);
      expect(mockWrapEntityCreationError).toHaveBeenCalledWith('Failed to create error log', error);
    });
  });

  describe('findMany', () => {
    it('should find error logs with default pagination', async () => {
      const prismaErrorLogs = [
        createMockApiErrorLog({ id: 'log-1' }),
        createMockApiErrorLog({ id: 'log-2' }),
      ];

      mockPrismaClient.apiErrorLog.findMany.mockResolvedValue(prismaErrorLogs);

      const result = await repository.findMany();

      expect(mockPrismaClient.apiErrorLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
        skip: 0,
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ApiErrorLog);
    });

    it('should find error logs with query parameters', async () => {
      const params = {
        source: ErrorSource.Database,
        severity: ErrorSeverity.High,
        endpoint: '/api/test',
        resolved: false,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        limit: 50,
        offset: 10,
      };

      const prismaErrorLogs = [createMockApiErrorLog()];
      mockPrismaClient.apiErrorLog.findMany.mockResolvedValue(prismaErrorLogs);

      await repository.findMany(params);

      expect(mockPrismaClient.apiErrorLog.findMany).toHaveBeenCalledWith({
        where: {
          source: params.source,
          severity: params.severity,
          endpoint: params.endpoint,
          resolved: params.resolved,
          createdAt: {
            gte: params.startDate,
            lte: params.endDate,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
        skip: 10,
      });
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.apiErrorLog.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to find error logs', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.findMany()).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to find error logs', error);
    });
  });

  describe('findById', () => {
    it('should find error log by id', async () => {
      const prismaErrorLog = createMockApiErrorLog({ id: 'log-id' });
      mockPrismaClient.apiErrorLog.findUnique.mockResolvedValue(prismaErrorLog);

      const result = await repository.findById('log-id');

      expect(mockPrismaClient.apiErrorLog.findUnique).toHaveBeenCalledWith({
        where: { id: 'log-id' },
      });
      expect(result).toBeInstanceOf(ApiErrorLog);
      expect(result?.id).toBe('log-id');
    });

    it('should return null when not found', async () => {
      mockPrismaClient.apiErrorLog.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.apiErrorLog.findUnique.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to find error log by id', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.findById('log-id')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to find error log by id', error);
    });
  });

  describe('markAsResolved', () => {
    it('should mark error log as resolved', async () => {
      mockPrismaClient.apiErrorLog.update.mockResolvedValue(createMockApiErrorLog());

      await repository.markAsResolved('log-id', 'user-id');

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.apiErrorLog.update).toHaveBeenCalledWith({
        where: { id: 'log-id' },
        data: {
          resolved: true,
          resolvedAt: mockDate,
          resolvedBy: 'user-id',
        },
      });
    });

    it('should throw EntityUpdateError on update failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.apiErrorLog.update.mockRejectedValue(error);
      const wrappedError = new EntityUpdateError('Failed to mark error log as resolved', error);
      mockWrapEntityUpdateError.mockReturnValue(wrappedError);

      await expect(repository.markAsResolved('log-id', 'user-id')).rejects.toThrow(EntityUpdateError);
      expect(mockWrapEntityUpdateError).toHaveBeenCalledWith('Failed to mark error log as resolved', error);
    });
  });

  describe('deleteById', () => {
    it('should delete error log by id', async () => {
      mockPrismaClient.apiErrorLog.delete.mockResolvedValue(createMockApiErrorLog());

      await repository.deleteById('log-id');

      expect(mockPrismaClient.apiErrorLog.delete).toHaveBeenCalledWith({
        where: { id: 'log-id' },
      });
    });

    it('should throw EntityDeletionError on delete failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.apiErrorLog.delete.mockRejectedValue(error);
      const wrappedError = new EntityDeletionError('Failed to delete error log', error);
      mockWrapEntityDeletionError.mockReturnValue(wrappedError);

      await expect(repository.deleteById('log-id')).rejects.toThrow(EntityDeletionError);
      expect(mockWrapEntityDeletionError).toHaveBeenCalledWith('Failed to delete error log', error);
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple error logs', async () => {
      mockPrismaClient.apiErrorLog.deleteMany.mockResolvedValue({ count: 2 });

      await repository.deleteMany(['log-1', 'log-2']);

      expect(mockPrismaClient.apiErrorLog.deleteMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['log-1', 'log-2'],
          },
        },
      });
    });

    it('should throw EntityDeletionError on delete failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.apiErrorLog.deleteMany.mockRejectedValue(error);
      const wrappedError = new EntityDeletionError('Failed to delete error logs', error);
      mockWrapEntityDeletionError.mockReturnValue(wrappedError);

      await expect(repository.deleteMany(['log-1'])).rejects.toThrow(EntityDeletionError);
      expect(mockWrapEntityDeletionError).toHaveBeenCalledWith('Failed to delete error logs', error);
    });
  });

  describe('deleteAll', () => {
    it('should delete all error logs', async () => {
      mockPrismaClient.apiErrorLog.deleteMany.mockResolvedValue({ count: 10 });

      await repository.deleteAll();

      expect(mockPrismaClient.apiErrorLog.deleteMany).toHaveBeenCalledWith({});
    });

    it('should throw EntityDeletionError on delete failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.apiErrorLog.deleteMany.mockRejectedValue(error);
      const wrappedError = new EntityDeletionError('Failed to delete all error logs', error);
      mockWrapEntityDeletionError.mockReturnValue(wrappedError);

      await expect(repository.deleteAll()).rejects.toThrow(EntityDeletionError);
      expect(mockWrapEntityDeletionError).toHaveBeenCalledWith('Failed to delete all error logs', error);
    });
  });

  describe('count', () => {
    it('should count error logs', async () => {
      mockPrismaClient.apiErrorLog.count.mockResolvedValue(5);

      const result = await repository.count();

      expect(mockPrismaClient.apiErrorLog.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(result).toBe(5);
    });

    it('should count error logs with query parameters', async () => {
      const params = {
        source: ErrorSource.Database,
        severity: ErrorSeverity.High,
      };

      mockPrismaClient.apiErrorLog.count.mockResolvedValue(3);

      const result = await repository.count(params);

      expect(mockPrismaClient.apiErrorLog.count).toHaveBeenCalledWith({
        where: {
          source: params.source,
          severity: params.severity,
        },
      });
      expect(result).toBe(3);
    });

    it('should throw DatabaseQueryError on count failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.apiErrorLog.count.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to count error logs', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.count()).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to count error logs', error);
    });
  });
});
