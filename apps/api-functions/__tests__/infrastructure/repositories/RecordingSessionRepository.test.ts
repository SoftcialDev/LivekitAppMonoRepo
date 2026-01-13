import { RecordingSessionRepository } from '../../../src/infrastructure/repositories/RecordingSessionRepository';
import { RecordingSession } from '../../../src/domain/entities/RecordingSession';
import { RecordingStatus } from '@prisma/client';
import { getCentralAmericaTime } from '../../../src/utils/dateUtils';
import { wrapDatabaseQueryError, wrapEntityCreationError, wrapEntityUpdateError, wrapEntityDeletionError } from '../../../src/utils/error/ErrorHelpers';
import { DatabaseQueryError, EntityCreationError, EntityUpdateError, EntityDeletionError } from '../../../src/domain/errors/RepositoryErrors';
import { createMockPrismaClient, mockDate } from '../../shared/mocks';

jest.mock('../../../src/utils/dateUtils');
jest.mock('../../../src/utils/error/ErrorHelpers');
jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();
const mockGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;
const mockWrapDatabaseQueryError = wrapDatabaseQueryError as jest.MockedFunction<typeof wrapDatabaseQueryError>;
const mockWrapEntityCreationError = wrapEntityCreationError as jest.MockedFunction<typeof wrapEntityCreationError>;
const mockWrapEntityUpdateError = wrapEntityUpdateError as jest.MockedFunction<typeof wrapEntityUpdateError>;
const mockWrapEntityDeletionError = wrapEntityDeletionError as jest.MockedFunction<typeof wrapEntityDeletionError>;

describe('RecordingSessionRepository', () => {
  let repository: RecordingSessionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new RecordingSessionRepository();
    mockGetCentralAmericaTime.mockReturnValue(mockDate);
  });

  describe('findById', () => {
    it('should find a recording session by id', async () => {
      const prismaSession = {
        id: 'session-id',
        roomName: 'room-123',
        roomId: null,
        egressId: 'egress-id',
        userId: 'user-id',
        subjectUserId: 'subject-id',
        subjectLabel: 'Subject Label',
        status: RecordingStatus.Active,
        startedAt: mockDate,
        stoppedAt: null,
        blobUrl: null,
        blobPath: null,
        createdAt: mockDate,
        updatedAt: mockDate,
        user: {
          email: 'user@example.com',
          fullName: 'User Name',
        },
      };

      mockPrismaClient.recordingSession.findUnique.mockResolvedValue(prismaSession);

      const result = await repository.findById('session-id');

      expect(mockPrismaClient.recordingSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      });
      expect(result).toBeInstanceOf(RecordingSession);
      expect(result?.id).toBe('session-id');
    });

    it('should return null when session not found', async () => {
      mockPrismaClient.recordingSession.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.recordingSession.findUnique.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to find recording session', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.findById('session-id')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to find recording session', error);
    });
  });

  describe('list', () => {
    it('should list recording sessions with roomName filter', async () => {
      const prismaSessions = [
        {
          id: 'session-1',
          roomName: 'room-123',
          roomId: null,
          egressId: 'egress-1',
          userId: 'user-id',
          subjectUserId: null,
          subjectLabel: null,
          status: RecordingStatus.Active,
          startedAt: mockDate,
          stoppedAt: null,
          blobUrl: null,
          blobPath: null,
          createdAt: mockDate,
          updatedAt: mockDate,
          user: {
            email: 'user@example.com',
            fullName: 'User Name',
          },
        },
      ];

      mockPrismaClient.recordingSession.findMany.mockResolvedValue(prismaSessions);

      const result = await repository.list({
        roomName: 'room-123',
        orderByCreatedAt: 'desc',
        limit: 10,
      });

      expect(mockPrismaClient.recordingSession.findMany).toHaveBeenCalledWith({
        where: { roomName: 'room-123' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(RecordingSession);
    });

    it('should list recording sessions without roomName filter', async () => {
      const prismaSessions = [
        {
          id: 'session-1',
          roomName: 'room-123',
          roomId: null,
          egressId: 'egress-1',
          userId: 'user-id',
          subjectUserId: null,
          subjectLabel: null,
          status: RecordingStatus.Active,
          startedAt: mockDate,
          stoppedAt: null,
          blobUrl: null,
          blobPath: null,
          createdAt: mockDate,
          updatedAt: mockDate,
          user: {
            email: 'user@example.com',
            fullName: 'User Name',
          },
        },
      ];

      mockPrismaClient.recordingSession.findMany.mockResolvedValue(prismaSessions);

      const result = await repository.list({
        orderByCreatedAt: 'asc',
        limit: 10,
      });

      expect(mockPrismaClient.recordingSession.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'asc' },
        take: 10,
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      });
      expect(result).toHaveLength(1);
    });

    it('should throw DatabaseQueryError on list failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.recordingSession.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to list recording sessions', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.list({ orderByCreatedAt: 'desc', limit: 10 })).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to list recording sessions', error);
    });
  });

  describe('getUsersByIds', () => {
    it('should get users by ids', async () => {
      const users = [
        { id: 'user-1', email: 'user1@example.com', fullName: 'User 1' },
        { id: 'user-2', email: 'user2@example.com', fullName: 'User 2' },
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(users);

      const result = await repository.getUsersByIds(['user-1', 'user-2']);

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'user-2'] } },
        select: { id: true, fullName: true, email: true },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('user-1');
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.user.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to get users by IDs', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.getUsersByIds(['user-1'])).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to get users by IDs', error);
    });
  });

  describe('createActive', () => {
    it('should create an active recording session', async () => {
      const data = {
        roomName: 'room-123',
        egressId: 'egress-id',
        userId: 'user-id',
        subjectUserId: 'subject-id',
        subjectLabel: 'Subject Label',
        blobPath: '/path/to/blob',
        startedAt: '2024-01-01T12:00:00.000Z',
      };

      const prismaSession = {
        id: 'session-id',
        ...data,
        roomId: null,
        status: RecordingStatus.Active,
        stoppedAt: null,
        blobUrl: null,
        createdAt: mockDate,
        updatedAt: mockDate,
        user: {
          email: 'user@example.com',
          fullName: 'User Name',
        },
      };

      mockPrismaClient.recordingSession.create.mockResolvedValue(prismaSession);

      const result = await repository.createActive(data);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.recordingSession.create).toHaveBeenCalledWith({
        data: {
          roomName: data.roomName,
          egressId: data.egressId,
          userId: data.userId,
          subjectUserId: data.subjectUserId,
          subjectLabel: data.subjectLabel,
          status: RecordingStatus.Active,
          blobPath: data.blobPath,
          startedAt: data.startedAt,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      });
      expect(result).toBeInstanceOf(RecordingSession);
      expect(result.id).toBe('session-id');
    });

    it('should create session with null optional fields', async () => {
      const data = {
        roomName: 'room-123',
        egressId: 'egress-id',
        userId: 'user-id',
        subjectUserId: 'subject-id',
        subjectLabel: 'Subject Label',
        blobPath: '/path/to/blob',
        startedAt: '2024-01-01T12:00:00.000Z',
      };

      const prismaSession = {
        id: 'session-id',
        ...data,
        roomId: null,
        status: RecordingStatus.Active,
        stoppedAt: null,
        blobUrl: null,
        createdAt: mockDate,
        updatedAt: mockDate,
        user: {
          email: 'user@example.com',
          fullName: 'User Name',
        },
      };

      mockPrismaClient.recordingSession.create.mockResolvedValue(prismaSession);

      await repository.createActive(data);

      expect(mockPrismaClient.recordingSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subjectUserId: 'subject-id',
          subjectLabel: 'Subject Label',
          blobPath: '/path/to/blob',
        }),
        include: expect.any(Object),
      });
    });

    it('should throw EntityCreationError on create failure', async () => {
      const data = {
        roomName: 'room-123',
        egressId: 'egress-id',
        userId: 'user-id',
        subjectUserId: 'subject-id',
        subjectLabel: 'Subject Label',
        blobPath: '/path/to/blob',
        startedAt: '2024-01-01T12:00:00.000Z',
      };

      const error = new Error('Database error');
      mockPrismaClient.recordingSession.create.mockRejectedValue(error);
      const wrappedError = new EntityCreationError('Failed to create recording session', error);
      mockWrapEntityCreationError.mockReturnValue(wrappedError);

      await expect(repository.createActive(data)).rejects.toThrow(EntityCreationError);
      expect(mockWrapEntityCreationError).toHaveBeenCalledWith('Failed to create recording session', error);
    });
  });

  describe('complete', () => {
    it('should complete a recording session', async () => {
      mockPrismaClient.recordingSession.update.mockResolvedValue({} as any);

      await repository.complete('session-id', 'https://example.com/blob.mp4', '2024-01-01T13:00:00.000Z');

      expect(mockPrismaClient.recordingSession.update).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        data: {
          status: RecordingStatus.Completed,
          stoppedAt: '2024-01-01T13:00:00.000Z',
          blobUrl: 'https://example.com/blob.mp4',
        },
      });
    });

    it('should complete session with null blobUrl', async () => {
      mockPrismaClient.recordingSession.update.mockResolvedValue({} as any);

      await repository.complete('session-id', null, '2024-01-01T13:00:00.000Z');

      expect(mockPrismaClient.recordingSession.update).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        data: {
          status: RecordingStatus.Completed,
          stoppedAt: '2024-01-01T13:00:00.000Z',
          blobUrl: null,
        },
      });
    });

    it('should throw EntityUpdateError on update failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.recordingSession.update.mockRejectedValue(error);
      const wrappedError = new EntityUpdateError('Failed to complete recording session', error);
      mockWrapEntityUpdateError.mockReturnValue(wrappedError);

      await expect(repository.complete('session-id', null, '2024-01-01T13:00:00.000Z')).rejects.toThrow(EntityUpdateError);
      expect(mockWrapEntityUpdateError).toHaveBeenCalledWith('Failed to complete recording session', error);
    });
  });

  describe('fail', () => {
    it('should mark recording session as failed', async () => {
      mockPrismaClient.recordingSession.update.mockResolvedValue({} as any);

      await repository.fail('session-id');

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.recordingSession.update).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        data: {
          status: RecordingStatus.Failed,
          stoppedAt: mockDate.toISOString(),
        },
      });
    });

    it('should throw EntityUpdateError on update failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.recordingSession.update.mockRejectedValue(error);
      const wrappedError = new EntityUpdateError('Failed to mark recording session as failed', error);
      mockWrapEntityUpdateError.mockReturnValue(wrappedError);

      await expect(repository.fail('session-id')).rejects.toThrow(EntityUpdateError);
      expect(mockWrapEntityUpdateError).toHaveBeenCalledWith('Failed to mark recording session as failed', error);
    });
  });

  describe('deleteById', () => {
    it('should delete a recording session by id', async () => {
      mockPrismaClient.recordingSession.delete.mockResolvedValue({} as any);

      await repository.deleteById('session-id');

      expect(mockPrismaClient.recordingSession.delete).toHaveBeenCalledWith({
        where: { id: 'session-id' },
      });
    });

    it('should throw EntityDeletionError on delete failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.recordingSession.delete.mockRejectedValue(error);
      const wrappedError = new EntityDeletionError('Failed to delete recording session', error);
      mockWrapEntityDeletionError.mockReturnValue(wrappedError);

      await expect(repository.deleteById('session-id')).rejects.toThrow(EntityDeletionError);
      expect(mockWrapEntityDeletionError).toHaveBeenCalledWith('Failed to delete recording session', error);
    });
  });

  describe('findActiveByRoom', () => {
    it('should find active recording sessions by room name', async () => {
      const prismaSessions = [
        {
          id: 'session-1',
          roomName: 'room-123',
          roomId: null,
          egressId: 'egress-1',
          userId: 'user-id',
          subjectUserId: null,
          subjectLabel: null,
          status: RecordingStatus.Active,
          startedAt: mockDate,
          stoppedAt: null,
          blobUrl: null,
          blobPath: null,
          createdAt: mockDate,
          updatedAt: mockDate,
          user: {
            email: 'user@example.com',
            fullName: 'User Name',
          },
        },
      ];

      mockPrismaClient.recordingSession.findMany.mockResolvedValue(prismaSessions);

      const result = await repository.findActiveByRoom('room-123');

      expect(mockPrismaClient.recordingSession.findMany).toHaveBeenCalledWith({
        where: { roomName: 'room-123', status: RecordingStatus.Active },
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(RecordingSession);
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.recordingSession.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to find active recordings by room', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.findActiveByRoom('room-123')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to find active recordings by room', error);
    });
  });

  describe('findActiveBySubject', () => {
    it('should find active recording sessions by subject user id', async () => {
      const prismaSessions = [
        {
          id: 'session-1',
          roomName: 'room-123',
          roomId: null,
          egressId: 'egress-1',
          userId: 'user-id',
          subjectUserId: 'subject-id',
          subjectLabel: null,
          status: RecordingStatus.Active,
          startedAt: mockDate,
          stoppedAt: null,
          blobUrl: null,
          blobPath: null,
          createdAt: mockDate,
          updatedAt: mockDate,
          user: {
            email: 'user@example.com',
            fullName: 'User Name',
          },
        },
      ];

      mockPrismaClient.recordingSession.findMany.mockResolvedValue(prismaSessions);

      const result = await repository.findActiveBySubject('subject-id');

      expect(mockPrismaClient.recordingSession.findMany).toHaveBeenCalledWith({
        where: { subjectUserId: 'subject-id', status: RecordingStatus.Active },
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      });
      expect(result).toHaveLength(1);
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.recordingSession.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to find active recordings by subject', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.findActiveBySubject('subject-id')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to find active recordings by subject', error);
    });
  });

  describe('findActiveByInitiator', () => {
    it('should find active recording sessions by initiator user id', async () => {
      const prismaSessions = [
        {
          id: 'session-1',
          roomName: 'room-123',
          roomId: null,
          egressId: 'egress-1',
          userId: 'user-id',
          subjectUserId: null,
          subjectLabel: null,
          status: RecordingStatus.Active,
          startedAt: mockDate,
          stoppedAt: null,
          blobUrl: null,
          blobPath: null,
          createdAt: mockDate,
          updatedAt: mockDate,
          user: {
            email: 'user@example.com',
            fullName: 'User Name',
          },
        },
      ];

      mockPrismaClient.recordingSession.findMany.mockResolvedValue(prismaSessions);

      const result = await repository.findActiveByInitiator('user-id');

      expect(mockPrismaClient.recordingSession.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', status: RecordingStatus.Active },
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      });
      expect(result).toHaveLength(1);
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.recordingSession.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to find active recordings by initiator', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.findActiveByInitiator('user-id')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to find active recordings by initiator', error);
    });
  });
});

