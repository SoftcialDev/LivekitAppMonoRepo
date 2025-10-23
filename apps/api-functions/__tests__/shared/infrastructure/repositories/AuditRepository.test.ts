/**
 * @fileoverview Tests for AuditRepository
 * @description Tests for audit data access operations
 */

import { AuditRepository } from '../../../../shared/infrastructure/repositories/AuditRepository';
import { AuditLog } from '../../../../shared/domain/entities/AuditLog';
import prisma from '../../../../shared/infrastructure/database/PrismaClientService';

// Mock Prisma
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn()
  }
}));

// Mock dateUtils
jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn().mockReturnValue(new Date('2023-01-01T10:00:00Z'))
}));

describe('AuditRepository', () => {
  let auditRepository: AuditRepository;
  let mockPrismaAuditLog: any;

  beforeEach(() => {
    jest.clearAllMocks();
    auditRepository = new AuditRepository();

    mockPrismaAuditLog = {
      id: 'audit-123',
      entity: 'User',
      entityId: 'user-123',
      action: 'CREATE',
      changedById: 'admin-123',
      timestamp: new Date('2023-01-01T10:00:00Z'),
      dataBefore: null,
      dataAfter: { email: 'test@example.com', role: 'Employee' },
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-01T10:00:00Z')
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create AuditRepository instance', () => {
      expect(auditRepository).toBeInstanceOf(AuditRepository);
    });
  });

  describe('create', () => {
    it('should create a new audit log', async () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date('2023-01-01T10:00:00Z'),
        dataBefore: null,
        dataAfter: { email: 'test@example.com', role: 'Employee' }
      });

      (prisma.auditLog.create as jest.Mock).mockResolvedValue(mockPrismaAuditLog);

      const result = await auditRepository.create(auditLog);

      expect(result).toBeInstanceOf(AuditLog);
      expect(result?.id).toBe('audit-123');
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          id: 'audit-123',
          entity: 'User',
          entityId: 'user-123',
          action: 'CREATE',
          changedById: 'admin-123',
          timestamp: expect.any(Date),
          dataBefore: null,
          dataAfter: { email: 'test@example.com', role: 'Employee' }
        }
      });
    });

    it('should handle creation errors', async () => {
      const auditLog = new AuditLog({
        id: 'audit-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-123',
        timestamp: new Date('2023-01-01T10:00:00Z'),
        dataBefore: null,
        dataAfter: { email: 'test@example.com', role: 'Employee' }
      });

      (prisma.auditLog.create as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      await expect(auditRepository.create(auditLog))
        .rejects.toThrow('Failed to create audit log: Creation failed');
    });
  });

  describe('findByEntity', () => {
    it('should find audit logs by entity', async () => {
      const mockAuditLogs = [mockPrismaAuditLog, { ...mockPrismaAuditLog, id: 'audit-456' }];
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockAuditLogs);

      const result = await auditRepository.findByEntity('User', 'user-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(AuditLog);
      expect(result[1]).toBeInstanceOf(AuditLog);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entity: 'User',
          entityId: 'user-123'
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
    });

    it('should return empty array when no audit logs found', async () => {
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await auditRepository.findByEntity('User', 'user-123');

      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      (prisma.auditLog.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(auditRepository.findByEntity('User', 'user-123'))
        .rejects.toThrow('Failed to find audit logs by entity: Database error');
    });
  });

  describe('findByUser', () => {
    it('should find audit logs by user', async () => {
      const mockAuditLogs = [mockPrismaAuditLog, { ...mockPrismaAuditLog, id: 'audit-456' }];
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockAuditLogs);

      const result = await auditRepository.findByUser('admin-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(AuditLog);
      expect(result[1]).toBeInstanceOf(AuditLog);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          changedById: 'admin-123'
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
    });

    it('should return empty array when no audit logs found for user', async () => {
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await auditRepository.findByUser('admin-123');

      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      (prisma.auditLog.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(auditRepository.findByUser('admin-123'))
        .rejects.toThrow('Failed to find audit logs by user: Database error');
    });
  });

  describe('findByDateRange', () => {
    it('should find audit logs by date range', async () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-01T23:59:59Z');
      const mockAuditLogs = [mockPrismaAuditLog, { ...mockPrismaAuditLog, id: 'audit-456' }];

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockAuditLogs);

      const result = await auditRepository.findByDateRange(startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(AuditLog);
      expect(result[1]).toBeInstanceOf(AuditLog);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
    });

    it('should return empty array when no audit logs found in date range', async () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-01T23:59:59Z');

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await auditRepository.findByDateRange(startDate, endDate);

      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-01T23:59:59Z');

      (prisma.auditLog.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(auditRepository.findByDateRange(startDate, endDate))
        .rejects.toThrow('Failed to find audit logs by date range: Database error');
    });
  });
});
