import { SnapshotReasonRepository } from '../../../src/infrastructure/repositories/SnapshotReasonRepository';
import { createMockPrismaClient, createMockSnapshotReason, mockDate } from '../../shared/mocks';

jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();

describe('SnapshotReasonRepository', () => {
  let repository: SnapshotReasonRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new SnapshotReasonRepository();
  });

  describe('findAllActive', () => {
    it('should find all active snapshot reasons ordered by order', async () => {
      const prismaReasons = [
        createMockSnapshotReason({ id: 'reason-1', label: 'Reason 1', order: 1 }),
        createMockSnapshotReason({ id: 'reason-2', label: 'Reason 2', order: 2 }),
      ];

      mockPrismaClient.snapshotReason.findMany.mockResolvedValue(prismaReasons);

      const result = await repository.findAllActive();

      expect(mockPrismaClient.snapshotReason.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('reason-1');
      expect(result[0].label).toBe('Reason 1');
      expect(result[0].order).toBe(1);
      expect(result[1].order).toBe(2);
    });

    it('should return empty array when no active reasons found', async () => {
      mockPrismaClient.snapshotReason.findMany.mockResolvedValue([]);

      const result = await repository.findAllActive();

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should find a snapshot reason by id', async () => {
      const prismaReason = createMockSnapshotReason({
        id: 'reason-id',
        label: 'Test Reason',
        code: 'TEST_REASON',
        isDefault: true,
        isActive: true,
        order: 5,
      });

      mockPrismaClient.snapshotReason.findUnique.mockResolvedValue(prismaReason);

      const result = await repository.findById('reason-id');

      expect(mockPrismaClient.snapshotReason.findUnique).toHaveBeenCalledWith({
        where: { id: 'reason-id' },
      });
      expect(result).not.toBeNull();
      expect(result?.id).toBe('reason-id');
      expect(result?.label).toBe('Test Reason');
      expect(result?.code).toBe('TEST_REASON');
      expect(result?.isDefault).toBe(true);
      expect(result?.isActive).toBe(true);
      expect(result?.order).toBe(5);
    });

    it('should return null when snapshot reason not found', async () => {
      mockPrismaClient.snapshotReason.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByCode', () => {
    it('should find a snapshot reason by code', async () => {
      const prismaReason = createMockSnapshotReason({
        code: 'TEST_REASON',
        label: 'Test Reason',
      });

      mockPrismaClient.snapshotReason.findUnique.mockResolvedValue(prismaReason);

      const result = await repository.findByCode('TEST_REASON');

      expect(mockPrismaClient.snapshotReason.findUnique).toHaveBeenCalledWith({
        where: { code: 'TEST_REASON' },
      });
      expect(result).not.toBeNull();
      expect(result?.code).toBe('TEST_REASON');
    });

    it('should return null when snapshot reason not found by code', async () => {
      mockPrismaClient.snapshotReason.findUnique.mockResolvedValue(null);

      const result = await repository.findByCode('NON_EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new snapshot reason', async () => {
      const data = {
        label: 'New Reason',
        code: 'NEW_REASON',
        isDefault: false,
        order: 10,
      };

      const prismaReason = createMockSnapshotReason({
        id: 'new-reason-id',
        ...data,
        isActive: true,
      });

      mockPrismaClient.snapshotReason.create.mockResolvedValue(prismaReason);

      const result = await repository.create(data);

      expect(mockPrismaClient.snapshotReason.create).toHaveBeenCalledWith({
        data: {
          label: data.label,
          code: data.code,
          isDefault: false,
          order: data.order,
        },
      });
      expect(result.id).toBe('new-reason-id');
      expect(result.label).toBe('New Reason');
      expect(result.code).toBe('NEW_REASON');
      expect(result.isDefault).toBe(false);
      expect(result.isActive).toBe(true);
    });

    it('should create a snapshot reason with isDefault true', async () => {
      const data = {
        label: 'Default Reason',
        code: 'DEFAULT_REASON',
        isDefault: true,
        order: 0,
      };

      const prismaReason = createMockSnapshotReason({
        id: 'default-reason-id',
        ...data,
      });

      mockPrismaClient.snapshotReason.create.mockResolvedValue(prismaReason);

      const result = await repository.create(data);

      expect(mockPrismaClient.snapshotReason.create).toHaveBeenCalledWith({
        data: {
          label: data.label,
          code: data.code,
          isDefault: true,
          order: data.order,
        },
      });
      expect(result.isDefault).toBe(true);
    });
  });

  describe('update', () => {
    it('should update a snapshot reason', async () => {
      const updateData = {
        label: 'Updated Label',
        order: 20,
        isActive: false,
      };

      const prismaReason = createMockSnapshotReason({
        id: 'reason-id',
        ...updateData,
      });

      mockPrismaClient.snapshotReason.update.mockResolvedValue(prismaReason);

      const result = await repository.update('reason-id', updateData);

      expect(mockPrismaClient.snapshotReason.update).toHaveBeenCalledWith({
        where: { id: 'reason-id' },
        data: updateData,
      });
      expect(result.id).toBe('reason-id');
      expect(result.label).toBe('Updated Label');
      expect(result.order).toBe(20);
      expect(result.isActive).toBe(false);
    });

    it('should update only provided fields', async () => {
      const updateData = {
        label: 'New Label',
      };

      const prismaReason = createMockSnapshotReason({
        id: 'reason-id',
        label: 'New Label',
      });

      mockPrismaClient.snapshotReason.update.mockResolvedValue(prismaReason);

      const result = await repository.update('reason-id', updateData);

      expect(mockPrismaClient.snapshotReason.update).toHaveBeenCalledWith({
        where: { id: 'reason-id' },
        data: updateData,
      });
      expect(result.label).toBe('New Label');
    });
  });

  describe('softDelete', () => {
    it('should soft delete a snapshot reason by setting isActive to false', async () => {
      const prismaReason = createMockSnapshotReason({
        id: 'reason-id',
        isActive: false,
      });

      mockPrismaClient.snapshotReason.update.mockResolvedValue(prismaReason);

      await repository.softDelete('reason-id');

      expect(mockPrismaClient.snapshotReason.update).toHaveBeenCalledWith({
        where: { id: 'reason-id' },
        data: { isActive: false },
      });
    });
  });

  describe('updateBatch', () => {
    it('should update multiple snapshot reasons in batch', async () => {
      const reasons = [
        { id: 'reason-1', label: 'Updated 1', order: 1 },
        { id: 'reason-2', label: 'Updated 2', order: 2, isActive: false },
      ];

      mockPrismaClient.snapshotReason.update.mockResolvedValue({});

      await repository.updateBatch(reasons);

      expect(mockPrismaClient.snapshotReason.update).toHaveBeenCalledTimes(2);
      expect(mockPrismaClient.snapshotReason.update).toHaveBeenCalledWith({
        where: { id: 'reason-1' },
        data: {
          label: 'Updated 1',
          order: 1,
          isActive: undefined,
        },
      });
      expect(mockPrismaClient.snapshotReason.update).toHaveBeenCalledWith({
        where: { id: 'reason-2' },
        data: {
          label: 'Updated 2',
          order: 2,
          isActive: false,
        },
      });
    });

    it('should handle empty batch update', async () => {
      await repository.updateBatch([]);

      expect(mockPrismaClient.snapshotReason.update).not.toHaveBeenCalled();
    });
  });
});

