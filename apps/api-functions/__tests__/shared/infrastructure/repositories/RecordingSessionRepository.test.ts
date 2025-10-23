/**
 * @fileoverview RecordingSessionRepository tests
 * @description Unit tests for RecordingSessionRepository
 */

import { RecordingSessionRepository } from '../../../../shared/infrastructure/repositories/RecordingSessionRepository';
import { RecordingSession } from '../../../../shared/domain/entities/RecordingSession';
import { RecordingStatus } from '@prisma/client';
import prisma from '../../../../shared/infrastructure/database/PrismaClientService';

// Mock Prisma client
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  recordingSession: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  user: {
    findMany: jest.fn()
  }
}));

// Mock @prisma/client
jest.mock('@prisma/client', () => ({
  RecordingStatus: {
    Active: 'Active',
    Completed: 'Completed',
    Failed: 'Failed'
  }
}));

// Mock dateUtils
jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn(() => new Date('2023-01-01T00:00:00Z'))
}));

describe('RecordingSessionRepository', () => {
  let repository: RecordingSessionRepository;
  let mockPrisma: any;

  beforeEach(() => {
    repository = new RecordingSessionRepository();
    mockPrisma = prisma as any;
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return recording session when found', async () => {
      const mockSession = {
        id: 'session-123',
        roomName: 'test-room',
        egressId: 'egress-123',
        userId: 'user-123',
        subjectUserId: 'subject-123',
        subjectLabel: 'Test Subject',
        status: RecordingStatus.Active,
        blobPath: 'path/to/blob',
        blobUrl: null,
        startedAt: '2023-01-01T00:00:00Z',
        stoppedAt: null,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        user: {
          email: 'test@example.com',
          fullName: 'Test User'
        }
      };

      mockPrisma.recordingSession.findUnique.mockResolvedValue(mockSession);

      const result = await repository.findById('session-123');

      expect(result).toBeInstanceOf(RecordingSession);
      expect(mockPrisma.recordingSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });
    });

    it('should return null when session not found', async () => {
      mockPrisma.recordingSession.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error when database operation fails', async () => {
      mockPrisma.recordingSession.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(repository.findById('session-123'))
        .rejects.toThrow('Failed to find recording session: Database error');
    });
  });

  describe('list', () => {
    it('should return recording sessions with filters', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          roomName: 'test-room',
          egressId: 'egress-1',
          userId: 'user-1',
          subjectUserId: 'subject-1',
          subjectLabel: 'Subject 1',
          status: RecordingStatus.Active,
          blobPath: 'path/1',
          blobUrl: null,
          startedAt: '2023-01-01T00:00:00Z',
          stoppedAt: null,
          createdAt: new Date('2023-01-01T00:00:00Z'),
          updatedAt: new Date('2023-01-01T00:00:00Z'),
          user: {
            email: 'user1@example.com',
            fullName: 'User 1'
          }
        }
      ];

      mockPrisma.recordingSession.findMany.mockResolvedValue(mockSessions);

      const params = {
        roomName: 'test-room',
        orderByCreatedAt: 'desc' as const,
        limit: 10
      };

      const result = await repository.list(params);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(RecordingSession);
      expect(mockPrisma.recordingSession.findMany).toHaveBeenCalledWith({
        where: { roomName: 'test-room' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });
    });

    it('should return recording sessions without room filter', async () => {
      const mockSessions: any[] = [];
      mockPrisma.recordingSession.findMany.mockResolvedValue(mockSessions);

      const params = {
        orderByCreatedAt: 'asc' as const,
        limit: 5
      };

      const result = await repository.list(params);

      expect(result).toHaveLength(0);
      expect(mockPrisma.recordingSession.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'asc' },
        take: 5,
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });
    });

    it('should throw error when database operation fails', async () => {
      mockPrisma.recordingSession.findMany.mockRejectedValue(new Error('Database error'));

      const params = {
        orderByCreatedAt: 'desc' as const,
        limit: 10
      };

      await expect(repository.list(params))
        .rejects.toThrow('Failed to list recording sessions: Database error');
    });
  });

  describe('getUsersByIds', () => {
    it('should return users by IDs', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          fullName: 'User 1'
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          fullName: 'User 2'
        }
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await repository.getUsersByIds(['user-1', 'user-2']);

      expect(result).toEqual(mockUsers);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'user-2'] } },
        select: { id: true, fullName: true, email: true }
      });
    });

    it('should return empty array when no users found', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await repository.getUsersByIds(['non-existent']);

      expect(result).toEqual([]);
    });

    it('should throw error when database operation fails', async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

      await expect(repository.getUsersByIds(['user-1']))
        .rejects.toThrow('Failed to get users by IDs: Database error');
    });
  });

  describe('createActive', () => {
    it('should create active recording session', async () => {
      const mockSession = {
        id: 'session-123',
        roomName: 'test-room',
        egressId: 'egress-123',
        userId: 'user-123',
        subjectUserId: 'subject-123',
        subjectLabel: 'Test Subject',
        status: RecordingStatus.Active,
        blobPath: 'path/to/blob',
        blobUrl: null,
        startedAt: '2023-01-01T00:00:00Z',
        stoppedAt: null,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        user: {
          email: 'test@example.com',
          fullName: 'Test User'
        }
      };

      mockPrisma.recordingSession.create.mockResolvedValue(mockSession);

      const data = {
        roomName: 'test-room',
        egressId: 'egress-123',
        userId: 'user-123',
        subjectUserId: 'subject-123',
        subjectLabel: 'Test Subject',
        blobPath: 'path/to/blob',
        startedAt: '2023-01-01T00:00:00Z'
      };

      const result = await repository.createActive(data);

      expect(result).toBeInstanceOf(RecordingSession);
      expect(mockPrisma.recordingSession.create).toHaveBeenCalledWith({
        data: {
          roomName: 'test-room',
          egressId: 'egress-123',
          userId: 'user-123',
          subjectUserId: 'subject-123',
          subjectLabel: 'Test Subject',
          status: RecordingStatus.Active,
          blobPath: 'path/to/blob',
          startedAt: '2023-01-01T00:00:00Z',
          createdAt: new Date('2023-01-01T00:00:00Z'),
          updatedAt: new Date('2023-01-01T00:00:00Z')
        },
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });
    });

    it('should throw error when database operation fails', async () => {
      mockPrisma.recordingSession.create.mockRejectedValue(new Error('Database error'));

      const data = {
        roomName: 'test-room',
        egressId: 'egress-123',
        userId: 'user-123',
        subjectUserId: 'subject-123',
        subjectLabel: 'Test Subject',
        blobPath: 'path/to/blob',
        startedAt: '2023-01-01T00:00:00Z'
      };

      await expect(repository.createActive(data))
        .rejects.toThrow('Failed to create recording session: Database error');
    });
  });

  describe('complete', () => {
    it('should mark recording session as completed', async () => {
      mockPrisma.recordingSession.update.mockResolvedValue({});

      await repository.complete('session-123', 'https://example.com/recording.mp4', '2023-01-01T01:00:00Z');

      expect(mockPrisma.recordingSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: {
          status: RecordingStatus.Completed,
          stoppedAt: '2023-01-01T01:00:00Z',
          blobUrl: 'https://example.com/recording.mp4'
        }
      });
    });

    it('should mark recording session as completed with null blobUrl', async () => {
      mockPrisma.recordingSession.update.mockResolvedValue({});

      await repository.complete('session-123', null, '2023-01-01T01:00:00Z');

      expect(mockPrisma.recordingSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: {
          status: RecordingStatus.Completed,
          stoppedAt: '2023-01-01T01:00:00Z',
          blobUrl: null
        }
      });
    });

    it('should throw error when database operation fails', async () => {
      mockPrisma.recordingSession.update.mockRejectedValue(new Error('Database error'));

      await expect(repository.complete('session-123', 'url', '2023-01-01T01:00:00Z'))
        .rejects.toThrow('Failed to complete recording session: Database error');
    });
  });

  describe('fail', () => {
    it('should mark recording session as failed', async () => {
      mockPrisma.recordingSession.update.mockResolvedValue({});

      await repository.fail('session-123');

      expect(mockPrisma.recordingSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { status: RecordingStatus.Failed }
      });
    });

    it('should throw error when database operation fails', async () => {
      mockPrisma.recordingSession.update.mockRejectedValue(new Error('Database error'));

      await expect(repository.fail('session-123'))
        .rejects.toThrow('Failed to mark recording session as failed: Database error');
    });
  });

  describe('deleteById', () => {
    it('should delete recording session', async () => {
      mockPrisma.recordingSession.delete.mockResolvedValue({});

      await repository.deleteById('session-123');

      expect(mockPrisma.recordingSession.delete).toHaveBeenCalledWith({
        where: { id: 'session-123' }
      });
    });

    it('should throw error when database operation fails', async () => {
      mockPrisma.recordingSession.delete.mockRejectedValue(new Error('Database error'));

      await expect(repository.deleteById('session-123'))
        .rejects.toThrow('Failed to delete recording session: Database error');
    });
  });

  describe('findActiveByRoom', () => {
    it('should return active recording sessions by room', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          roomName: 'test-room',
          egressId: 'egress-1',
          userId: 'user-1',
          subjectUserId: 'subject-1',
          subjectLabel: 'Subject 1',
          status: RecordingStatus.Active,
          blobPath: 'path/1',
          blobUrl: null,
          startedAt: '2023-01-01T00:00:00Z',
          stoppedAt: null,
          createdAt: new Date('2023-01-01T00:00:00Z'),
          updatedAt: new Date('2023-01-01T00:00:00Z'),
          user: {
            email: 'user1@example.com',
            fullName: 'User 1'
          }
        }
      ];

      mockPrisma.recordingSession.findMany.mockResolvedValue(mockSessions);

      const result = await repository.findActiveByRoom('test-room');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(RecordingSession);
      expect(mockPrisma.recordingSession.findMany).toHaveBeenCalledWith({
        where: { roomName: 'test-room', status: RecordingStatus.Active },
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });
    });

    it('should throw error when database operation fails', async () => {
      mockPrisma.recordingSession.findMany.mockRejectedValue(new Error('Database error'));

      await expect(repository.findActiveByRoom('test-room'))
        .rejects.toThrow('Failed to find active recordings by room: Database error');
    });
  });

  describe('findActiveBySubject', () => {
    it('should return active recording sessions by subject user', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          roomName: 'test-room',
          egressId: 'egress-1',
          userId: 'user-1',
          subjectUserId: 'subject-123',
          subjectLabel: 'Subject 1',
          status: RecordingStatus.Active,
          blobPath: 'path/1',
          blobUrl: null,
          startedAt: '2023-01-01T00:00:00Z',
          stoppedAt: null,
          createdAt: new Date('2023-01-01T00:00:00Z'),
          updatedAt: new Date('2023-01-01T00:00:00Z'),
          user: {
            email: 'user1@example.com',
            fullName: 'User 1'
          }
        }
      ];

      mockPrisma.recordingSession.findMany.mockResolvedValue(mockSessions);

      const result = await repository.findActiveBySubject('subject-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(RecordingSession);
      expect(mockPrisma.recordingSession.findMany).toHaveBeenCalledWith({
        where: { subjectUserId: 'subject-123', status: RecordingStatus.Active },
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });
    });

    it('should throw error when database operation fails', async () => {
      mockPrisma.recordingSession.findMany.mockRejectedValue(new Error('Database error'));

      await expect(repository.findActiveBySubject('subject-123'))
        .rejects.toThrow('Failed to find active recordings by subject: Database error');
    });
  });

  describe('findActiveByInitiator', () => {
    it('should return active recording sessions by initiator user', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          roomName: 'test-room',
          egressId: 'egress-1',
          userId: 'user-123',
          subjectUserId: 'subject-1',
          subjectLabel: 'Subject 1',
          status: RecordingStatus.Active,
          blobPath: 'path/1',
          blobUrl: null,
          startedAt: '2023-01-01T00:00:00Z',
          stoppedAt: null,
          createdAt: new Date('2023-01-01T00:00:00Z'),
          updatedAt: new Date('2023-01-01T00:00:00Z'),
          user: {
            email: 'user1@example.com',
            fullName: 'User 1'
          }
        }
      ];

      mockPrisma.recordingSession.findMany.mockResolvedValue(mockSessions);

      const result = await repository.findActiveByInitiator('user-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(RecordingSession);
      expect(mockPrisma.recordingSession.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', status: RecordingStatus.Active },
        include: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      });
    });

    it('should throw error when database operation fails', async () => {
      mockPrisma.recordingSession.findMany.mockRejectedValue(new Error('Database error'));

      await expect(repository.findActiveByInitiator('user-123'))
        .rejects.toThrow('Failed to find active recordings by initiator: Database error');
    });
  });
});
