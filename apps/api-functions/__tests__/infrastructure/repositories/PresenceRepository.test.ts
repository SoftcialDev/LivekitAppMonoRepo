import { PresenceRepository } from '../../../src/infrastructure/repositories/PresenceRepository';
import { Presence } from '../../../src/domain/entities/Presence';
import { Status } from '../../../src/domain/enums/Status';
import { getCentralAmericaTime } from '../../../src/utils/dateUtils';
import { PrismaClient } from '@prisma/client';
import { createMockPrismaClient, mockDate } from '../../shared/mocks';

jest.mock('../../../src/utils/dateUtils');
jest.mock('@prisma/client');

const mockGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;

describe('PresenceRepository', () => {
  let repository: PresenceRepository;
  let mockPrismaClient: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = createMockPrismaClient();
    repository = new PresenceRepository(mockPrismaClient as unknown as PrismaClient);
    mockGetCentralAmericaTime.mockReturnValue(mockDate);
  });

  describe('upsertPresence', () => {
    it('should create a new presence record', async () => {
      const userId = 'user-id';
      const status = Status.Online;
      const lastSeenAt = new Date('2024-01-01T10:00:00.000Z');

      (mockPrismaClient.presence.upsert as jest.Mock).mockResolvedValue({} as any);

      await repository.upsertPresence(userId, status, lastSeenAt);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.presence.upsert).toHaveBeenCalledWith({
        where: { userId },
        create: {
          userId,
          status: status as any,
          lastSeenAt,
          updatedAt: mockDate,
        },
        update: {
          status: status as any,
          lastSeenAt,
          updatedAt: mockDate,
        },
      });
    });

    it('should update existing presence record', async () => {
      const userId = 'user-id';
      const status = Status.Offline;
      const lastSeenAt = new Date('2024-01-01T11:00:00.000Z');

      (mockPrismaClient.presence.upsert as jest.Mock).mockResolvedValue({} as any);

      await repository.upsertPresence(userId, status, lastSeenAt);

      expect(mockPrismaClient.presence.upsert).toHaveBeenCalledWith({
        where: { userId },
        create: {
          userId,
          status: status as any,
          lastSeenAt,
          updatedAt: mockDate,
        },
        update: {
          status: status as any,
          lastSeenAt,
          updatedAt: mockDate,
        },
      });
    });
  });

  describe('findPresenceByUserId', () => {
    it('should find presence by user id', async () => {
      const prismaPresence = {
        id: 'presence-id',
        userId: 'user-id',
        status: 'online',
        lastSeenAt: mockDate,
        updatedAt: mockDate,
      };

      (mockPrismaClient.presence.findFirst as jest.Mock).mockResolvedValue(prismaPresence);

      const result = await repository.findPresenceByUserId('user-id');

      expect(mockPrismaClient.presence.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        orderBy: { lastSeenAt: 'desc' },
      });
      expect(result).toBeInstanceOf(Presence);
      expect(result?.userId).toBe('user-id');
    });

    it('should return null when presence not found', async () => {
      (mockPrismaClient.presence.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.findPresenceByUserId('user-id');

      expect(result).toBeNull();
    });
  });

  describe('createPresenceHistory', () => {
    it('should create a new presence history entry', async () => {
      const userId = 'user-id';
      const connectedAt = new Date('2024-01-01T10:00:00.000Z');

      (mockPrismaClient.presenceHistory.create as jest.Mock).mockResolvedValue({} as any);

      await repository.createPresenceHistory(userId, connectedAt);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.presenceHistory.create).toHaveBeenCalledWith({
        data: {
          userId,
          connectedAt,
          updatedAt: mockDate,
        },
      });
    });
  });

  describe('closeOpenPresenceHistory', () => {
    it('should close open presence history entry', async () => {
      const userId = 'user-id';
      const disconnectedAt = new Date('2024-01-01T11:00:00.000Z');
      const openHistory = {
        id: 'history-id',
        userId,
        connectedAt: new Date('2024-01-01T10:00:00.000Z'),
        disconnectedAt: null,
        updatedAt: mockDate,
      };

      (mockPrismaClient.presenceHistory.findFirst as jest.Mock).mockResolvedValue(openHistory);
      (mockPrismaClient.presenceHistory.update as jest.Mock).mockResolvedValue({} as any);
      (mockPrismaClient.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return await callback(mockPrismaClient);
      });

      await repository.closeOpenPresenceHistory(userId, disconnectedAt);

      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
      expect(mockPrismaClient.presenceHistory.findFirst).toHaveBeenCalledWith({
        where: { userId, disconnectedAt: null },
        orderBy: { connectedAt: 'desc' },
      });
      expect(mockPrismaClient.presenceHistory.update).toHaveBeenCalledWith({
        where: { id: 'history-id' },
        data: { disconnectedAt },
      });
    });

    it('should not update if no open history found', async () => {
      const userId = 'user-id';
      const disconnectedAt = new Date('2024-01-01T11:00:00.000Z');

      (mockPrismaClient.presenceHistory.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrismaClient.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return await callback(mockPrismaClient);
      });

      await repository.closeOpenPresenceHistory(userId, disconnectedAt);

      expect(mockPrismaClient.presenceHistory.findFirst).toHaveBeenCalled();
      expect(mockPrismaClient.presenceHistory.update).not.toHaveBeenCalled();
    });
  });
});

