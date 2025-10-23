/**
 * @fileoverview Tests for StreamingSessionRepository
 * @description Tests for streaming session data access operations
 */

import { StreamingSessionRepository } from '../../../../shared/infrastructure/repositories/StreamingSessionRepository';
import { StreamingSessionHistory } from '../../../../shared/domain/entities/StreamingSessionHistory';
import prisma from '../../../../shared/infrastructure/database/PrismaClientService';

// Mock Prisma
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  streamingSessionHistory: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  $queryRaw: jest.fn()
}));

// Mock dateUtils
jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn().mockReturnValue(new Date('2023-01-01T10:00:00Z'))
}));

describe('StreamingSessionRepository', () => {
  let streamingSessionRepository: StreamingSessionRepository;
  let mockPrismaSession: any;

  beforeEach(() => {
    jest.clearAllMocks();
    streamingSessionRepository = new StreamingSessionRepository();

    mockPrismaSession = {
      id: 'session-123',
      userId: 'user-123',
      startedAt: new Date('2023-01-01T10:00:00Z'),
      stoppedAt: new Date('2023-01-01T11:00:00Z'),
      stopReason: 'Manual',
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-01T11:00:00Z')
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create StreamingSessionRepository instance', () => {
      expect(streamingSessionRepository).toBeInstanceOf(StreamingSessionRepository);
    });
  });

  describe('getLatestSessionForUser', () => {
    it('should get latest session for user', async () => {
      (prisma.streamingSessionHistory.findFirst as jest.Mock).mockResolvedValue(mockPrismaSession);

      const result = await streamingSessionRepository.getLatestSessionForUser('user-123');

      expect(result).toBeInstanceOf(StreamingSessionHistory);
      expect(result?.id).toBe('session-123');
      expect(prisma.streamingSessionHistory.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { startedAt: 'desc' }
      });
    });

    it('should return null when no session found', async () => {
      (prisma.streamingSessionHistory.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await streamingSessionRepository.getLatestSessionForUser('user-123');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      (prisma.streamingSessionHistory.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(streamingSessionRepository.getLatestSessionForUser('user-123'))
        .rejects.toThrow('Failed to get latest session for user: Database error');
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const sessionData = {
        userId: 'user-123',
        startedAt: new Date('2023-01-01T10:00:00Z')
      };

      (prisma.streamingSessionHistory.create as jest.Mock).mockResolvedValue(mockPrismaSession);

      const result = await streamingSessionRepository.createSession(sessionData);

      expect(result).toBeInstanceOf(StreamingSessionHistory);
      expect(result?.id).toBe('session-123');
      expect(prisma.streamingSessionHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          startedAt: sessionData.startedAt,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should handle creation errors', async () => {
      const sessionData = {
        userId: 'user-123',
        startedAt: new Date('2023-01-01T10:00:00Z')
      };

      (prisma.streamingSessionHistory.create as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      await expect(streamingSessionRepository.createSession(sessionData))
        .rejects.toThrow('Failed to create session: Creation failed');
    });
  });

  describe('updateSession', () => {
    it('should update session with stoppedAt and stopReason', async () => {
      const updateData = {
        stoppedAt: new Date('2023-01-01T11:00:00Z'),
        stopReason: 'Manual'
      };

      (prisma.streamingSessionHistory.update as jest.Mock).mockResolvedValue(mockPrismaSession);

      const result = await streamingSessionRepository.updateSession('session-123', updateData);

      expect(result).toBeInstanceOf(StreamingSessionHistory);
      expect(prisma.streamingSessionHistory.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should update session with only stoppedAt', async () => {
      const updateData = {
        stoppedAt: new Date('2023-01-01T11:00:00Z')
      };

      (prisma.streamingSessionHistory.update as jest.Mock).mockResolvedValue(mockPrismaSession);

      const result = await streamingSessionRepository.updateSession('session-123', updateData);

      expect(result).toBeInstanceOf(StreamingSessionHistory);
      expect(prisma.streamingSessionHistory.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should update session with only stopReason', async () => {
      const updateData = {
        stopReason: 'Emergency'
      };

      (prisma.streamingSessionHistory.update as jest.Mock).mockResolvedValue(mockPrismaSession);

      const result = await streamingSessionRepository.updateSession('session-123', updateData);

      expect(result).toBeInstanceOf(StreamingSessionHistory);
      expect(prisma.streamingSessionHistory.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should handle update errors', async () => {
      const updateData = {
        stoppedAt: new Date('2023-01-01T11:00:00Z'),
        stopReason: 'Manual'
      };

      (prisma.streamingSessionHistory.update as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(streamingSessionRepository.updateSession('session-123', updateData))
        .rejects.toThrow('Failed to update session: Update failed');
    });
  });

  describe('getSessionsForUserInDateRange', () => {
    it('should get sessions for user in date range', async () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-01T23:59:59Z');
      const mockSessions = [mockPrismaSession, { ...mockPrismaSession, id: 'session-456' }];

      (prisma.streamingSessionHistory.findMany as jest.Mock).mockResolvedValue(mockSessions);

      const result = await streamingSessionRepository.getSessionsForUserInDateRange('user-123', startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(StreamingSessionHistory);
      expect(result[1]).toBeInstanceOf(StreamingSessionHistory);
      expect(prisma.streamingSessionHistory.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          startedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { startedAt: 'desc' }
      });
    });

    it('should return empty array when no sessions found', async () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-01T23:59:59Z');

      (prisma.streamingSessionHistory.findMany as jest.Mock).mockResolvedValue([]);

      const result = await streamingSessionRepository.getSessionsForUserInDateRange('user-123', startDate, endDate);

      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-01T23:59:59Z');

      (prisma.streamingSessionHistory.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(streamingSessionRepository.getSessionsForUserInDateRange('user-123', startDate, endDate))
        .rejects.toThrow('Failed to get sessions for user in date range: Database error');
    });
  });

  describe('getActiveSessions', () => {
    it('should get all active sessions', async () => {
      const activeSession = { ...mockPrismaSession, stoppedAt: null };
      (prisma.streamingSessionHistory.findMany as jest.Mock).mockResolvedValue([activeSession]);

      const result = await streamingSessionRepository.getActiveSessions();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(StreamingSessionHistory);
      expect(prisma.streamingSessionHistory.findMany).toHaveBeenCalledWith({
        where: { stoppedAt: null },
        include: {
          user: {
            select: {
              email: true,
              id: true
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      });
    });

    it('should return empty array when no active sessions', async () => {
      (prisma.streamingSessionHistory.findMany as jest.Mock).mockResolvedValue([]);

      const result = await streamingSessionRepository.getActiveSessions();

      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      (prisma.streamingSessionHistory.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(streamingSessionRepository.getActiveSessions())
        .rejects.toThrow('Failed to get active sessions: Database error');
    });
  });

  describe('getActiveSessionsForSupervisor', () => {
    it('should get active sessions for supervisor', async () => {
      const activeSession = { ...mockPrismaSession, stoppedAt: null };
      (prisma.streamingSessionHistory.findMany as jest.Mock).mockResolvedValue([activeSession]);

      const result = await streamingSessionRepository.getActiveSessionsForSupervisor('supervisor-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(StreamingSessionHistory);
      expect(prisma.streamingSessionHistory.findMany).toHaveBeenCalledWith({
        where: {
          stoppedAt: null,
          user: {
            supervisorId: 'supervisor-123'
          }
        },
        include: {
          user: {
            select: {
              email: true,
              id: true
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      });
    });

    it('should return empty array when no active sessions for supervisor', async () => {
      (prisma.streamingSessionHistory.findMany as jest.Mock).mockResolvedValue([]);

      const result = await streamingSessionRepository.getActiveSessionsForSupervisor('supervisor-123');

      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      (prisma.streamingSessionHistory.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(streamingSessionRepository.getActiveSessionsForSupervisor('supervisor-123'))
        .rejects.toThrow('Failed to get active sessions for supervisor: Database error');
    });
  });

  describe('stopStreamingSession', () => {
    it('should stop streaming session for user', async () => {
      const mockContext = { log: jest.fn() };
      const openSession = { ...mockPrismaSession, stoppedAt: null };
      
      (prisma.streamingSessionHistory.findFirst as jest.Mock).mockResolvedValue(openSession);
      (prisma.streamingSessionHistory.update as jest.Mock).mockResolvedValue(mockPrismaSession);

      await streamingSessionRepository.stopStreamingSession('user-123', 'Manual', mockContext);

      expect(prisma.streamingSessionHistory.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          stoppedAt: null
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      expect(prisma.streamingSessionHistory.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: {
          stoppedAt: expect.any(Date),
          stopReason: 'Manual',
          updatedAt: expect.any(Date)
        }
      });

      expect(mockContext.log).toHaveBeenCalled();
    });

    it('should handle case when no open session found', async () => {
      const mockContext = { log: jest.fn() };
      
      (prisma.streamingSessionHistory.findFirst as jest.Mock).mockResolvedValue(null);

      await streamingSessionRepository.stopStreamingSession('user-123', 'Manual', mockContext);

      expect(prisma.streamingSessionHistory.findFirst).toHaveBeenCalled();
      expect(prisma.streamingSessionHistory.update).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      (prisma.streamingSessionHistory.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(streamingSessionRepository.stopStreamingSession('user-123', 'Manual'))
        .rejects.toThrow('Failed to stop streaming session: Database error');
    });
  });

  describe('startStreamingSession', () => {
    it('should start new streaming session for user', async () => {
      (prisma.streamingSessionHistory.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.streamingSessionHistory.create as jest.Mock).mockResolvedValue(mockPrismaSession);

      await streamingSessionRepository.startStreamingSession('user-123');

      expect(prisma.streamingSessionHistory.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', stoppedAt: null },
        data: { 
          stoppedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });

      expect(prisma.streamingSessionHistory.create).toHaveBeenCalledWith({
        data: { 
          userId: 'user-123',
          startedAt: expect.any(Date),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should handle database errors', async () => {
      (prisma.streamingSessionHistory.updateMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(streamingSessionRepository.startStreamingSession('user-123'))
        .rejects.toThrow('Failed to start streaming session: Database error');
    });
  });

  describe('getLastStreamingSession', () => {
    it('should get last streaming session for user', async () => {
      (prisma.streamingSessionHistory.findFirst as jest.Mock).mockResolvedValue(mockPrismaSession);

      const result = await streamingSessionRepository.getLastStreamingSession('user-123');

      expect(result).toBeInstanceOf(StreamingSessionHistory);
      expect(result?.id).toBe('session-123');
      expect(prisma.streamingSessionHistory.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { startedAt: 'desc' }
      });
    });

    it('should return null when no session found', async () => {
      (prisma.streamingSessionHistory.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await streamingSessionRepository.getLastStreamingSession('user-123');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      (prisma.streamingSessionHistory.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(streamingSessionRepository.getLastStreamingSession('user-123'))
        .rejects.toThrow('Failed to get last streaming session: Database error');
    });
  });

  describe('isUserStreaming', () => {
    it('should return true when user is streaming', async () => {
      (prisma.streamingSessionHistory.count as jest.Mock).mockResolvedValue(1);

      const result = await streamingSessionRepository.isUserStreaming('user-123');

      expect(result).toBe(true);
      expect(prisma.streamingSessionHistory.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', stoppedAt: null }
      });
    });

    it('should return false when user is not streaming', async () => {
      (prisma.streamingSessionHistory.count as jest.Mock).mockResolvedValue(0);

      const result = await streamingSessionRepository.isUserStreaming('user-123');

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      (prisma.streamingSessionHistory.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(streamingSessionRepository.isUserStreaming('user-123'))
        .rejects.toThrow('Failed to check if user is streaming: Database error');
    });
  });

  describe('getLatestSessionsForEmails', () => {
    it('should get latest sessions for emails', async () => {
      const mockRawSessions = [
        {
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date('2023-01-01T10:00:00Z'),
          stoppedAt: null,
          createdAt: new Date('2023-01-01T10:00:00Z'),
          updatedAt: new Date('2023-01-01T10:00:00Z'),
          stopReason: null,
          email: 'user1@example.com'
        },
        {
          id: 'session-2',
          userId: 'user-2',
          startedAt: new Date('2023-01-01T11:00:00Z'),
          stoppedAt: new Date('2023-01-01T12:00:00Z'),
          createdAt: new Date('2023-01-01T11:00:00Z'),
          updatedAt: new Date('2023-01-01T12:00:00Z'),
          stopReason: 'Manual',
          email: 'user2@example.com'
        }
      ];

      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockRawSessions);

      const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      const result = await streamingSessionRepository.getLatestSessionsForEmails(emails);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        email: 'user1@example.com',
        session: expect.any(StreamingSessionHistory)
      });
      expect(result[1]).toEqual({
        email: 'user2@example.com',
        session: expect.any(StreamingSessionHistory)
      });
      expect(result[2]).toEqual({
        email: 'user3@example.com',
        session: null
      });

      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return empty array when no emails provided', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const result = await streamingSessionRepository.getLatestSessionsForEmails([]);

      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(streamingSessionRepository.getLatestSessionsForEmails(['user1@example.com']))
        .rejects.toThrow('Failed to get latest sessions for emails: Database error');
    });
  });
});
