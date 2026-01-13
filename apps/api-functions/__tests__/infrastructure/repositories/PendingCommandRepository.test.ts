import { PendingCommandRepository } from '../../../src/infrastructure/repositories/PendingCommandRepository';
import { getCentralAmericaTime } from '../../../src/utils/dateUtils';
import { wrapEntityUpdateError, wrapDatabaseQueryError, wrapEntityDeletionError, wrapEntityCreationError } from '../../../src/utils/error/ErrorHelpers';
import { EntityUpdateError, DatabaseQueryError, EntityDeletionError, EntityCreationError } from '../../../src/domain/errors/RepositoryErrors';
import { createMockPrismaClient, createMockPendingCommand, mockDate } from '../../shared/mocks';

jest.mock('../../../src/utils/dateUtils');
jest.mock('../../../src/utils/error/ErrorHelpers');
jest.mock('../../../src/infrastructure/database/PrismaClientService');

const mockPrismaClient = createMockPrismaClient();
const mockGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;
const mockWrapEntityUpdateError = wrapEntityUpdateError as jest.MockedFunction<typeof wrapEntityUpdateError>;
const mockWrapDatabaseQueryError = wrapDatabaseQueryError as jest.MockedFunction<typeof wrapDatabaseQueryError>;
const mockWrapEntityDeletionError = wrapEntityDeletionError as jest.MockedFunction<typeof wrapEntityDeletionError>;
const mockWrapEntityCreationError = wrapEntityCreationError as jest.MockedFunction<typeof wrapEntityCreationError>;

describe('PendingCommandRepository', () => {
  let repository: PendingCommandRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    const PrismaClientService = jest.requireMock('../../../src/infrastructure/database/PrismaClientService');
    Object.assign(PrismaClientService.default, mockPrismaClient);
    repository = new PendingCommandRepository();
    mockGetCentralAmericaTime.mockReturnValue(mockDate);
  });

  describe('markAsAcknowledged', () => {
    it('should mark commands as acknowledged', async () => {
      mockPrismaClient.pendingCommand.updateMany.mockResolvedValue({ count: 2 });

      const result = await repository.markAsAcknowledged(['cmd-1', 'cmd-2']);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.pendingCommand.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['cmd-1', 'cmd-2'] },
        },
        data: {
          acknowledged: true,
          acknowledgedAt: mockDate,
        },
      });
      expect(result).toBe(2);
    });

    it('should throw EntityUpdateError on update failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.pendingCommand.updateMany.mockRejectedValue(error);
      const wrappedError = new EntityUpdateError('Failed to mark commands as acknowledged', error);
      mockWrapEntityUpdateError.mockReturnValue(wrappedError);

      await expect(repository.markAsAcknowledged(['cmd-1'])).rejects.toThrow(EntityUpdateError);
      expect(mockWrapEntityUpdateError).toHaveBeenCalledWith('Failed to mark commands as acknowledged', error);
    });
  });

  describe('findByIds', () => {
    it('should find commands by ids', async () => {
      const prismaCommands = [
        { id: 'cmd-1' },
        { id: 'cmd-2' },
      ];

      mockPrismaClient.pendingCommand.findMany.mockResolvedValue(prismaCommands);

      const result = await repository.findByIds(['cmd-1', 'cmd-2']);

      expect(mockPrismaClient.pendingCommand.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['cmd-1', 'cmd-2'] },
        },
        select: { id: true },
      });
      expect(result).toEqual(['cmd-1', 'cmd-2']);
    });

    it('should return empty array when no commands found', async () => {
      mockPrismaClient.pendingCommand.findMany.mockResolvedValue([]);

      const result = await repository.findByIds(['cmd-1']);

      expect(result).toEqual([]);
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.pendingCommand.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to find commands by IDs', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.findByIds(['cmd-1'])).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to find commands by IDs', error);
    });
  });

  describe('getPendingCommandsForPso', () => {
    it('should get pending commands for PSO', async () => {
      const prismaCommands = [
        createMockPendingCommand({ id: 'cmd-1', employeeId: 'pso-id', acknowledged: false }),
        createMockPendingCommand({ id: 'cmd-2', employeeId: 'pso-id', acknowledged: false }),
      ];

      mockPrismaClient.pendingCommand.findMany.mockResolvedValue(prismaCommands);

      const result = await repository.getPendingCommandsForPso('pso-id');

      expect(mockPrismaClient.pendingCommand.findMany).toHaveBeenCalledWith({
        where: {
          employeeId: 'pso-id',
          acknowledged: false,
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cmd-1');
      expect(result[0].employeeId).toBe('pso-id');
      expect(result[0].acknowledged).toBe(false);
    });

    it('should return empty array when no commands found', async () => {
      mockPrismaClient.pendingCommand.findMany.mockResolvedValue([]);

      const result = await repository.getPendingCommandsForPso('pso-id');

      expect(result).toEqual([]);
    });

    it('should throw DatabaseQueryError on query failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.pendingCommand.findMany.mockRejectedValue(error);
      const wrappedError = new DatabaseQueryError('Failed to get pending commands for PSO', error);
      mockWrapDatabaseQueryError.mockReturnValue(wrappedError);

      await expect(repository.getPendingCommandsForPso('pso-id')).rejects.toThrow(DatabaseQueryError);
      expect(mockWrapDatabaseQueryError).toHaveBeenCalledWith('Failed to get pending commands for PSO', error);
    });
  });

  describe('deletePendingCommandsForPso', () => {
    it('should delete pending commands for PSO', async () => {
      mockPrismaClient.pendingCommand.deleteMany.mockResolvedValue({ count: 3 });

      await repository.deletePendingCommandsForPso('pso-id');

      expect(mockPrismaClient.pendingCommand.deleteMany).toHaveBeenCalledWith({
        where: { employeeId: 'pso-id' },
      });
    });

    it('should throw EntityDeletionError on delete failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.pendingCommand.deleteMany.mockRejectedValue(error);
      const wrappedError = new EntityDeletionError('Failed to delete pending commands for PSO', error);
      mockWrapEntityDeletionError.mockReturnValue(wrappedError);

      await expect(repository.deletePendingCommandsForPso('pso-id')).rejects.toThrow(EntityDeletionError);
      expect(mockWrapEntityDeletionError).toHaveBeenCalledWith('Failed to delete pending commands for PSO', error);
    });
  });

  describe('createPendingCommand', () => {
    it('should create a pending command', async () => {
      const command = { type: 'COMMAND' };
      const timestamp = new Date('2024-01-01');
      const reason = 'Test reason';

      const prismaCommand = createMockPendingCommand({
        id: 'cmd-id',
        employeeId: 'pso-id',
        command: command,
        timestamp: timestamp,
        reason: reason,
      });

      mockPrismaClient.pendingCommand.create.mockResolvedValue(prismaCommand);

      const result = await repository.createPendingCommand('pso-id', command, timestamp, reason);

      expect(mockGetCentralAmericaTime).toHaveBeenCalledTimes(2);
      expect(mockPrismaClient.pendingCommand.create).toHaveBeenCalledWith({
        data: {
          employeeId: 'pso-id',
          command: command,
          timestamp: timestamp,
          reason: reason,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      });
      expect(result.id).toBe('cmd-id');
      expect(result.employeeId).toBe('pso-id');
      expect(result.reason).toBe(reason);
    });

    it('should create a pending command without reason', async () => {
      const command = { type: 'COMMAND' };
      const timestamp = new Date('2024-01-01');

      const prismaCommand = createMockPendingCommand({
        id: 'cmd-id',
        employeeId: 'pso-id',
        command: command,
        timestamp: timestamp,
        reason: null,
      });

      mockPrismaClient.pendingCommand.create.mockResolvedValue(prismaCommand);

      const result = await repository.createPendingCommand('pso-id', command, timestamp);

      expect(result.reason).toBeUndefined();
    });

    it('should throw EntityCreationError on create failure', async () => {
      const command = { type: 'COMMAND' };
      const timestamp = new Date('2024-01-01');

      const error = new Error('Database error');
      mockPrismaClient.pendingCommand.create.mockRejectedValue(error);
      const wrappedError = new EntityCreationError('Failed to create pending command', error);
      mockWrapEntityCreationError.mockReturnValue(wrappedError);

      await expect(repository.createPendingCommand('pso-id', command, timestamp)).rejects.toThrow(EntityCreationError);
      expect(mockWrapEntityCreationError).toHaveBeenCalledWith('Failed to create pending command', error);
    });
  });

  describe('markAsPublished', () => {
    it('should mark command as published', async () => {
      mockPrismaClient.pendingCommand.update.mockResolvedValue(createMockPendingCommand());

      await repository.markAsPublished('cmd-id');

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(mockPrismaClient.pendingCommand.update).toHaveBeenCalledWith({
        where: { id: 'cmd-id' },
        data: {
          published: true,
          publishedAt: mockDate,
          attemptCount: { increment: 1 },
        },
      });
    });

    it('should throw EntityUpdateError on update failure', async () => {
      const error = new Error('Database error');
      mockPrismaClient.pendingCommand.update.mockRejectedValue(error);
      const wrappedError = new EntityUpdateError('Failed to mark command as published', error);
      mockWrapEntityUpdateError.mockReturnValue(wrappedError);

      await expect(repository.markAsPublished('cmd-id')).rejects.toThrow(EntityUpdateError);
      expect(mockWrapEntityUpdateError).toHaveBeenCalledWith('Failed to mark command as published', error);
    });
  });
});
