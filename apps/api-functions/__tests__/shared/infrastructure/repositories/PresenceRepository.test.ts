/**
 * @fileoverview PresenceRepository tests
 * @description Unit tests for PresenceRepository
 */

import { PresenceRepository } from '../../../../shared/infrastructure/repositories/PresenceRepository';
import { Presence } from '../../../../shared/domain/entities/Presence';
import { Status } from '../../../../shared/domain/enums/Status';
import { PrismaClient } from '@prisma/client';

// Mock Prisma client
const mockPrisma = {
  presence: {
    upsert: jest.fn(),
    findFirst: jest.fn()
  },
  presenceHistory: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn()
  },
  $transaction: jest.fn()
};

// Mock dateUtils
jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2023-01-01T00:00:00Z'))
}));

describe('PresenceRepository', () => {
  let repository: PresenceRepository;
  let prismaClient: PrismaClient;

  beforeEach(() => {
    prismaClient = mockPrisma as any;
    repository = new PresenceRepository(prismaClient);
    jest.clearAllMocks();
  });

  describe('upsertPresence', () => {
    it('should upsert presence for user', async () => {
      mockPrisma.presence.upsert.mockResolvedValue({});

      await repository.upsertPresence('user-123', Status.Online, new Date('2023-01-01T00:00:00Z'));

      expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        create: { 
          userId: 'user-123', 
          status: Status.Online, 
          lastSeenAt: new Date('2023-01-01T00:00:00Z'), 
          updatedAt: new Date('2023-01-01T00:00:00Z') 
        },
        update: { 
          status: Status.Online, 
          lastSeenAt: new Date('2023-01-01T00:00:00Z'), 
          updatedAt: new Date('2023-01-01T00:00:00Z') 
        }
      });
    });

    it('should handle different status values', async () => {
      mockPrisma.presence.upsert.mockResolvedValue({});

      await repository.upsertPresence('user-123', Status.Offline, new Date('2023-01-01T01:00:00Z'));

      expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        create: { 
          userId: 'user-123', 
          status: Status.Offline, 
          lastSeenAt: new Date('2023-01-01T01:00:00Z'), 
          updatedAt: new Date('2023-01-01T00:00:00Z') 
        },
        update: { 
          status: Status.Offline, 
          lastSeenAt: new Date('2023-01-01T01:00:00Z'), 
          updatedAt: new Date('2023-01-01T00:00:00Z') 
        }
      });
    });
  });

  describe('findPresenceByUserId', () => {
    it('should return presence when found', async () => {
      const mockPresence = {
        id: 'presence-123',
        userId: 'user-123',
        status: Status.Online,
        lastSeenAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      mockPrisma.presence.findFirst.mockResolvedValue(mockPresence);

      const result = await repository.findPresenceByUserId('user-123');

      expect(result).toBeInstanceOf(Presence);
      expect(mockPrisma.presence.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { lastSeenAt: 'desc' }
      });
    });

    it('should return null when presence not found', async () => {
      mockPrisma.presence.findFirst.mockResolvedValue(null);

      const result = await repository.findPresenceByUserId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createPresenceHistory', () => {
    it('should create presence history entry', async () => {
      mockPrisma.presenceHistory.create.mockResolvedValue({});

      await repository.createPresenceHistory('user-123', new Date('2023-01-01T00:00:00Z'));

      expect(mockPrisma.presenceHistory.create).toHaveBeenCalledWith({
        data: { 
          userId: 'user-123', 
          connectedAt: new Date('2023-01-01T00:00:00Z'),
          updatedAt: new Date('2023-01-01T00:00:00Z')
        }
      });
    });
  });

  describe('closeOpenPresenceHistory', () => {
    it('should close open presence history entry', async () => {
      const mockOpenHistory = {
        id: 'history-123',
        userId: 'user-123',
        connectedAt: new Date('2023-01-01T00:00:00Z'),
        disconnectedAt: null,
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          presenceHistory: {
            findFirst: jest.fn().mockResolvedValue(mockOpenHistory),
            update: jest.fn().mockResolvedValue({})
          }
        };
        return await callback(tx);
      });

      mockPrisma.$transaction.mockImplementation(mockTransaction);

      await repository.closeOpenPresenceHistory('user-123', new Date('2023-01-01T01:00:00Z'));

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should handle case when no open history exists', async () => {
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          presenceHistory: {
            findFirst: jest.fn().mockResolvedValue(null),
            update: jest.fn()
          }
        };
        return await callback(tx);
      });

      mockPrisma.$transaction.mockImplementation(mockTransaction);

      await repository.closeOpenPresenceHistory('user-123', new Date('2023-01-01T01:00:00Z'));

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
