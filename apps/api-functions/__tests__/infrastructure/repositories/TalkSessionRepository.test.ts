import { TalkSessionRepository } from '../../../src/infrastructure/repositories/TalkSessionRepository';
import { TalkStopReason } from '../../../src/domain/enums/TalkStopReason';
import { getCentralAmericaTime } from '../../../src/utils/dateUtils';
import { wrapEntityCreationError, wrapEntityUpdateError, wrapDatabaseQueryError } from '../../../src/utils/error/ErrorHelpers';
import { EntityCreationError, EntityUpdateError, DatabaseQueryError } from '../../../src/domain/errors/RepositoryErrors';
import { createMockPrismaClient, mockDate } from '../../shared/mocks';

jest.mock('../../../src/utils/dateUtils');
jest.mock('../../../src/utils/error/ErrorHelpers');
jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();
const mockGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;
const mockWrapEntityCreationError = wrapEntityCreationError as jest.MockedFunction<typeof wrapEntityCreationError>;
const mockWrapEntityUpdateError = wrapEntityUpdateError as jest.MockedFunction<typeof wrapEntityUpdateError>;
const mockWrapDatabaseQueryError = wrapDatabaseQueryError as jest.MockedFunction<typeof wrapDatabaseQueryError>;

describe('TalkSessionRepository', () => {
  let repository: TalkSessionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new TalkSessionRepository();
    mockGetCentralAmericaTime.mockReturnValue(mockDate);
  });

  describe('createTalkSession', () => {
    it('should create a new talk session', async () => {
      const sessionData = {
        supervisorId: 'supervisor-id',
        psoId: 'pso-id',
        startedAt: mockDate,
      };

      const prismaSession = {
        id: 'session-id',
        supervisorId: 'supervisor-id',
        psoId: 'pso-id',
        startedAt: mockDate,
        stoppedAt: null,
        stopReason: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockPrismaClient.talkSessionHistory.create.mockResolvedValue(prismaSession);

      const result = await repository.createTalkSession(sessionData);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.talkSessionHistory.create).toHaveBeenCalledWith({
        data: {
          supervisorId: sessionData.supervisorId,
          psoId: sessionData.psoId,
          startedAt: sessionData.startedAt,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      });
      expect(result.id).toBe('session-id');
      expect(result.supervisorId).toBe('supervisor-id');
      expect(result.psoId).toBe('pso-id');
    });

    it('should throw EntityCreationError on create failure', async () => {
      const sessionData = {
        supervisorId: 'supervisor-id',
        psoId: 'pso-id',
        startedAt: mockDate,
      };

      const error = new Error('Database error');
      mockPrismaClient.talkSessionHistory.create.mockRejectedValue(error);
      const wrappedError = new EntityCreationError('Failed to create talk session', error);
      mockWrapEntityCreationError.mockReturnValue(wrappedError);

      await expect(repository.createTalkSession(sessionData)).rejects.toThrow(EntityCreationError);
      expect(mockWrapEntityCreationError).toHaveBeenCalledWith('Failed to create talk session', error);
    });
  });

  describe('stopTalkSession', () => {
    it('should stop a talk session', async () => {
      mockPrismaClient.talkSessionHistory.update.mockResolvedValue({} as any);

      await repository.stopTalkSession('session-id', TalkStopReason.USER_STOP);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.talkSessionHistory.update).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        data: {
          stoppedAt: mockDate,
          stopReason: TalkStopReason.USER_STOP,
          updatedAt: mockDate,
        },
      });
    });

    it('should stop session with different stop reasons', async () => {
      mockPrismaClient.talkSessionHistory.update.mockResolvedValue({} as any);

      await repository.stopTalkSession('session-id', TalkStopReason.PSO_DISCONNECTED);

      expect(mockPrismaClient.talkSessionHistory.update).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        data: {
          stoppedAt: mockDate,
          stopReason: TalkStopReason.PSO_DISCONNECTED,
          updatedAt: mockDate,
        },
      });
    });

    it('should throw EntityUpdateError on update failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.talkSessionHistory.update.mockRejectedValue(error);
      const wrappedError = new EntityUpdateError('Failed to stop talk session', error);
      mockWrapEntityUpdateError.mockReturnValue(wrappedError);

      await expect(repository.stopTalkSession('session-id', TalkStopReason.USER_STOP)).rejects.toThrow(EntityUpdateError);
      expect(mockWrapEntityUpdateError).toHaveBeenCalledWith('Failed to stop talk session', error);
    });
  });

  describe('getActiveTalkSession', () => {
    it('should get active talk session for supervisor and PSO', async () => {
      const prismaSession = {
        id: 'session-id',
        supervisorId: 'supervisor-id',
        psoId: 'pso-id',
        startedAt: mockDate,
        stoppedAt: null,
        stopReason: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockPrismaClient.talkSessionHistory.findFirst.mockResolvedValue(prismaSession);

      const result = await repository.getActiveTalkSession('supervisor-id', 'pso-id');

      expect(mockPrismaClient.talkSessionHistory.findFirst).toHaveBeenCalledWith({
        where: {
          supervisorId: 'supervisor-id',
          psoId: 'pso-id',
          stoppedAt: null,
        },
        orderBy: {
          startedAt: 'desc',
        },
      });
      expect(result).not.toBeNull();
      expect(result?.id).toBe('session-id');
    });

    it('should return null when no active session found', async () => {
      mockPrismaClient.talkSessionHistory.findFirst.mockResolvedValue(null);

      const result = await repository.getActiveTalkSession('supervisor-id', 'pso-id');

      expect(result).toBeNull();
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.talkSessionHistory.findFirst.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to get active talk session', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.getActiveTalkSession('supervisor-id', 'pso-id')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to get active talk session', error);
    });
  });

  describe('getActiveTalkSessionsForSupervisor', () => {
    it('should get all active talk sessions for supervisor', async () => {
      const prismaSessions = [
        {
          id: 'session-1',
          supervisorId: 'supervisor-id',
          psoId: 'pso-id',
          startedAt: mockDate,
          stoppedAt: null,
          stopReason: null,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: 'session-2',
          supervisorId: 'supervisor-id',
          psoId: 'pso-id-2',
          startedAt: mockDate,
          stoppedAt: null,
          stopReason: null,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      mockPrismaClient.talkSessionHistory.findMany.mockResolvedValue(prismaSessions);

      const result = await repository.getActiveTalkSessionsForSupervisor('supervisor-id');

      expect(mockPrismaClient.talkSessionHistory.findMany).toHaveBeenCalledWith({
        where: {
          supervisorId: 'supervisor-id',
          stoppedAt: null,
        },
        orderBy: {
          startedAt: 'desc',
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('session-1');
    });

    it('should return empty array when no active sessions found', async () => {
      mockPrismaClient.talkSessionHistory.findMany.mockResolvedValue([]);

      const result = await repository.getActiveTalkSessionsForSupervisor('supervisor-id');

      expect(result).toHaveLength(0);
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.talkSessionHistory.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to get active talk sessions for supervisor', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.getActiveTalkSessionsForSupervisor('supervisor-id')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to get active talk sessions for supervisor', error);
    });
  });

  describe('getActiveTalkSessionsForPso', () => {
    it('should get all active talk sessions for PSO', async () => {
      const prismaSessions = [
        {
          id: 'session-1',
          supervisorId: 'supervisor-id',
          psoId: 'pso-id',
          startedAt: mockDate,
          stoppedAt: null,
          stopReason: null,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      mockPrismaClient.talkSessionHistory.findMany.mockResolvedValue(prismaSessions);

      const result = await repository.getActiveTalkSessionsForPso('pso-id');

      expect(mockPrismaClient.talkSessionHistory.findMany).toHaveBeenCalledWith({
        where: {
          psoId: 'pso-id',
          stoppedAt: null,
        },
        orderBy: {
          startedAt: 'desc',
        },
      });
      expect(result).toHaveLength(1);
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.talkSessionHistory.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to get active talk sessions for PSO', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.getActiveTalkSessionsForPso('pso-id')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to get active talk sessions for PSO', error);
    });
  });

  describe('getAllTalkSessionsWithRelations', () => {
    it('should get all talk sessions with relations and pagination', async () => {
      const prismaSessions = [
        {
          id: 'session-1',
          supervisorId: 'supervisor-id',
          psoId: 'pso-id',
          startedAt: mockDate,
          stoppedAt: null,
          stopReason: null,
          createdAt: mockDate,
          updatedAt: mockDate,
          supervisor: {
            fullName: 'Supervisor Name',
            email: 'supervisor@example.com',
          },
          pso: {
            fullName: 'PSO Name',
            email: 'pso@example.com',
          },
        },
      ];

      mockPrismaClient.talkSessionHistory.findMany.mockResolvedValue(prismaSessions);
      mockPrismaClient.talkSessionHistory.count.mockResolvedValue(1);

      const result = await repository.getAllTalkSessionsWithRelations(1, 10);

      expect(mockPrismaClient.talkSessionHistory.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: {
          supervisor: {
            select: {
              fullName: true,
              email: true,
            },
          },
          pso: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
      });
      expect(mockPrismaClient.talkSessionHistory.count).toHaveBeenCalled();
      expect(result.sessions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.sessions[0].supervisor.fullName).toBe('Supervisor Name');
      expect(result.sessions[0].pso.fullName).toBe('PSO Name');
    });

    it('should handle pagination correctly', async () => {
      mockPrismaClient.talkSessionHistory.findMany.mockResolvedValue([]);
      mockPrismaClient.talkSessionHistory.count.mockResolvedValue(25);

      const result = await repository.getAllTalkSessionsWithRelations(2, 10);

      expect(mockPrismaClient.talkSessionHistory.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
      expect(result.total).toBe(25);
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.talkSessionHistory.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to get talk sessions', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.getAllTalkSessionsWithRelations(1, 10)).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to get talk sessions', error);
    });
  });

  describe('findByIdWithPso', () => {
    it('should find talk session by id with PSO email', async () => {
      const prismaSession = {
        id: 'session-id',
        supervisorId: 'supervisor-id',
        psoId: 'pso-id',
        startedAt: mockDate,
        stoppedAt: null,
        stopReason: null,
        createdAt: mockDate,
        updatedAt: mockDate,
        pso: {
          email: 'pso@example.com',
        },
      };

      mockPrismaClient.talkSessionHistory.findUnique.mockResolvedValue(prismaSession);

      const result = await repository.findByIdWithPso('session-id');

      expect(mockPrismaClient.talkSessionHistory.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        include: {
          pso: {
            select: {
              email: true,
            },
          },
        },
      });
      expect(result).not.toBeNull();
      expect(result?.psoEmail).toBe('pso@example.com');
    });

    it('should return null when session not found', async () => {
      mockPrismaClient.talkSessionHistory.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdWithPso('non-existent-id');

      expect(result).toBeNull();
    });

    it('should return null when PSO is null', async () => {
      const prismaSession = {
        id: 'session-id',
        supervisorId: 'supervisor-id',
        psoId: 'pso-id',
        startedAt: mockDate,
        stoppedAt: null,
        stopReason: null,
        createdAt: mockDate,
        updatedAt: mockDate,
        pso: null,
      };

      mockPrismaClient.talkSessionHistory.findUnique.mockResolvedValue(prismaSession);

      const result = await repository.findByIdWithPso('session-id');

      expect(result).toBeNull();
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.talkSessionHistory.findUnique.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to find talk session', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.findByIdWithPso('session-id')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to find talk session', error);
    });
  });
});

