/**
 * @fileoverview Tests for PendingCommandRepository
 * @description Tests for pending command data access operations
 */

import { PendingCommandRepository } from '../../../../shared/infrastructure/repositories/PendingCommandRepository';
import prisma from '../../../../shared/infrastructure/database/PrismaClientService';

// Mock Prisma
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({
  pendingCommand: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  }
}));

// Mock dateUtils
jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn().mockReturnValue(new Date('2023-01-01T10:00:00Z'))
}));

describe('PendingCommandRepository', () => {
  let pendingCommandRepository: PendingCommandRepository;
  let mockPrismaCommand: any;

  beforeEach(() => {
    jest.clearAllMocks();
    pendingCommandRepository = new PendingCommandRepository();

    mockPrismaCommand = {
      id: 'command-123',
      employeeId: 'employee-123',
      command: 'START_STREAMING',
      timestamp: new Date('2023-01-01T10:00:00Z'),
      acknowledged: false,
      acknowledgedAt: null,
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-01T10:00:00Z')
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create PendingCommandRepository instance', () => {
      expect(pendingCommandRepository).toBeInstanceOf(PendingCommandRepository);
    });
  });

  describe('markAsAcknowledged', () => {
    it('should mark multiple commands as acknowledged', async () => {
      const commandIds = ['command-123', 'command-456'];
      (prisma.pendingCommand.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await pendingCommandRepository.markAsAcknowledged(commandIds);

      expect(result).toBe(2);
      expect(prisma.pendingCommand.updateMany).toHaveBeenCalledWith({
        where: { id: { in: commandIds } },
        data: {
          acknowledged: true,
          acknowledgedAt: expect.any(Date)
        }
      });
    });

    it('should handle empty command IDs array', async () => {
      (prisma.pendingCommand.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await pendingCommandRepository.markAsAcknowledged([]);

      expect(result).toBe(0);
    });

    it('should handle database errors', async () => {
      const commandIds = ['command-123'];
      (prisma.pendingCommand.updateMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(pendingCommandRepository.markAsAcknowledged(commandIds))
        .rejects.toThrow('Failed to mark commands as acknowledged: Database error');
    });
  });

  describe('findByIds', () => {
    it('should find commands by IDs', async () => {
      const commandIds = ['command-123', 'command-456'];
      const mockCommands = [
        { id: 'command-123' },
        { id: 'command-456' }
      ];

      (prisma.pendingCommand.findMany as jest.Mock).mockResolvedValue(mockCommands);

      const result = await pendingCommandRepository.findByIds(commandIds);

      expect(result).toEqual(['command-123', 'command-456']);
      expect(prisma.pendingCommand.findMany).toHaveBeenCalledWith({
        where: { id: { in: commandIds } },
        select: { id: true }
      });
    });

    it('should return empty array when no commands found', async () => {
      const commandIds = ['non-existent-command'];
      (prisma.pendingCommand.findMany as jest.Mock).mockResolvedValue([]);

      const result = await pendingCommandRepository.findByIds(commandIds);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const commandIds = ['command-123'];
      (prisma.pendingCommand.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(pendingCommandRepository.findByIds(commandIds))
        .rejects.toThrow('Failed to find commands by IDs: Database error');
    });
  });

  describe('getPendingCommandsForEmployee', () => {
    it('should get pending commands for employee', async () => {
      const mockCommands = [mockPrismaCommand, { ...mockPrismaCommand, id: 'command-456' }];
      (prisma.pendingCommand.findMany as jest.Mock).mockResolvedValue(mockCommands);

      const result = await pendingCommandRepository.getPendingCommandsForEmployee('employee-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'command-123',
        employeeId: 'employee-123',
        command: 'START_STREAMING',
        timestamp: expect.any(Date),
        acknowledged: false
      });
      expect(prisma.pendingCommand.findMany).toHaveBeenCalledWith({
        where: {
          employeeId: 'employee-123',
          acknowledged: false
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
    });

    it('should return empty array when no pending commands found', async () => {
      (prisma.pendingCommand.findMany as jest.Mock).mockResolvedValue([]);

      const result = await pendingCommandRepository.getPendingCommandsForEmployee('employee-123');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      (prisma.pendingCommand.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(pendingCommandRepository.getPendingCommandsForEmployee('employee-123'))
        .rejects.toThrow('Failed to get pending commands for employee: Database error');
    });
  });

  describe('deletePendingCommandsForEmployee', () => {
    it('should delete all pending commands for employee', async () => {
      (prisma.pendingCommand.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      await pendingCommandRepository.deletePendingCommandsForEmployee('employee-123');

      expect(prisma.pendingCommand.deleteMany).toHaveBeenCalledWith({
        where: { employeeId: 'employee-123' }
      });
    });

    it('should handle database errors', async () => {
      (prisma.pendingCommand.deleteMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(pendingCommandRepository.deletePendingCommandsForEmployee('employee-123'))
        .rejects.toThrow('Failed to delete pending commands for employee: Database error');
    });
  });

  describe('createPendingCommand', () => {
    it('should create a new pending command', async () => {
      const timestamp = new Date('2023-01-01T10:00:00Z');
      (prisma.pendingCommand.create as jest.Mock).mockResolvedValue(mockPrismaCommand);

      const result = await pendingCommandRepository.createPendingCommand('employee-123', 'START_STREAMING', timestamp, 'Test reason');

      expect(result).toEqual({
        id: 'command-123',
        employeeId: 'employee-123',
        command: 'START_STREAMING',
        timestamp: expect.any(Date),
        reason: undefined
      });
      expect(prisma.pendingCommand.create).toHaveBeenCalledWith({
        data: {
          employeeId: 'employee-123',
          command: 'START_STREAMING',
          timestamp: timestamp,
          reason: 'Test reason',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should create command without reason', async () => {
      const timestamp = new Date('2023-01-01T10:00:00Z');
      (prisma.pendingCommand.create as jest.Mock).mockResolvedValue(mockPrismaCommand);

      const result = await pendingCommandRepository.createPendingCommand('employee-123', 'START_STREAMING', timestamp);

      expect(result).toEqual({
        id: 'command-123',
        employeeId: 'employee-123',
        command: 'START_STREAMING',
        timestamp: expect.any(Date),
        reason: undefined
      });
    });

    it('should handle creation errors', async () => {
      const timestamp = new Date('2023-01-01T10:00:00Z');
      (prisma.pendingCommand.create as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      await expect(pendingCommandRepository.createPendingCommand('employee-123', 'START_STREAMING', timestamp))
        .rejects.toThrow('Failed to create pending command: Creation failed');
    });
  });

  describe('markAsPublished', () => {
    it('should mark command as published', async () => {
      (prisma.pendingCommand.update as jest.Mock).mockResolvedValue(mockPrismaCommand);

      await pendingCommandRepository.markAsPublished('command-123');

      expect(prisma.pendingCommand.update).toHaveBeenCalledWith({
        where: { id: 'command-123' },
        data: {
          published: true,
          publishedAt: expect.any(Date),
          attemptCount: { increment: 1 }
        }
      });
    });

    it('should handle database errors', async () => {
      (prisma.pendingCommand.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(pendingCommandRepository.markAsPublished('command-123'))
        .rejects.toThrow('Failed to mark command as published: Database error');
    });
  });
});
