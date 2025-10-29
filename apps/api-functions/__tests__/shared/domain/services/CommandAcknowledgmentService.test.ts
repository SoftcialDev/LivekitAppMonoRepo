/**
 * @fileoverview Tests for CommandAcknowledgmentService
 * @description Tests for command acknowledgment domain service
 */

// Mock Prisma enums using centralized mock
jest.mock('@prisma/client', () => require('../../../mocks/prisma-enums').PrismaMock);

import { CommandAcknowledgmentService } from '../../../../shared/domain/services/CommandAcknowledgmentService';
import { AcknowledgeCommandRequest } from '../../../../shared/domain/value-objects/AcknowledgeCommandRequest';
import { IPendingCommandRepository } from '../../../../shared/domain/interfaces/IPendingCommandRepository';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { UserRole } from '@prisma/client';

describe('CommandAcknowledgmentService', () => {
  let commandAcknowledgmentService: CommandAcknowledgmentService;
  let mockPendingCommandRepository: jest.Mocked<IPendingCommandRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPendingCommandRepository = {
      markAsAcknowledged: jest.fn(),
      findByIds: jest.fn(),
    } as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
    } as any;

    commandAcknowledgmentService = new CommandAcknowledgmentService(
      mockPendingCommandRepository,
      mockUserRepository
    );
  });

  describe('constructor', () => {
    it('should create CommandAcknowledgmentService instance', () => {
      expect(commandAcknowledgmentService).toBeInstanceOf(CommandAcknowledgmentService);
    });
  });

  describe('acknowledgeCommands', () => {
    const mockCallerId = 'caller-123';
    const mockCommandIds = ['cmd-1', 'cmd-2', 'cmd-3'];
    const mockEmployee = {
      id: 'emp-123',
      azureAdObjectId: mockCallerId,
      email: 'employee@example.com',
      fullName: 'Test Employee',
      role: UserRole.Employee,
      deletedAt: null,
    };

    it('should acknowledge commands successfully', async () => {
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockEmployee as any);
      mockPendingCommandRepository.findByIds.mockResolvedValue(mockCommandIds);
      mockPendingCommandRepository.markAsAcknowledged.mockResolvedValue(3);

      const request = new AcknowledgeCommandRequest(mockCommandIds);
      const result = await commandAcknowledgmentService.acknowledgeCommands(request, mockCallerId);

      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(mockCallerId);
      expect(mockPendingCommandRepository.findByIds).toHaveBeenCalledWith(mockCommandIds);
      expect(mockPendingCommandRepository.markAsAcknowledged).toHaveBeenCalledWith(mockCommandIds);
      expect(result.updatedCount).toBe(3);
    });

    it('should throw error when user is not found', async () => {
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      const request = new AcknowledgeCommandRequest(mockCommandIds);

      await expect(
        commandAcknowledgmentService.acknowledgeCommands(request, mockCallerId)
      ).rejects.toThrow('User not found');
    });

    it('should throw error when user is deleted', async () => {
      const deletedEmployee = { ...mockEmployee, deletedAt: new Date() };
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(deletedEmployee as any);

      const request = new AcknowledgeCommandRequest(mockCommandIds);

      await expect(
        commandAcknowledgmentService.acknowledgeCommands(request, mockCallerId)
      ).rejects.toThrow('User is deleted');
    });

    it('should throw error when user is not an employee', async () => {
      const supervisor = { ...mockEmployee, role: UserRole.Supervisor };
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(supervisor as any);

      const request = new AcknowledgeCommandRequest(mockCommandIds);

      await expect(
        commandAcknowledgmentService.acknowledgeCommands(request, mockCallerId)
      ).rejects.toThrow('Only employees may acknowledge commands');
    });

    it('should throw error when command IDs are not found', async () => {
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockEmployee as any);
      mockPendingCommandRepository.findByIds.mockResolvedValue(['cmd-1', 'cmd-2']); // Only 2 found, but 3 requested

      const request = new AcknowledgeCommandRequest(mockCommandIds);

      await expect(
        commandAcknowledgmentService.acknowledgeCommands(request, mockCallerId)
      ).rejects.toThrow('Command IDs not found: cmd-3');
    });

    it('should handle multiple missing command IDs', async () => {
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockEmployee as any);
      mockPendingCommandRepository.findByIds.mockResolvedValue(['cmd-1']); // Only 1 found, but 3 requested

      const request = new AcknowledgeCommandRequest(mockCommandIds);

      await expect(
        commandAcknowledgmentService.acknowledgeCommands(request, mockCallerId)
      ).rejects.toThrow('Command IDs not found: cmd-2, cmd-3');
    });

    it('should handle single command ID', async () => {
      const singleCommandId = ['cmd-1'];
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockEmployee as any);
      mockPendingCommandRepository.findByIds.mockResolvedValue(singleCommandId);
      mockPendingCommandRepository.markAsAcknowledged.mockResolvedValue(1);

      const request = new AcknowledgeCommandRequest(singleCommandId);
      const result = await commandAcknowledgmentService.acknowledgeCommands(request, mockCallerId);

      expect(result.updatedCount).toBe(1);
    });

    it('should reject empty command IDs array', async () => {
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockEmployee as any);

      expect(() => new AcknowledgeCommandRequest([])).toThrow('Command IDs array cannot be empty');
    });
  });
});

