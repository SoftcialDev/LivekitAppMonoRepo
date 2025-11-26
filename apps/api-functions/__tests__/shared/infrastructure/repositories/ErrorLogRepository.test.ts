/**
 * @fileoverview Tests for ErrorLogRepository
 * @description Tests for error log data access operations
 */

import { ErrorLogRepository } from '../../../../shared/infrastructure/repositories/ErrorLogRepository';
import { ApiErrorLog } from '../../../../shared/domain/entities/ApiErrorLog';
import { ErrorSeverity } from '../../../../shared/domain/enums/ErrorSeverity';
import { ErrorSource } from '../../../../shared/domain/enums/ErrorSource';
import prisma from '../../../../shared/infrastructure/database/PrismaClientService';

// Mock Prisma
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  apiErrorLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  }
}));

// Mock dateUtils
jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn().mockReturnValue(new Date('2023-01-01T10:00:00Z'))
}));

// Mock uuid
jest.mock('../../../../shared/utils/uuid', () => ({
  generateUuid: jest.fn().mockReturnValue('error-uuid-123')
}));

describe('ErrorLogRepository', () => {
  let errorLogRepository: ErrorLogRepository;
  let mockPrismaErrorLog: any;

  beforeEach(() => {
    jest.clearAllMocks();
    errorLogRepository = new ErrorLogRepository();

    mockPrismaErrorLog = {
      id: 'error-uuid-123',
      severity: ErrorSeverity.High,
      source: ErrorSource.ChatService,
      endpoint: '/api/snapshots',
      functionName: 'notifySnapshotReport',
      errorName: 'GraphAPIError',
      errorMessage: 'Failed to send message',
      stackTrace: 'Error: Failed to send message',
      httpStatusCode: 500,
      userId: 'user-123',
      requestId: 'req-123',
      context: { chatId: 'chat-123' },
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: new Date('2023-01-01T10:00:00Z')
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create ErrorLogRepository instance', () => {
      expect(errorLogRepository).toBeInstanceOf(ErrorLogRepository);
    });
  });

  describe('create', () => {
    it('should create a new error log', async () => {
      (prisma as any).apiErrorLog.create.mockResolvedValue(mockPrismaErrorLog);

      const result = await errorLogRepository.create({
        severity: ErrorSeverity.High,
        source: ErrorSource.ChatService,
        endpoint: '/api/snapshots',
        functionName: 'notifySnapshotReport',
        errorName: 'GraphAPIError',
        errorMessage: 'Failed to send message',
        stackTrace: 'Error: Failed to send message',
        httpStatusCode: 500,
        userId: 'user-123',
        requestId: 'req-123',
        context: { chatId: 'chat-123' }
      });

      expect(result).toBeInstanceOf(ApiErrorLog);
      expect(result.id).toBe('error-uuid-123');
      expect((prisma as any).apiErrorLog.create).toHaveBeenCalledWith({
        data: {
          id: 'error-uuid-123',
          severity: ErrorSeverity.High,
          source: ErrorSource.ChatService,
          endpoint: '/api/snapshots',
          functionName: 'notifySnapshotReport',
          errorName: 'GraphAPIError',
          errorMessage: 'Failed to send message',
          stackTrace: 'Error: Failed to send message',
          httpStatusCode: 500,
          userId: 'user-123',
          requestId: 'req-123',
          context: { chatId: 'chat-123' },
          resolved: false,
          createdAt: expect.any(Date)
        }
      });
    });

    it('should handle creation errors', async () => {
      (prisma as any).apiErrorLog.create.mockRejectedValue(new Error('Creation failed'));

      await expect(
        errorLogRepository.create({
          severity: ErrorSeverity.High,
          source: ErrorSource.ChatService,
          errorName: 'Error',
          errorMessage: 'Test error'
        })
      ).rejects.toThrow('Failed to create error log: Creation failed');
    });
  });

  describe('findMany', () => {
    it('should find error logs with no filters', async () => {
      const mockErrorLogs = [mockPrismaErrorLog, { ...mockPrismaErrorLog, id: 'error-456' }];
      (prisma as any).apiErrorLog.findMany.mockResolvedValue(mockErrorLogs);

      const result = await errorLogRepository.findMany();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ApiErrorLog);
      expect((prisma as any).apiErrorLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        take: 100,
        skip: 0
      });
    });

    it('should find error logs with filters', async () => {
      const mockErrorLogs = [mockPrismaErrorLog];
      (prisma as any).apiErrorLog.findMany.mockResolvedValue(mockErrorLogs);

      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-01T23:59:59Z');

      const result = await errorLogRepository.findMany({
        source: ErrorSource.ChatService,
        severity: ErrorSeverity.High,
        endpoint: '/api/snapshots',
        resolved: false,
        startDate,
        endDate,
        limit: 50,
        offset: 10
      });

      expect(result).toHaveLength(1);
      expect((prisma as any).apiErrorLog.findMany).toHaveBeenCalledWith({
        where: {
          source: ErrorSource.ChatService,
          severity: ErrorSeverity.High,
          endpoint: '/api/snapshots',
          resolved: false,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 10
      });
    });

    it('should return empty array when no error logs found', async () => {
      (prisma as any).apiErrorLog.findMany.mockResolvedValue([]);

      const result = await errorLogRepository.findMany();

      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      (prisma as any).apiErrorLog.findMany.mockRejectedValue(new Error('Database error'));

      await expect(errorLogRepository.findMany()).rejects.toThrow(
        'Failed to find error logs: Database error'
      );
    });
  });

  describe('findById', () => {
    it('should find error log by id', async () => {
      (prisma as any).apiErrorLog.findUnique.mockResolvedValue(mockPrismaErrorLog);

      const result = await errorLogRepository.findById('error-uuid-123');

      expect(result).toBeInstanceOf(ApiErrorLog);
      expect(result?.id).toBe('error-uuid-123');
      expect((prisma as any).apiErrorLog.findUnique).toHaveBeenCalledWith({
        where: { id: 'error-uuid-123' }
      });
    });

    it('should return null when error log not found', async () => {
      (prisma as any).apiErrorLog.findUnique.mockResolvedValue(null);

      const result = await errorLogRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      (prisma as any).apiErrorLog.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(errorLogRepository.findById('error-uuid-123')).rejects.toThrow(
        'Failed to find error log by id: Database error'
      );
    });
  });

  describe('markAsResolved', () => {
    it('should mark error log as resolved', async () => {
      (prisma as any).apiErrorLog.update.mockResolvedValue({
        ...mockPrismaErrorLog,
        resolved: true,
        resolvedAt: new Date('2023-01-02T10:00:00Z'),
        resolvedBy: 'admin-123'
      });

      await errorLogRepository.markAsResolved('error-uuid-123', 'admin-123');

      expect((prisma as any).apiErrorLog.update).toHaveBeenCalledWith({
        where: { id: 'error-uuid-123' },
        data: {
          resolved: true,
          resolvedAt: expect.any(Date),
          resolvedBy: 'admin-123'
        }
      });
    });

    it('should handle update errors', async () => {
      (prisma as any).apiErrorLog.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        errorLogRepository.markAsResolved('error-uuid-123', 'admin-123')
      ).rejects.toThrow('Failed to mark error log as resolved: Update failed');
    });
  });

  describe('deleteById', () => {
    it('should delete error log by id', async () => {
      (prisma as any).apiErrorLog.delete.mockResolvedValue(mockPrismaErrorLog);

      await errorLogRepository.deleteById('error-uuid-123');

      expect((prisma as any).apiErrorLog.delete).toHaveBeenCalledWith({
        where: { id: 'error-uuid-123' }
      });
    });

    it('should handle deletion errors', async () => {
      (prisma as any).apiErrorLog.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(errorLogRepository.deleteById('error-uuid-123')).rejects.toThrow(
        'Failed to delete error log: Deletion failed'
      );
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple error logs', async () => {
      (prisma as any).apiErrorLog.deleteMany.mockResolvedValue({ count: 2 });

      await errorLogRepository.deleteMany(['error-uuid-123', 'error-uuid-456']);

      expect((prisma as any).apiErrorLog.deleteMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['error-uuid-123', 'error-uuid-456']
          }
        }
      });
    });

    it('should handle deletion errors', async () => {
      (prisma as any).apiErrorLog.deleteMany.mockRejectedValue(new Error('Deletion failed'));

      await expect(
        errorLogRepository.deleteMany(['error-uuid-123', 'error-uuid-456'])
      ).rejects.toThrow('Failed to delete error logs: Deletion failed');
    });
  });

  describe('count', () => {
    it('should count error logs with no filters', async () => {
      (prisma as any).apiErrorLog.count.mockResolvedValue(10);

      const result = await errorLogRepository.count();

      expect(result).toBe(10);
      expect((prisma as any).apiErrorLog.count).toHaveBeenCalledWith({
        where: {}
      });
    });

    it('should count error logs with filters', async () => {
      (prisma as any).apiErrorLog.count.mockResolvedValue(5);

      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-01T23:59:59Z');

      const result = await errorLogRepository.count({
        source: ErrorSource.ChatService,
        severity: ErrorSeverity.High,
        endpoint: '/api/snapshots',
        resolved: false,
        startDate,
        endDate
      });

      expect(result).toBe(5);
      expect((prisma as any).apiErrorLog.count).toHaveBeenCalledWith({
        where: {
          source: ErrorSource.ChatService,
          severity: ErrorSeverity.High,
          endpoint: '/api/snapshots',
          resolved: false,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
    });

    it('should handle database errors', async () => {
      (prisma as any).apiErrorLog.count.mockRejectedValue(new Error('Database error'));

      await expect(errorLogRepository.count()).rejects.toThrow(
        'Failed to count error logs: Database error'
      );
    });
  });
});

