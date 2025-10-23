/**
 * @fileoverview SnapshotRepository tests
 * @description Unit tests for SnapshotRepository
 */

import { SnapshotRepository } from '../../../../shared/infrastructure/repositories/SnapshotRepository';
import prisma from '../../../../shared/infrastructure/database/PrismaClientService';

// Mock Prisma client
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  snapshot: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn()
  }
}));

// Mock dateUtils
jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2023-01-01T00:00:00Z'))
}));

describe('SnapshotRepository', () => {
  let repository: SnapshotRepository;
  let mockPrisma: any;

  beforeEach(() => {
    repository = new SnapshotRepository();
    mockPrisma = prisma as any;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create snapshot successfully', async () => {
      const mockSnapshot = {
        id: 'snapshot-123',
        supervisorId: 'supervisor-123',
        psoId: 'pso-123',
        reason: 'Test reason',
        imageUrl: 'https://example.com/image.jpg',
        takenAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.snapshot.create.mockResolvedValue(mockSnapshot);

      const result = await repository.create(
        'supervisor-123',
        'pso-123',
        'Test reason',
        'https://example.com/image.jpg'
      );

      expect(result).toEqual({ id: 'snapshot-123' });
      expect(mockPrisma.snapshot.create).toHaveBeenCalledWith({
        data: {
          supervisorId: 'supervisor-123',
          psoId: 'pso-123',
          reason: 'Test reason',
          imageUrl: 'https://example.com/image.jpg',
          takenAt: new Date('2023-01-01T00:00:00Z')
        }
      });
    });

    it('should handle different snapshot data', async () => {
      const mockSnapshot = {
        id: 'snapshot-456',
        supervisorId: 'supervisor-456',
        psoId: 'pso-456',
        reason: 'Different reason',
        imageUrl: 'https://example.com/different.jpg',
        takenAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.snapshot.create.mockResolvedValue(mockSnapshot);

      const result = await repository.create(
        'supervisor-456',
        'pso-456',
        'Different reason',
        'https://example.com/different.jpg'
      );

      expect(result).toEqual({ id: 'snapshot-456' });
    });
  });

  describe('findById', () => {
    it('should return snapshot when found', async () => {
      const mockSnapshot = {
        id: 'snapshot-123',
        imageUrl: 'https://example.com/image.jpg'
      };

      mockPrisma.snapshot.findUnique.mockResolvedValue(mockSnapshot);

      const result = await repository.findById('snapshot-123');

      expect(result).toEqual(mockSnapshot);
      expect(mockPrisma.snapshot.findUnique).toHaveBeenCalledWith({
        where: { id: 'snapshot-123' },
        select: { id: true, imageUrl: true }
      });
    });

    it('should return null when snapshot not found', async () => {
      mockPrisma.snapshot.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle different snapshot IDs', async () => {
      const mockSnapshot = {
        id: 'snapshot-456',
        imageUrl: 'https://example.com/different.jpg'
      };

      mockPrisma.snapshot.findUnique.mockResolvedValue(mockSnapshot);

      const result = await repository.findById('snapshot-456');

      expect(result).toEqual(mockSnapshot);
      expect(mockPrisma.snapshot.findUnique).toHaveBeenCalledWith({
        where: { id: 'snapshot-456' },
        select: { id: true, imageUrl: true }
      });
    });
  });

  describe('deleteById', () => {
    it('should delete snapshot successfully', async () => {
      mockPrisma.snapshot.delete.mockResolvedValue({});

      await repository.deleteById('snapshot-123');

      expect(mockPrisma.snapshot.delete).toHaveBeenCalledWith({
        where: { id: 'snapshot-123' }
      });
    });

    it('should handle different snapshot IDs', async () => {
      mockPrisma.snapshot.delete.mockResolvedValue({});

      await repository.deleteById('snapshot-456');

      expect(mockPrisma.snapshot.delete).toHaveBeenCalledWith({
        where: { id: 'snapshot-456' }
      });
    });
  });

  describe('findAllWithRelations', () => {
    it('should return snapshots with relations', async () => {
      const mockSnapshots = [
        {
          id: 'snapshot-1',
          reason: 'Reason 1',
          imageUrl: 'https://example.com/image1.jpg',
          takenAt: new Date('2023-01-01T00:00:00Z'),
          supervisor: {
            fullName: 'Supervisor 1'
          },
          pso: {
            fullName: 'PSO 1',
            email: 'pso1@example.com'
          }
        },
        {
          id: 'snapshot-2',
          reason: 'Reason 2',
          imageUrl: 'https://example.com/image2.jpg',
          takenAt: new Date('2023-01-02T00:00:00Z'),
          supervisor: {
            fullName: 'Supervisor 2'
          },
          pso: {
            fullName: 'PSO 2',
            email: 'pso2@example.com'
          }
        }
      ];

      mockPrisma.snapshot.findMany.mockResolvedValue(mockSnapshots);

      const result = await repository.findAllWithRelations();

      expect(result).toEqual(mockSnapshots);
      expect(mockPrisma.snapshot.findMany).toHaveBeenCalledWith({
        include: {
          supervisor: { select: { fullName: true } },
          pso: { select: { fullName: true, email: true } }
        },
        orderBy: { takenAt: 'desc' }
      });
    });

    it('should return empty array when no snapshots found', async () => {
      mockPrisma.snapshot.findMany.mockResolvedValue([]);

      const result = await repository.findAllWithRelations();

      expect(result).toEqual([]);
    });

    it('should handle single snapshot', async () => {
      const mockSnapshots = [
        {
          id: 'snapshot-1',
          reason: 'Single reason',
          imageUrl: 'https://example.com/single.jpg',
          takenAt: new Date('2023-01-01T00:00:00Z'),
          supervisor: {
            fullName: 'Single Supervisor'
          },
          pso: {
            fullName: 'Single PSO',
            email: 'single@example.com'
          }
        }
      ];

      mockPrisma.snapshot.findMany.mockResolvedValue(mockSnapshots);

      const result = await repository.findAllWithRelations();

      expect(result).toEqual(mockSnapshots);
      expect(result).toHaveLength(1);
    });
  });
});
