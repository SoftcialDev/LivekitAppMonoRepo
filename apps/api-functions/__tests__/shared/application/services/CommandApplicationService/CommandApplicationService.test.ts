/**
 * @fileoverview CommandApplicationService - unit tests
 */

// Mock UserRole enum globally
jest.mock('@prisma/client', () => ({
  UserRole: {
    Admin: 'Admin',
    Supervisor: 'Supervisor',
    Employee: 'Employee',
    Unassigned: 'Unassigned'
  }
}));

import { CommandApplicationService } from '../../../../../shared/application/services/CommandApplicationService';
import { CommandType } from '../../../../../shared/domain/enums/CommandType';
import { MessagingError } from '../../../../../shared/domain/errors/DomainError';
import { MessagingErrorCode } from '../../../../../shared/domain/errors/ErrorCodes';

describe('CommandApplicationService', () => {
  let service: CommandApplicationService;
  let mockUserRepository: any;
  let mockAuthService: any;
  let mockCommandMessagingService: any;
  let mockWebPubSubService: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn()
    };
    mockAuthService = {
      isUserActive: jest.fn().mockResolvedValue(true),
      canSendCommands: jest.fn().mockResolvedValue(true)
    };
    mockCommandMessagingService = {
      sendToGroup: jest.fn()
    };
    mockWebPubSubService = {
      broadcastMessage: jest.fn()
    };
    service = new CommandApplicationService(
      mockUserRepository,
      mockAuthService,
      mockCommandMessagingService,
      mockWebPubSubService
    );
  });

  describe('authorizeCommandSender', () => {
    it('delegates to AuthorizationUtils', async () => {
      const callerId = 'caller123';
      await service.authorizeCommandSender(callerId);
      // AuthorizationUtils is tested separately, just verify no errors
    });
  });

  describe('validateTargetEmployee', () => {
    it('delegates to ValidationUtils', async () => {
      const email = 'test@example.com';
      mockUserRepository.findByEmail.mockResolvedValue({ id: '1', email, role: 'Employee' });
      await service.validateTargetEmployee(email);
      // ValidationUtils is tested separately, just verify no errors
    });
  });

  describe('sendCameraCommand', () => {
    it('sends command and broadcasts stream event successfully', async () => {
      const command = {
        employeeEmail: 'pso@example.com',
        type: CommandType.START,
        reason: 'Test reason',
        toPayload: jest.fn().mockReturnValue({ type: 'START', email: 'pso@example.com' })
      } as any;

      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      const result = await service.sendCameraCommand(command);

      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledWith(
        'commands:pso@example.com',
        { type: 'START', email: 'pso@example.com' }
      );
      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalledWith(
        'pso@example.com',
        { email: 'pso@example.com', status: 'started' }
      );
      expect(result).toEqual({ success: true, sentVia: 'WEB_PUBSUB' });
    });

    it('includes reason for STOP commands', async () => {
      const command = {
        employeeEmail: 'pso@example.com',
        type: CommandType.STOP,
        reason: 'Emergency stop',
        toPayload: jest.fn().mockReturnValue({ type: 'STOP', email: 'pso@example.com' })
      } as any;

      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);
      mockWebPubSubService.broadcastMessage.mockResolvedValue(undefined);

      await service.sendCameraCommand(command);

      expect(mockWebPubSubService.broadcastMessage).toHaveBeenCalledWith(
        'pso@example.com',
        { email: 'pso@example.com', status: 'stopped', reason: 'Emergency stop' }
      );
    });

    it('throws MessagingError when command delivery fails', async () => {
      const command = {
        employeeEmail: 'pso@example.com',
        type: CommandType.START,
        toPayload: jest.fn().mockReturnValue({ type: 'START' })
      } as any;

      const error = new Error('Delivery failed');
      mockCommandMessagingService.sendToGroup.mockRejectedValue(error);

      await expect(service.sendCameraCommand(command))
        .rejects
        .toThrow(MessagingError);
    });
  });
});