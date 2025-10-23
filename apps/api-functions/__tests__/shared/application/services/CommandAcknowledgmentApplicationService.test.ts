/**
 * @fileoverview Tests for CommandAcknowledgmentApplicationService
 * @description Tests for command acknowledgment application service
 */

import { CommandAcknowledgmentApplicationService } from '../../../../shared/application/services/CommandAcknowledgmentApplicationService';
import { ICommandAcknowledgmentService } from '../../../../shared/domain/interfaces/ICommandAcknowledgmentService';
import { IAuthorizationService } from '../../../../shared/domain/interfaces/IAuthorizationService';
import { AcknowledgeCommandRequest } from '../../../../shared/domain/value-objects/AcknowledgeCommandRequest';
import { AcknowledgeCommandResult } from '../../../../shared/domain/value-objects/AcknowledgeCommandResult';

// Mock domain services
jest.mock('../../../../shared/domain/interfaces/ICommandAcknowledgmentService');
jest.mock('../../../../shared/domain/interfaces/IAuthorizationService');

describe('CommandAcknowledgmentApplicationService', () => {
  let commandAcknowledgmentApplicationService: CommandAcknowledgmentApplicationService;
  let mockCommandAcknowledgmentService: jest.Mocked<ICommandAcknowledgmentService>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCommandAcknowledgmentService = {
      acknowledgeCommands: jest.fn()
    } as any;

    mockAuthorizationService = {
      authorizeCommandAcknowledgment: jest.fn()
    } as any;

    commandAcknowledgmentApplicationService = new CommandAcknowledgmentApplicationService(
      mockCommandAcknowledgmentService,
      mockAuthorizationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create CommandAcknowledgmentApplicationService instance', () => {
      expect(commandAcknowledgmentApplicationService).toBeInstanceOf(CommandAcknowledgmentApplicationService);
    });
  });

  describe('acknowledgeCommands', () => {
    it('should acknowledge commands successfully when user is authorized', async () => {
      const callerId = 'test-caller-id';
      const request = new AcknowledgeCommandRequest(['command-1', 'command-2']);
      const expectedResult = new AcknowledgeCommandResult(2);

      mockAuthorizationService.authorizeCommandAcknowledgment.mockResolvedValue(undefined);
      mockCommandAcknowledgmentService.acknowledgeCommands.mockResolvedValue(expectedResult);

      const result = await commandAcknowledgmentApplicationService.acknowledgeCommands(request, callerId);

      expect(mockAuthorizationService.authorizeCommandAcknowledgment).toHaveBeenCalledWith(callerId);
      expect(mockCommandAcknowledgmentService.acknowledgeCommands).toHaveBeenCalledWith(request, callerId);
      expect(result).toBe(expectedResult);
    });

    it('should throw error when user is not authorized', async () => {
      const callerId = 'test-caller-id';
      const request = new AcknowledgeCommandRequest(['command-1', 'command-2']);

      const authError = new Error('User not authorized');
      mockAuthorizationService.authorizeCommandAcknowledgment.mockRejectedValue(authError);

      await expect(commandAcknowledgmentApplicationService.acknowledgeCommands(request, callerId))
        .rejects.toThrow('User not authorized');

      expect(mockAuthorizationService.authorizeCommandAcknowledgment).toHaveBeenCalledWith(callerId);
      expect(mockCommandAcknowledgmentService.acknowledgeCommands).not.toHaveBeenCalled();
    });

    it('should propagate domain service errors', async () => {
      const callerId = 'test-caller-id';
      const request = new AcknowledgeCommandRequest(['command-1', 'command-2']);

      const domainError = new Error('Command acknowledgment failed');
      mockAuthorizationService.authorizeCommandAcknowledgment.mockResolvedValue(undefined);
      mockCommandAcknowledgmentService.acknowledgeCommands.mockRejectedValue(domainError);

      await expect(commandAcknowledgmentApplicationService.acknowledgeCommands(request, callerId))
        .rejects.toThrow('Command acknowledgment failed');

      expect(mockAuthorizationService.authorizeCommandAcknowledgment).toHaveBeenCalledWith(callerId);
      expect(mockCommandAcknowledgmentService.acknowledgeCommands).toHaveBeenCalledWith(request, callerId);
    });

    it('should handle different command IDs', async () => {
      const callerId = 'test-caller-id';
      const request1 = new AcknowledgeCommandRequest(['command-1']);
      const request2 = new AcknowledgeCommandRequest(['command-2', 'command-3']);
      const expectedResult = new AcknowledgeCommandResult(1);

      mockAuthorizationService.authorizeCommandAcknowledgment.mockResolvedValue(undefined);
      mockCommandAcknowledgmentService.acknowledgeCommands.mockResolvedValue(expectedResult);

      await commandAcknowledgmentApplicationService.acknowledgeCommands(request1, callerId);
      await commandAcknowledgmentApplicationService.acknowledgeCommands(request2, callerId);

      expect(mockAuthorizationService.authorizeCommandAcknowledgment).toHaveBeenCalledTimes(2);
      expect(mockCommandAcknowledgmentService.acknowledgeCommands).toHaveBeenCalledWith(request1, callerId);
      expect(mockCommandAcknowledgmentService.acknowledgeCommands).toHaveBeenCalledWith(request2, callerId);
    });

    it('should handle single command ID', async () => {
      const callerId = 'test-caller-id';
      const request = new AcknowledgeCommandRequest(['command-1']);
      const expectedResult = new AcknowledgeCommandResult(1);

      mockAuthorizationService.authorizeCommandAcknowledgment.mockResolvedValue(undefined);
      mockCommandAcknowledgmentService.acknowledgeCommands.mockResolvedValue(expectedResult);

      const result = await commandAcknowledgmentApplicationService.acknowledgeCommands(request, callerId);

      expect(mockAuthorizationService.authorizeCommandAcknowledgment).toHaveBeenCalledWith(callerId);
      expect(mockCommandAcknowledgmentService.acknowledgeCommands).toHaveBeenCalledWith(request, callerId);
      expect(result).toBe(expectedResult);
    });
  });
});
