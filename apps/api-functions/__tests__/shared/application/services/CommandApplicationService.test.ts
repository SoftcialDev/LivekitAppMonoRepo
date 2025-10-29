/**
 * @fileoverview Tests for CommandApplicationService
 * @description Tests for command application service
 */

import { CommandApplicationService } from '../../../../shared/application/services/CommandApplicationService';
import { Command } from '../../../../shared/domain/value-objects/Command';
import { MessagingResult } from '../../../../shared/domain/value-objects/MessagingResult';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../../../shared/domain/interfaces/IAuthorizationService';
import { ICommandMessagingService } from '../../../../shared/domain/interfaces/ICommandMessagingService';
import { IWebPubSubService } from '../../../../shared/domain/interfaces/IWebPubSubService';
import { MessagingError } from '../../../../shared/domain/errors/DomainError';
import { MessagingErrorCode } from '../../../../shared/domain/errors/ErrorCodes';
import { CommandType } from '../../../../shared/domain/enums/CommandType';

// Mock dependencies
jest.mock('../../../../shared/domain/utils/AuthorizationUtils');
jest.mock('../../../../shared/domain/utils/ValidationUtils');

describe('CommandApplicationService', () => {
  let commandApplicationService: CommandApplicationService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockCommandMessagingService: jest.Mocked<ICommandMessagingService>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository = {
      findByEmail: jest.fn(),
    } as any;

    mockAuthorizationService = {
      canSendCommands: jest.fn(),
    } as any;

    mockCommandMessagingService = {
      sendToGroup: jest.fn(),
    } as any;

    mockWebPubSubService = {
      broadcastMessage: jest.fn(),
    } as any;

    commandApplicationService = new CommandApplicationService(
      mockUserRepository,
      mockAuthorizationService,
      mockCommandMessagingService,
      mockWebPubSubService
    );
  });

  describe('constructor', () => {
    it('should create CommandApplicationService instance', () => {
      expect(commandApplicationService).toBeInstanceOf(CommandApplicationService);
    });
  });

  describe('authorizeCommandSender', () => {
    it('should authorize command sender successfully', async () => {
      const callerId = 'test-caller-id';
      
      // Mock AuthorizationUtils.validateCanSendCommands
      const { AuthorizationUtils } = require('../../../../shared/domain/utils/AuthorizationUtils');
      AuthorizationUtils.validateCanSendCommands = jest.fn().mockResolvedValue(undefined);

      await commandApplicationService.authorizeCommandSender(callerId);

      expect(AuthorizationUtils.validateCanSendCommands).toHaveBeenCalledWith(
        mockAuthorizationService,
        callerId
      );
    });

    it('should throw error when authorization fails', async () => {
      const callerId = 'test-caller-id';
      const authError = new Error('User not authorized');

      // Mock AuthorizationUtils.validateCanSendCommands to throw error
      const { AuthorizationUtils } = require('../../../../shared/domain/utils/AuthorizationUtils');
      AuthorizationUtils.validateCanSendCommands = jest.fn().mockRejectedValue(authError);

      await expect(commandApplicationService.authorizeCommandSender(callerId))
        .rejects.toThrow('User not authorized');

      expect(AuthorizationUtils.validateCanSendCommands).toHaveBeenCalledWith(
        mockAuthorizationService,
        callerId
      );
    });
  });

  describe('validateTargetEmployee', () => {
    it('should validate target employee successfully', async () => {
      const employeeEmail = 'employee@example.com';

      // Mock ValidationUtils methods
      const { ValidationUtils } = require('../../../../shared/domain/utils/ValidationUtils');
      ValidationUtils.validateEmailRequired = jest.fn().mockReturnValue(employeeEmail);
      ValidationUtils.validateUserIsEmployee = jest.fn().mockResolvedValue(undefined);

      await commandApplicationService.validateTargetEmployee(employeeEmail);

      expect(ValidationUtils.validateEmailRequired).toHaveBeenCalledWith(employeeEmail, 'Employee email');
      expect(ValidationUtils.validateUserIsEmployee).toHaveBeenCalledWith(
        mockUserRepository,
        employeeEmail,
        'Target user'
      );
    });

    it('should throw error when email validation fails', async () => {
      const employeeEmail = 'invalid-email';
      const validationError = new Error('Invalid email format');

      // Mock ValidationUtils.validateEmailRequired to throw error
      const { ValidationUtils } = require('../../../../shared/domain/utils/ValidationUtils');
      ValidationUtils.validateEmailRequired = jest.fn().mockImplementation(() => {
        throw validationError;
      });

      await expect(commandApplicationService.validateTargetEmployee(employeeEmail))
        .rejects.toThrow('Invalid email format');

      expect(ValidationUtils.validateEmailRequired).toHaveBeenCalledWith(employeeEmail, 'Employee email');
    });

    it('should throw error when user is not an employee', async () => {
      const employeeEmail = 'employee@example.com';
      const validationError = new Error('User is not an employee');

      // Mock ValidationUtils methods
      const { ValidationUtils } = require('../../../../shared/domain/utils/ValidationUtils');
      ValidationUtils.validateEmailRequired = jest.fn().mockReturnValue(employeeEmail);
      ValidationUtils.validateUserIsEmployee = jest.fn().mockRejectedValue(validationError);

      await expect(commandApplicationService.validateTargetEmployee(employeeEmail))
        .rejects.toThrow('User is not an employee');

      expect(ValidationUtils.validateEmailRequired).toHaveBeenCalledWith(employeeEmail, 'Employee email');
      expect(ValidationUtils.validateUserIsEmployee).toHaveBeenCalledWith(
        mockUserRepository,
        employeeEmail,
        'Target user'
      );
    });
  });

  describe('sendCameraCommand', () => {
    it('should send camera command successfully', async () => {
      const command = new Command(
        CommandType.START,
        'employee@example.com',
        new Date(),
        'Test reason'
      );

      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      const result = await commandApplicationService.sendCameraCommand(command);

      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledWith(
        'commands:employee@example.com',
        command.toPayload()
      );
      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalledWith(
        'employee@example.com',
        {
          email: 'employee@example.com',
          status: 'started'
        }
      );
      expect(result).toEqual({ success: true, sentVia: 'WEB_PUBSUB' });
    });

    it('should send stop command with reason', async () => {
      const command = new Command(
        CommandType.STOP,
        'employee@example.com',
        new Date(),
        'Emergency stop'
      );

      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      const result = await commandApplicationService.sendCameraCommand(command);

      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledWith(
        'commands:employee@example.com',
        command.toPayload()
      );
      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalledWith(
        'employee@example.com',
        {
          email: 'employee@example.com',
          status: 'stopped',
          reason: 'Emergency stop'
        }
      );
      expect(result).toEqual({ success: true, sentVia: 'WEB_PUBSUB' });
    });

    it('should throw MessagingError when command delivery fails', async () => {
      const command = new Command(
        CommandType.START,
        'employee@example.com',
        new Date(),
        'Test reason'
      );

      const messagingError = new Error('Command delivery failed');
      mockCommandMessagingService.sendToGroup.mockRejectedValue(messagingError);

      await expect(commandApplicationService.sendCameraCommand(command))
        .rejects.toThrow(MessagingError);

      await expect(commandApplicationService.sendCameraCommand(command))
        .rejects.toThrow('Failed to send command: Command delivery failed');
    });

    it('should handle different command types', async () => {
      const startCommand = new Command(CommandType.START, 'employee@example.com', new Date(), 'Start streaming');
      const stopCommand = new Command(CommandType.STOP, 'employee@example.com', new Date(), 'Stop streaming');

      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      // Test START command
      await commandApplicationService.sendCameraCommand(startCommand);
      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalledWith(
        'employee@example.com',
        {
          email: 'employee@example.com',
          status: 'started'
        }
      );

      // Test STOP command
      await commandApplicationService.sendCameraCommand(stopCommand);
      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalledWith(
        'employee@example.com',
        {
          email: 'employee@example.com',
          status: 'stopped',
          reason: 'Stop streaming'
        }
      );
    });

    it('should handle command without reason', async () => {
      const command = new Command(
        CommandType.STOP,
        'employee@example.com',
        new Date()
      );

      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      const result = await commandApplicationService.sendCameraCommand(command);

      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalledWith(
        'employee@example.com',
        {
          email: 'employee@example.com',
          status: 'stopped'
        }
      );
      expect(result).toEqual({ success: true, sentVia: 'WEB_PUBSUB' });
    });
  });

  describe('broadcastStreamEvent', () => {
    it('should handle broadcast errors gracefully', async () => {
      const command = new Command(
        CommandType.START,
        'employee@example.com',
        new Date(),
        'Test reason'
      );

      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockRejectedValue(new Error('Broadcast failed'));

      // Should not throw error, just log it
      const result = await commandApplicationService.sendCameraCommand(command);

      expect(result).toEqual({ success: true, sentVia: 'WEB_PUBSUB' });
    });
  });
});
