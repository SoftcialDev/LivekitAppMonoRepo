import { seedDefaultSnapshotReasons } from '../../../src/infrastructure/seed/defaultSnapshotReasons';
import { createMockPrismaClient, createMockSnapshotReason, mockDate } from '../../shared/mocks';

jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();

describe('defaultSnapshotReasons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
  });

  describe('seedDefaultSnapshotReasons', () => {
    it('should create all default snapshot reasons when they do not exist', async () => {
      mockPrismaClient.snapshotReason.findUnique.mockResolvedValue(null);
      mockPrismaClient.snapshotReason.create.mockResolvedValue(createMockSnapshotReason());

      await seedDefaultSnapshotReasons();

      expect(mockPrismaClient.snapshotReason.findUnique).toHaveBeenCalledTimes(6);
      expect(mockPrismaClient.snapshotReason.create).toHaveBeenCalledTimes(6);
      
      // Verify first reason
      expect(mockPrismaClient.snapshotReason.findUnique).toHaveBeenNthCalledWith(1, {
        where: { code: 'ATTENTIVENESS_ALERTNESS' },
      });
      expect(mockPrismaClient.snapshotReason.create).toHaveBeenNthCalledWith(1, {
        data: {
          label: 'Attentiveness / Alertness',
          code: 'ATTENTIVENESS_ALERTNESS',
          isDefault: true,
          order: 0,
        },
      });

      // Verify last reason
      expect(mockPrismaClient.snapshotReason.findUnique).toHaveBeenNthCalledWith(6, {
        where: { code: 'OTHER' },
      });
      expect(mockPrismaClient.snapshotReason.create).toHaveBeenNthCalledWith(6, {
        data: {
          label: 'Other',
          code: 'OTHER',
          isDefault: true,
          order: 5,
        },
      });
    });

    it('should skip creating reasons that already exist', async () => {
      const existingReason = createMockSnapshotReason({
        code: 'ATTENTIVENESS_ALERTNESS',
        label: 'Attentiveness / Alertness',
      });

      mockPrismaClient.snapshotReason.findUnique
        .mockResolvedValueOnce(existingReason) // First reason exists
        .mockResolvedValueOnce(null) // Second doesn't exist
        .mockResolvedValueOnce(null) // Third doesn't exist
        .mockResolvedValueOnce(null) // Fourth doesn't exist
        .mockResolvedValueOnce(null) // Fifth doesn't exist
        .mockResolvedValueOnce(null); // Sixth doesn't exist

      mockPrismaClient.snapshotReason.create.mockResolvedValue(createMockSnapshotReason());

      await seedDefaultSnapshotReasons();

      expect(mockPrismaClient.snapshotReason.findUnique).toHaveBeenCalledTimes(6);
      expect(mockPrismaClient.snapshotReason.create).toHaveBeenCalledTimes(5); // Only 5 created, 1 skipped
    });

    it('should create all reasons when none exist', async () => {
      mockPrismaClient.snapshotReason.findUnique.mockResolvedValue(null);
      mockPrismaClient.snapshotReason.create.mockResolvedValue(createMockSnapshotReason());

      await seedDefaultSnapshotReasons();

      expect(mockPrismaClient.snapshotReason.create).toHaveBeenCalledWith({
        data: {
          label: 'Attentiveness / Alertness',
          code: 'ATTENTIVENESS_ALERTNESS',
          isDefault: true,
          order: 0,
        },
      });
      expect(mockPrismaClient.snapshotReason.create).toHaveBeenCalledWith({
        data: {
          label: 'Time & Attendance (unjustified absence, no show, late)',
          code: 'TIME_ATTENDANCE',
          isDefault: true,
          order: 1,
        },
      });
      expect(mockPrismaClient.snapshotReason.create).toHaveBeenCalledWith({
        data: {
          label: 'Performance',
          code: 'PERFORMANCE',
          isDefault: true,
          order: 2,
        },
      });
      expect(mockPrismaClient.snapshotReason.create).toHaveBeenCalledWith({
        data: {
          label: 'Compliance (Background / HIPAA / Uniform / Other)',
          code: 'COMPLIANCE',
          isDefault: true,
          order: 3,
        },
      });
      expect(mockPrismaClient.snapshotReason.create).toHaveBeenCalledWith({
        data: {
          label: 'Professional appearance and demeanor',
          code: 'PROFESSIONAL_APPEARANCE',
          isDefault: true,
          order: 4,
        },
      });
      expect(mockPrismaClient.snapshotReason.create).toHaveBeenCalledWith({
        data: {
          label: 'Other',
          code: 'OTHER',
          isDefault: true,
          order: 5,
        },
      });
    });

    it('should not create any reasons when all already exist', async () => {
      const existingReason = createMockSnapshotReason();

      mockPrismaClient.snapshotReason.findUnique.mockResolvedValue(existingReason);
      mockPrismaClient.snapshotReason.create.mockResolvedValue(createMockSnapshotReason());

      await seedDefaultSnapshotReasons();

      expect(mockPrismaClient.snapshotReason.findUnique).toHaveBeenCalledTimes(6);
      expect(mockPrismaClient.snapshotReason.create).not.toHaveBeenCalled();
    });

    it('should handle errors when finding existing reasons', async () => {
      const error = new Error('Database error');
      mockPrismaClient.snapshotReason.findUnique.mockRejectedValue(error);

      await expect(seedDefaultSnapshotReasons()).rejects.toThrow('Database error');
    });

    it('should handle errors when creating reasons', async () => {
      const error = new Error('Database error');
      mockPrismaClient.snapshotReason.findUnique.mockResolvedValue(null);
      mockPrismaClient.snapshotReason.create.mockRejectedValue(error);

      await expect(seedDefaultSnapshotReasons()).rejects.toThrow('Database error');
    });
  });
});

