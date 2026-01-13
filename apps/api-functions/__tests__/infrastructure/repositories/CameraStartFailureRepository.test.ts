import { CameraStartFailureRepository } from '../../../src/infrastructure/repositories/CameraStartFailureRepository';
import { CameraFailureStage } from '@prisma/client';
import { createMockPrismaClient, createMockCameraStartFailure, mockDate } from '../../shared/mocks';

jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();

describe('CameraStartFailureRepository', () => {
  let repository: CameraStartFailureRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new CameraStartFailureRepository();
  });

  describe('create', () => {
    it('should create a camera start failure successfully', async () => {
      const data = {
        userAdId: 'user-ad-id',
        userEmail: 'test@example.com',
        stage: CameraFailureStage.Enumerate,
        errorName: 'Error',
        errorMessage: 'Error message',
        deviceCount: 2,
        devicesSnapshot: { devices: [] },
        attempts: [],
        metadata: {},
        createdAtCentralAmerica: '2024-01-01T12:00:00.000Z',
      };

      mockPrismaClient.user.findUnique.mockResolvedValue({ id: 'user-id' });
      mockPrismaClient.cameraStartFailure.create.mockResolvedValue(createMockCameraStartFailure());

      await repository.create(data);

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { azureAdObjectId: data.userAdId },
        select: { id: true },
      });
      expect(mockPrismaClient.cameraStartFailure.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id',
          userAdId: data.userAdId,
          userEmail: data.userEmail,
          stage: data.stage,
          errorName: data.errorName,
          errorMessage: data.errorMessage,
          deviceCount: data.deviceCount,
          devicesSnapshot: data.devicesSnapshot,
          attempts: data.attempts,
          metadata: data.metadata,
          createdAtCentralAmerica: data.createdAtCentralAmerica,
        },
      });
    });

    it('should handle null user', async () => {
      const data = {
        userAdId: 'user-ad-id',
        userEmail: 'test@example.com',
        stage: CameraFailureStage.Enumerate,
        createdAtCentralAmerica: '2024-01-01T12:00:00.000Z',
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockPrismaClient.cameraStartFailure.create.mockResolvedValue(createMockCameraStartFailure());

      await repository.create(data);

      expect(mockPrismaClient.cameraStartFailure.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: undefined,
        }),
      });
    });

    it('should handle optional fields', async () => {
      const data = {
        userAdId: 'user-ad-id',
        stage: CameraFailureStage.Enumerate,
        createdAtCentralAmerica: '2024-01-01T12:00:00.000Z',
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockPrismaClient.cameraStartFailure.create.mockResolvedValue(createMockCameraStartFailure());

      await repository.create(data);

      expect(mockPrismaClient.cameraStartFailure.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceCount: undefined,
          devicesSnapshot: undefined,
          attempts: undefined,
          metadata: undefined,
        }),
      });
    });
  });

  describe('list', () => {
    it('should list camera start failures without params', async () => {
      const prismaFailures = [
        createMockCameraStartFailure({ id: 'failure-1' }),
        createMockCameraStartFailure({ id: 'failure-2' }),
      ];

      mockPrismaClient.cameraStartFailure.findMany.mockResolvedValue(prismaFailures);

      const result = await repository.list();

      expect(mockPrismaClient.cameraStartFailure.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        take: undefined,
        skip: undefined,
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('failure-1');
    });

    it('should list camera start failures with query params', async () => {
      const params = {
        stage: CameraFailureStage.Enumerate,
        userEmail: 'test@example.com',
        userAdId: 'user-ad-id',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        limit: 10,
        offset: 5,
      };

      const prismaFailures = [createMockCameraStartFailure()];
      mockPrismaClient.cameraStartFailure.findMany.mockResolvedValue(prismaFailures);

      await repository.list(params);

      expect(mockPrismaClient.cameraStartFailure.findMany).toHaveBeenCalledWith({
        where: {
          stage: params.stage,
          userEmail: { contains: params.userEmail, mode: 'insensitive' },
          userAdId: params.userAdId,
          createdAt: {
            gte: params.startDate,
            lte: params.endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 5,
      });
    });

    it('should handle date range with only startDate', async () => {
      const params = {
        startDate: new Date('2024-01-01'),
      };

      mockPrismaClient.cameraStartFailure.findMany.mockResolvedValue([]);

      await repository.list(params);

      expect(mockPrismaClient.cameraStartFailure.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: params.startDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: undefined,
        skip: undefined,
      });
    });

    it('should handle date range with only endDate', async () => {
      const params = {
        endDate: new Date('2024-01-31'),
      };

      mockPrismaClient.cameraStartFailure.findMany.mockResolvedValue([]);

      await repository.list(params);

      expect(mockPrismaClient.cameraStartFailure.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lte: params.endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: undefined,
        skip: undefined,
      });
    });

    it('should handle query with only stage', async () => {
      const params = {
        stage: CameraFailureStage.Permission,
      };

      mockPrismaClient.cameraStartFailure.findMany.mockResolvedValue([]);

      await repository.list(params);

      expect(mockPrismaClient.cameraStartFailure.findMany).toHaveBeenCalledWith({
        where: {
          stage: params.stage,
        },
        orderBy: { createdAt: 'desc' },
        take: undefined,
        skip: undefined,
      });
    });

    it('should handle query with only userEmail', async () => {
      const params = {
        userEmail: 'test@example.com',
      };

      mockPrismaClient.cameraStartFailure.findMany.mockResolvedValue([]);

      await repository.list(params);

      expect(mockPrismaClient.cameraStartFailure.findMany).toHaveBeenCalledWith({
        where: {
          userEmail: { contains: params.userEmail, mode: 'insensitive' },
        },
        orderBy: { createdAt: 'desc' },
        take: undefined,
        skip: undefined,
      });
    });

    it('should handle query with only userAdId', async () => {
      const params = {
        userAdId: 'user-ad-id',
      };

      mockPrismaClient.cameraStartFailure.findMany.mockResolvedValue([]);

      await repository.list(params);

      expect(mockPrismaClient.cameraStartFailure.findMany).toHaveBeenCalledWith({
        where: {
          userAdId: params.userAdId,
        },
        orderBy: { createdAt: 'desc' },
        take: undefined,
        skip: undefined,
      });
    });

    it('should handle query with both startDate and endDate', async () => {
      const params = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      mockPrismaClient.cameraStartFailure.findMany.mockResolvedValue([]);

      await repository.list(params);

      expect(mockPrismaClient.cameraStartFailure.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: params.startDate,
            lte: params.endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: undefined,
        skip: undefined,
      });
    });
  });

  describe('findById', () => {
    it('should find camera start failure by id', async () => {
      const prismaFailure = createMockCameraStartFailure({ 
        id: 'failure-id',
        userId: 'user-id',
        userAdId: 'user-ad-id',
        userEmail: 'test@example.com',
        stage: CameraFailureStage.Permission,
        errorName: 'ErrorName',
        errorMessage: 'Error message',
        deviceCount: 5,
        devicesSnapshot: { devices: [] },
        attempts: [{ result: 'Success' }],
        metadata: { key: 'value' },
        createdAt: mockDate,
        createdAtCentralAmerica: '2024-01-01T12:00:00.000Z',
      });
      mockPrismaClient.cameraStartFailure.findUnique.mockResolvedValue(prismaFailure);

      const result = await repository.findById('failure-id');

      expect(mockPrismaClient.cameraStartFailure.findUnique).toHaveBeenCalledWith({
        where: { id: 'failure-id' },
      });
      expect(result).not.toBeNull();
      expect(result?.id).toBe('failure-id');
      expect(result?.userId).toBe('user-id');
      expect(result?.userAdId).toBe('user-ad-id');
      expect(result?.userEmail).toBe('test@example.com');
      expect(result?.stage).toBe(CameraFailureStage.Permission);
      expect(result?.errorName).toBe('ErrorName');
      expect(result?.errorMessage).toBe('Error message');
      expect(result?.deviceCount).toBe(5);
      expect(result?.devicesSnapshot).toEqual({ devices: [] });
      expect(result?.attempts).toEqual([{ result: 'Success' }]);
      expect(result?.metadata).toEqual({ key: 'value' });
      expect(result?.createdAt).toEqual(mockDate);
      expect(result?.createdAtCentralAmerica).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should return null when not found', async () => {
      mockPrismaClient.cameraStartFailure.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('count', () => {
    it('should count camera start failures', async () => {
      mockPrismaClient.cameraStartFailure.count.mockResolvedValue(5);

      const result = await repository.count();

      expect(mockPrismaClient.cameraStartFailure.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(result).toBe(5);
    });

    it('should count camera start failures with query params', async () => {
      const params = {
        stage: CameraFailureStage.Enumerate,
        userEmail: 'test@example.com',
      };

      mockPrismaClient.cameraStartFailure.count.mockResolvedValue(3);

      const result = await repository.count(params);

      expect(mockPrismaClient.cameraStartFailure.count).toHaveBeenCalledWith({
        where: {
          stage: params.stage,
          userEmail: { contains: params.userEmail, mode: 'insensitive' },
        },
      });
      expect(result).toBe(3);
    });

  });
});
