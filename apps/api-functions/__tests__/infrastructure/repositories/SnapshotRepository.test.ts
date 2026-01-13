import { SnapshotRepository } from '../../../src/infrastructure/repositories/SnapshotRepository';
import { getCentralAmericaTime } from '../../../src/utils/dateUtils';
import { createMockPrismaClient, mockDate } from '../../shared/mocks';

jest.mock('../../../src/utils/dateUtils');
jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();
const mockGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;

describe('SnapshotRepository', () => {
  let repository: SnapshotRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new SnapshotRepository();
    mockGetCentralAmericaTime.mockReturnValue(mockDate);
  });

  describe('create', () => {
    it('should create a snapshot successfully', async () => {
      const snapshotData = {
        supervisorId: 'supervisor-id',
        psoId: 'pso-id',
        reasonId: 'reason-id',
        description: 'Test description',
        imageUrl: 'https://example.com/image.jpg',
      };

      const createdSnapshot = {
        id: 'snapshot-id',
      };

      mockPrismaClient.snapshot.create.mockResolvedValue(createdSnapshot);

      const result = await repository.create(
        snapshotData.supervisorId,
        snapshotData.psoId,
        snapshotData.reasonId,
        snapshotData.description,
        snapshotData.imageUrl
      );

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.snapshot.create).toHaveBeenCalledWith({
        data: {
          supervisorId: snapshotData.supervisorId,
          psoId: snapshotData.psoId,
          reasonId: snapshotData.reasonId,
          description: snapshotData.description,
          imageUrl: snapshotData.imageUrl,
          takenAt: mockDate,
        },
      });
      expect(result.id).toBe('snapshot-id');
    });

    it('should create a snapshot with provided snapshotId', async () => {
      const snapshotId = 'provided-snapshot-id';
      const createdSnapshot = {
        id: snapshotId,
      };

      mockPrismaClient.snapshot.create.mockResolvedValue(createdSnapshot);

      const result = await repository.create(
        'supervisor-id',
        'pso-id',
        'reason-id',
        undefined,
        'https://example.com/image.jpg',
        snapshotId
      );

      expect(mockPrismaClient.snapshot.create).toHaveBeenCalledWith({
        data: {
          id: snapshotId,
          supervisorId: 'supervisor-id',
          psoId: 'pso-id',
          reasonId: 'reason-id',
          description: null,
          imageUrl: 'https://example.com/image.jpg',
          takenAt: mockDate,
        },
      });
      expect(result.id).toBe(snapshotId);
    });

    it('should create a snapshot with null description when undefined', async () => {
      const createdSnapshot = {
        id: 'snapshot-id',
      };

      mockPrismaClient.snapshot.create.mockResolvedValue(createdSnapshot);

      await repository.create(
        'supervisor-id',
        'pso-id',
        'reason-id',
        undefined,
        'https://example.com/image.jpg'
      );

      expect(mockPrismaClient.snapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: null,
        }),
      });
    });
  });

  describe('findById', () => {
    it('should find a snapshot by id', async () => {
      const snapshot = {
        id: 'snapshot-id',
        imageUrl: 'https://example.com/image.jpg',
      };

      mockPrismaClient.snapshot.findUnique.mockResolvedValue(snapshot);

      const result = await repository.findById('snapshot-id');

      expect(mockPrismaClient.snapshot.findUnique).toHaveBeenCalledWith({
        where: { id: 'snapshot-id' },
        select: { id: true, imageUrl: true },
      });
      expect(result).not.toBeNull();
      expect(result?.id).toBe('snapshot-id');
      expect(result?.imageUrl).toBe('https://example.com/image.jpg');
    });

    it('should return null when snapshot not found', async () => {
      mockPrismaClient.snapshot.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('should delete a snapshot by id', async () => {
      mockPrismaClient.snapshot.delete.mockResolvedValue({} as any);

      await repository.deleteById('snapshot-id');

      expect(mockPrismaClient.snapshot.delete).toHaveBeenCalledWith({
        where: { id: 'snapshot-id' },
      });
    });
  });

  describe('findAllWithRelations', () => {
    it('should find all snapshots with relations', async () => {
      const snapshots = [
        {
          id: 'snapshot-1',
          reason: {
            id: 'reason-1',
            label: 'Reason 1',
            code: 'REASON_1',
          },
          description: 'Description 1',
          imageUrl: 'https://example.com/image1.jpg',
          takenAt: mockDate,
          supervisor: {
            fullName: 'Supervisor Name',
          },
          pso: {
            fullName: 'PSO Name',
            email: 'pso@example.com',
          },
        },
        {
          id: 'snapshot-2',
          reason: {
            id: 'reason-2',
            label: 'Reason 2',
            code: 'REASON_2',
          },
          description: null,
          imageUrl: 'https://example.com/image2.jpg',
          takenAt: mockDate,
          supervisor: {
            fullName: 'Supervisor Name 2',
          },
          pso: {
            fullName: 'PSO Name 2',
            email: 'pso2@example.com',
          },
        },
      ];

      mockPrismaClient.snapshot.findMany.mockResolvedValue(snapshots);

      const result = await repository.findAllWithRelations();

      expect(mockPrismaClient.snapshot.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          reason: {
            select: {
              id: true,
              label: true,
              code: true,
            },
          },
          description: true,
          imageUrl: true,
          takenAt: true,
          supervisor: { select: { fullName: true } },
          pso: { select: { fullName: true, email: true } },
        },
        orderBy: { takenAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('snapshot-1');
      expect(result[0].reason.label).toBe('Reason 1');
      expect(result[0].supervisor.fullName).toBe('Supervisor Name');
      expect(result[0].pso.fullName).toBe('PSO Name');
      expect(result[1].description).toBeNull();
    });

    it('should return empty array when no snapshots found', async () => {
      mockPrismaClient.snapshot.findMany.mockResolvedValue([]);

      const result = await repository.findAllWithRelations();

      expect(result).toHaveLength(0);
    });
  });
});

