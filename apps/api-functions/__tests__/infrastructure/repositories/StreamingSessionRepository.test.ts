import { StreamingSessionRepository } from '../../../src/infrastructure/repositories/StreamingSessionRepository';
import { StreamingSessionHistory } from '../../../src/domain/entities/StreamingSessionHistory';
import { getCentralAmericaTime } from '../../../src/utils/dateUtils';
import { wrapStreamingSessionFetchError, wrapEntityCreationError, wrapEntityUpdateError, wrapDatabaseQueryError } from '../../../src/utils/error/ErrorHelpers';
import { StreamingSessionFetchError, EntityCreationError, EntityUpdateError, DatabaseQueryError } from '../../../src/domain/errors/RepositoryErrors';
import { createMockPrismaClient, mockDate } from '../../shared/mocks';

jest.mock('../../../src/utils/dateUtils');
jest.mock('../../../src/utils/error/ErrorHelpers');
jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();
const mockGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;
const mockWrapStreamingSessionFetchError = wrapStreamingSessionFetchError as jest.MockedFunction<typeof wrapStreamingSessionFetchError>;
const mockWrapEntityCreationError = wrapEntityCreationError as jest.MockedFunction<typeof wrapEntityCreationError>;
const mockWrapEntityUpdateError = wrapEntityUpdateError as jest.MockedFunction<typeof wrapEntityUpdateError>;
const mockWrapDatabaseQueryError = wrapDatabaseQueryError as jest.MockedFunction<typeof wrapDatabaseQueryError>;

describe('StreamingSessionRepository', () => {
  let repository: StreamingSessionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new StreamingSessionRepository();
    mockGetCentralAmericaTime.mockReturnValue(mockDate);
  });

  describe('getLatestSessionForUser', () => {
    it('should get latest session for user', async () => {
      const prismaSession = {
        id: 'session-id',
        userId: 'user-id',
        startedAt: mockDate,
        stoppedAt: null,
        stopReason: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockPrismaClient.streamingSessionHistory.findFirst.mockResolvedValue(prismaSession);

      const result = await repository.getLatestSessionForUser('user-id');

      expect(mockPrismaClient.streamingSessionHistory.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        orderBy: { startedAt: 'desc' },
      });
      expect(result).toBeInstanceOf(StreamingSessionHistory);
      expect(result?.id).toBe('session-id');
    });

    it('should return null when no session found', async () => {
      mockPrismaClient.streamingSessionHistory.findFirst.mockResolvedValue(null);

      const result = await repository.getLatestSessionForUser('user-id');

      expect(result).toBeNull();
    });

    it('should throw StreamingSessionFetchError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.streamingSessionHistory.findFirst.mockRejectedValue(error);
      const wrappedError = new StreamingSessionFetchError('Failed to get latest session for user', error);
      mockWrapStreamingSessionFetchError.mockReturnValue(wrappedError);

      await expect(repository.getLatestSessionForUser('user-id')).rejects.toThrow(StreamingSessionFetchError);
      expect(mockWrapStreamingSessionFetchError).toHaveBeenCalledWith('Failed to get latest session for user', error);
    });
  });

  describe('createSession', () => {
    it('should create a new streaming session', async () => {
      const sessionData = {
        userId: 'user-id',
        startedAt: mockDate,
      };

      const prismaSession = {
        id: 'session-id',
        userId: 'user-id',
        startedAt: mockDate,
        stoppedAt: null,
        stopReason: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockPrismaClient.streamingSessionHistory.create.mockResolvedValue(prismaSession);

      const result = await repository.createSession(sessionData);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.streamingSessionHistory.create).toHaveBeenCalledWith({
        data: {
          userId: sessionData.userId,
          startedAt: sessionData.startedAt,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      });
      expect(result).toBeInstanceOf(StreamingSessionHistory);
      expect(result.id).toBe('session-id');
    });

    it('should throw EntityCreationError on create failure', async () => {
      const sessionData = {
        userId: 'user-id',
        startedAt: mockDate,
      };

      const error = new Error('Database error');
      mockPrismaClient.streamingSessionHistory.create.mockRejectedValue(error);
      const wrappedError = new EntityCreationError('Failed to create session', error);
      mockWrapEntityCreationError.mockReturnValue(wrappedError);

      await expect(repository.createSession(sessionData)).rejects.toThrow(EntityCreationError);
      expect(mockWrapEntityCreationError).toHaveBeenCalledWith('Failed to create session', error);
    });
  });

  describe('updateSession', () => {
    it('should update a streaming session', async () => {
      const updateData = {
        stoppedAt: mockDate,
        stopReason: 'User stopped',
      };

      const prismaSession = {
        id: 'session-id',
        userId: 'user-id',
        startedAt: mockDate,
        stoppedAt: mockDate,
        stopReason: 'User stopped',
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockPrismaClient.streamingSessionHistory.update.mockResolvedValue(prismaSession);

      const result = await repository.updateSession('session-id', updateData);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.streamingSessionHistory.update).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        data: {
          ...updateData,
          updatedAt: mockDate,
        },
      });
      expect(result).toBeInstanceOf(StreamingSessionHistory);
      expect(result.stopReason).toBe('User stopped');
    });

    it('should update session with only stoppedAt', async () => {
      const updateData = {
        stoppedAt: mockDate,
      };

      const prismaSession = {
        id: 'session-id',
        userId: 'user-id',
        startedAt: mockDate,
        stoppedAt: mockDate,
        stopReason: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockPrismaClient.streamingSessionHistory.update.mockResolvedValue(prismaSession);

      await repository.updateSession('session-id', updateData);

      expect(mockPrismaClient.streamingSessionHistory.update).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        data: {
          stoppedAt: mockDate,
          updatedAt: mockDate,
        },
      });
    });

    it('should throw EntityUpdateError on update failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.streamingSessionHistory.update.mockRejectedValue(error);
      const wrappedError = new EntityUpdateError('Failed to update session', error);
      mockWrapEntityUpdateError.mockReturnValue(wrappedError);

      await expect(repository.updateSession('session-id', {})).rejects.toThrow(EntityUpdateError);
      expect(mockWrapEntityUpdateError).toHaveBeenCalledWith('Failed to update session', error);
    });
  });

  describe('getSessionsForUserInDateRange', () => {
    it('should get sessions for user in date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const prismaSessions = [
        {
          id: 'session-1',
          userId: 'user-id',
          startedAt: mockDate,
          stoppedAt: null,
          stopReason: null,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      mockPrismaClient.streamingSessionHistory.findMany.mockResolvedValue(prismaSessions);

      const result = await repository.getSessionsForUserInDateRange('user-id', startDate, endDate);

      expect(mockPrismaClient.streamingSessionHistory.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          startedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { startedAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(StreamingSessionHistory);
    });

    it('should throw StreamingSessionFetchError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.streamingSessionHistory.findMany.mockRejectedValue(error);
      const wrappedError = new StreamingSessionFetchError('Failed to get sessions for user in date range', error);
      mockWrapStreamingSessionFetchError.mockReturnValue(wrappedError);

      await expect(repository.getSessionsForUserInDateRange('user-id', new Date(), new Date())).rejects.toThrow(StreamingSessionFetchError);
      expect(mockWrapStreamingSessionFetchError).toHaveBeenCalledWith('Failed to get sessions for user in date range', error);
    });
  });

  describe('getActiveSessions', () => {
    it('should get all active streaming sessions', async () => {
      const prismaSessions = [
        {
          id: 'session-1',
          userId: 'user-id',
          startedAt: mockDate,
          stoppedAt: null,
          stopReason: null,
          createdAt: mockDate,
          updatedAt: mockDate,
          user: {
            email: 'user@example.com',
            id: 'user-id',
          },
        },
      ];

      mockPrismaClient.streamingSessionHistory.findMany.mockResolvedValue(prismaSessions);

      const result = await repository.getActiveSessions();

      expect(mockPrismaClient.streamingSessionHistory.findMany).toHaveBeenCalledWith({
        where: {
          stoppedAt: null,
        },
        include: {
          user: {
            select: {
              email: true,
              id: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(StreamingSessionHistory);
    });

    it('should throw StreamingSessionFetchError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.streamingSessionHistory.findMany.mockRejectedValue(error);
      const wrappedError = new StreamingSessionFetchError('Failed to get active sessions', error);
      mockWrapStreamingSessionFetchError.mockReturnValue(wrappedError);

      await expect(repository.getActiveSessions()).rejects.toThrow(StreamingSessionFetchError);
      expect(mockWrapStreamingSessionFetchError).toHaveBeenCalledWith('Failed to get active sessions', error);
    });
  });

  describe('getActiveSessionsForSupervisor', () => {
    it('should get active sessions for supervisor', async () => {
      const prismaSessions = [
        {
          id: 'session-1',
          userId: 'user-id',
          startedAt: mockDate,
          stoppedAt: null,
          stopReason: null,
          createdAt: mockDate,
          updatedAt: mockDate,
          user: {
            email: 'user@example.com',
            id: 'user-id',
          },
        },
      ];

      mockPrismaClient.streamingSessionHistory.findMany.mockResolvedValue(prismaSessions);

      const result = await repository.getActiveSessionsForSupervisor('supervisor-id');

      expect(mockPrismaClient.streamingSessionHistory.findMany).toHaveBeenCalledWith({
        where: {
          stoppedAt: null,
          user: {
            supervisorId: 'supervisor-id',
          },
        },
        include: {
          user: {
            select: {
              email: true,
              id: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should throw StreamingSessionFetchError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.streamingSessionHistory.findMany.mockRejectedValue(error);
      const wrappedError = new StreamingSessionFetchError('Failed to get active sessions for supervisor', error);
      mockWrapStreamingSessionFetchError.mockReturnValue(wrappedError);

      await expect(repository.getActiveSessionsForSupervisor('supervisor-id')).rejects.toThrow(StreamingSessionFetchError);
      expect(mockWrapStreamingSessionFetchError).toHaveBeenCalledWith('Failed to get active sessions for supervisor', error);
    });
  });

  describe('stopStreamingSession', () => {
    it('should stop a streaming session', async () => {
      const openSession = {
        id: 'session-id',
        userId: 'user-id',
        startedAt: mockDate,
        stoppedAt: null,
        stopReason: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      const updatedSession = {
        ...openSession,
        stoppedAt: mockDate,
        stopReason: 'User stopped',
      };

      mockPrismaClient.streamingSessionHistory.findFirst.mockResolvedValue(openSession);
      mockPrismaClient.streamingSessionHistory.update.mockResolvedValue(updatedSession);

      const result = await repository.stopStreamingSession('user-id', 'User stopped');

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.streamingSessionHistory.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          stoppedAt: null,
        },
        orderBy: {
          startedAt: 'desc',
        },
      });
      expect(mockPrismaClient.streamingSessionHistory.update).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        data: {
          stoppedAt: mockDate,
          stopReason: 'User stopped',
          updatedAt: mockDate,
        },
      });
      expect(result).toBeInstanceOf(StreamingSessionHistory);
      expect(result?.stopReason).toBe('User stopped');
    });

    it('should return null when no open session found', async () => {
      mockPrismaClient.streamingSessionHistory.findFirst.mockResolvedValue(null);

      const result = await repository.stopStreamingSession('user-id', 'User stopped');

      expect(result).toBeNull();
      expect(mockPrismaClient.streamingSessionHistory.update).not.toHaveBeenCalled();
    });

    it('should throw EntityUpdateError on update failure', async () => {
      const openSession = {
        id: 'session-id',
        userId: 'user-id',
        startedAt: mockDate,
        stoppedAt: null,
        stopReason: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockPrismaClient.streamingSessionHistory.findFirst.mockResolvedValue(openSession);
      const error = new Error('Database error');
      mockPrismaClient.streamingSessionHistory.update.mockRejectedValue(error);
      const wrappedError = new EntityUpdateError('Failed to stop streaming session', error);
      mockWrapEntityUpdateError.mockReturnValue(wrappedError);

      await expect(repository.stopStreamingSession('user-id', 'User stopped')).rejects.toThrow(EntityUpdateError);
      expect(mockWrapEntityUpdateError).toHaveBeenCalledWith('Failed to stop streaming session', error);
    });
  });

  describe('startStreamingSession', () => {
    it('should start a new streaming session and close previous ones', async () => {
      mockPrismaClient.streamingSessionHistory.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.streamingSessionHistory.create.mockResolvedValue({} as any);

      await repository.startStreamingSession('user-id');

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.streamingSessionHistory.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', stoppedAt: null },
        data: {
          stoppedAt: mockDate,
          updatedAt: mockDate,
        },
      });
      expect(mockPrismaClient.streamingSessionHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id',
          startedAt: mockDate,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      });
    });

    it('should throw EntityCreationError on create failure', async () => {
      mockPrismaClient.streamingSessionHistory.updateMany.mockResolvedValue({ count: 0 });
      const error = new Error('Database error');
      mockPrismaClient.streamingSessionHistory.create.mockRejectedValue(error);
      const wrappedError = new EntityCreationError('Failed to start streaming session', error);
      mockWrapEntityCreationError.mockReturnValue(wrappedError);

      await expect(repository.startStreamingSession('user-id')).rejects.toThrow(EntityCreationError);
      expect(mockWrapEntityCreationError).toHaveBeenCalledWith('Failed to start streaming session', error);
    });
  });

  describe('getLastStreamingSession', () => {
    it('should get last streaming session for user', async () => {
      const prismaSession = {
        id: 'session-id',
        userId: 'user-id',
        startedAt: mockDate,
        stoppedAt: mockDate,
        stopReason: 'User stopped',
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockPrismaClient.streamingSessionHistory.findFirst.mockResolvedValue(prismaSession);

      const result = await repository.getLastStreamingSession('user-id');

      expect(mockPrismaClient.streamingSessionHistory.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        orderBy: { startedAt: 'desc' },
      });
      expect(result).toBeInstanceOf(StreamingSessionHistory);
    });

    it('should return null when no session found', async () => {
      mockPrismaClient.streamingSessionHistory.findFirst.mockResolvedValue(null);

      const result = await repository.getLastStreamingSession('user-id');

      expect(result).toBeNull();
    });

    it('should throw StreamingSessionFetchError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.streamingSessionHistory.findFirst.mockRejectedValue(error);
      const wrappedError = new StreamingSessionFetchError('Failed to get last streaming session', error);
      mockWrapStreamingSessionFetchError.mockReturnValue(wrappedError);

      await expect(repository.getLastStreamingSession('user-id')).rejects.toThrow(StreamingSessionFetchError);
      expect(mockWrapStreamingSessionFetchError).toHaveBeenCalledWith('Failed to get last streaming session', error);
    });
  });

  describe('isUserStreaming', () => {
    it('should return true if user is streaming', async () => {
      mockPrismaClient.streamingSessionHistory.count.mockResolvedValue(1);

      const result = await repository.isUserStreaming('user-id');

      expect(mockPrismaClient.streamingSessionHistory.count).toHaveBeenCalledWith({
        where: { userId: 'user-id', stoppedAt: null },
      });
      expect(result).toBe(true);
    });

    it('should return false if user is not streaming', async () => {
      mockPrismaClient.streamingSessionHistory.count.mockResolvedValue(0);

      const result = await repository.isUserStreaming('user-id');

      expect(result).toBe(false);
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.streamingSessionHistory.count.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to check if user is streaming', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.isUserStreaming('user-id')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to check if user is streaming', error);
    });
  });

  describe('getLatestSessionsForEmails', () => {
    it('should get latest sessions for emails', async () => {
      const rawSessions = [
        {
          id: 'session-1',
          userId: 'user-1',
          startedAt: mockDate,
          stoppedAt: null,
          createdAt: mockDate,
          updatedAt: mockDate,
          stopReason: null,
          email: 'user1@example.com',
        },
        {
          id: 'session-2',
          userId: 'user-2',
          startedAt: mockDate,
          stoppedAt: mockDate,
          createdAt: mockDate,
          updatedAt: mockDate,
          stopReason: 'Stopped',
          email: 'user2@example.com',
        },
      ];

      (mockPrismaClient.$queryRaw as jest.Mock).mockResolvedValue(rawSessions);

      const result = await repository.getLatestSessionsForEmails(['user1@example.com', 'user2@example.com', 'user3@example.com']);

      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(3);
      expect(result[0].email).toBe('user1@example.com');
      expect(result[0].session).toBeInstanceOf(StreamingSessionHistory);
      expect(result[1].session).toBeInstanceOf(StreamingSessionHistory);
      expect(result[2].session).toBeNull();
    });

    it('should throw StreamingSessionFetchError on query failure', async () => {
      const error = new Error('Database error');
      (mockPrismaClient.$queryRaw as jest.Mock).mockRejectedValue(error);
      const wrappedError = new StreamingSessionFetchError('Failed to get latest sessions for emails', error);
      mockWrapStreamingSessionFetchError.mockReturnValue(wrappedError);

      await expect(repository.getLatestSessionsForEmails(['user@example.com'])).rejects.toThrow(StreamingSessionFetchError);
      expect(mockWrapStreamingSessionFetchError).toHaveBeenCalledWith('Failed to get latest sessions for emails', error);
    });
  });
});

