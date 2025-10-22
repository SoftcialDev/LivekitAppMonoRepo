/**
 * @fileoverview Tests for CommandMessagingService
 * @description Tests for command messaging operations
 */

import { CommandMessagingService } from '../../../../shared/infrastructure/services/CommandMessagingService';
import { CommandMessagingService as ExistingCommandMessagingService } from '../../../../shared/infrastructure/messaging/CommandMessagingService';

// Mock the existing CommandMessagingService
jest.mock('../../../../shared/infrastructure/messaging/CommandMessagingService', () => ({
  CommandMessagingService: jest.fn().mockImplementation(() => ({
    sendToGroup: jest.fn(),
  })),
}));

describe('CommandMessagingService', () => {
  let commandMessagingService: CommandMessagingService;
  let mockExistingService: jest.Mocked<ExistingCommandMessagingService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked instance without creating a new one
    mockExistingService = {
      sendToGroup: jest.fn(),
      sendCommand: jest.fn(),
    } as unknown as jest.Mocked<ExistingCommandMessagingService>;
    (ExistingCommandMessagingService as unknown as jest.Mock).mockReturnValue(mockExistingService);
    
    commandMessagingService = new CommandMessagingService();
  });

  describe('constructor', () => {
    it('should create CommandMessagingService with existing service', () => {
      expect(commandMessagingService).toBeInstanceOf(CommandMessagingService);
      // The mock is called once in beforeEach, so we expect 1 call total
      expect(ExistingCommandMessagingService).toHaveBeenCalledTimes(1);
    });

    it('should create new instance of existing service', () => {
      // Clear previous calls
      jest.clearAllMocks();
      
      const service1 = new CommandMessagingService();
      const service2 = new CommandMessagingService();
      
      expect(ExistingCommandMessagingService).toHaveBeenCalledTimes(2);
    });
  });

  describe('sendToGroup', () => {
    const mockGroupName = 'test-group';
    const mockMessage = {
      command: 'START',
      employeeEmail: 'test@example.com',
      timestamp: '2025-01-15T10:30:00Z',
    };

    it('should send message to group successfully', async () => {
      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      await commandMessagingService.sendToGroup(mockGroupName, mockMessage);

      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith(mockGroupName, mockMessage);
      expect(mockExistingService.sendToGroup).toHaveBeenCalledTimes(1);
    });

    it('should handle different group names', async () => {
      const groupNames = [
        'pso-group',
        'supervisor-group',
        'admin-group',
        'contact-manager-group',
        'group-with-special-chars-123',
      ];

      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      for (const groupName of groupNames) {
        await commandMessagingService.sendToGroup(groupName, mockMessage);
        expect(mockExistingService.sendToGroup).toHaveBeenCalledWith(groupName, mockMessage);
      }

      expect(mockExistingService.sendToGroup).toHaveBeenCalledTimes(groupNames.length);
    });

    it('should handle different message types', async () => {
      const messages = [
        { command: 'START', employeeEmail: 'test@example.com' },
        { command: 'STOP', employeeEmail: 'test@example.com', reason: 'End of shift' },
        { type: 'notification', message: 'System maintenance scheduled' },
        { data: { users: ['user1', 'user2'], action: 'bulk_update' } },
        { simple: 'string message' },
      ];

      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      for (const message of messages) {
        await commandMessagingService.sendToGroup(mockGroupName, message);
        expect(mockExistingService.sendToGroup).toHaveBeenCalledWith(mockGroupName, message);
      }

      expect(mockExistingService.sendToGroup).toHaveBeenCalledTimes(messages.length);
    });

    it('should handle empty group name', async () => {
      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      await commandMessagingService.sendToGroup('', mockMessage);

      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith('', mockMessage);
    });

    it('should handle null and undefined messages', async () => {
      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      await commandMessagingService.sendToGroup(mockGroupName, null);
      await commandMessagingService.sendToGroup(mockGroupName, undefined);

      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith(mockGroupName, null);
      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith(mockGroupName, undefined);
    });

    it('should propagate errors from existing service', async () => {
      const error = new Error('Messaging service failed');
      mockExistingService.sendToGroup.mockRejectedValue(error);

      await expect(commandMessagingService.sendToGroup(mockGroupName, mockMessage))
        .rejects.toThrow('Messaging service failed');

      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith(mockGroupName, mockMessage);
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockExistingService.sendToGroup.mockRejectedValue(timeoutError);

      await expect(commandMessagingService.sendToGroup(mockGroupName, mockMessage))
        .rejects.toThrow('Request timeout');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed');
      mockExistingService.sendToGroup.mockRejectedValue(authError);

      await expect(commandMessagingService.sendToGroup(mockGroupName, mockMessage))
        .rejects.toThrow('Authentication failed');
    });
  });

  describe('edge cases', () => {
    it('should handle very long group names', async () => {
      const longGroupName = 'A'.repeat(1000);
      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      const mockMessage = { type: 'test', data: 'test-data' };
      await commandMessagingService.sendToGroup(longGroupName, mockMessage);

      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith(longGroupName, mockMessage);
    });

    it('should handle very large messages', async () => {
      const largeMessage = {
        data: Array(1000).fill({ id: 'test', value: 'large data' }),
        metadata: { size: 'large', type: 'bulk' },
      };

      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      const mockGroupName = 'test-group';
      await commandMessagingService.sendToGroup(mockGroupName, largeMessage);

      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith(mockGroupName, largeMessage);
    });

    it('should handle special characters in group name', async () => {
      const specialGroupName = 'group-with-special-chars-@#$%^&*()';
      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      const mockMessage = { type: 'test', data: 'test-data' };
      await commandMessagingService.sendToGroup(specialGroupName, mockMessage);

      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith(specialGroupName, mockMessage);
    });

    it('should handle unicode characters in group name', async () => {
      const unicodeGroupName = '组-测试';
      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      const mockMessage = { type: 'test', data: 'test-data' };
      await commandMessagingService.sendToGroup(unicodeGroupName, mockMessage);

      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith(unicodeGroupName, mockMessage);
    });

    it('should handle complex nested message objects', async () => {
      const complexMessage = {
        command: 'START',
        employeeEmail: 'test@example.com',
        metadata: {
          timestamp: '2025-01-15T10:30:00Z',
          session: {
            id: 'session-123',
            type: 'streaming',
            config: {
              quality: 'high',
              resolution: '1080p',
              audio: true,
            },
          },
          user: {
            id: 'user-123',
            role: 'PSO',
            permissions: ['read', 'write'],
          },
        },
        options: {
          retry: true,
          timeout: 30000,
          priority: 'high',
        },
      };

      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      const mockGroupName = 'test-group';
      await commandMessagingService.sendToGroup(mockGroupName, complexMessage);

      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith(mockGroupName, complexMessage);
    });
  });

  describe('validation scenarios', () => {
    it('should handle camera command scenario', async () => {
      const cameraCommand = {
        command: 'START',
        employeeEmail: 'pso@example.com',
        timestamp: '2025-01-15T10:30:00Z',
        reason: 'Scheduled monitoring',
      };

      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      await commandMessagingService.sendToGroup('pso-group', cameraCommand);

      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith('pso-group', cameraCommand);
    });

    it('should handle stop command scenario', async () => {
      const stopCommand = {
        command: 'STOP',
        employeeEmail: 'pso@example.com',
        timestamp: '2025-01-15T18:00:00Z',
        reason: 'End of shift',
      };

      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      await commandMessagingService.sendToGroup('pso-group', stopCommand);

      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith('pso-group', stopCommand);
    });

    it('should handle bulk notification scenario', async () => {
      const bulkNotification = {
        type: 'bulk_notification',
        message: 'System maintenance scheduled for tonight',
        affectedGroups: ['pso-group', 'supervisor-group'],
        scheduledTime: '2025-01-15T22:00:00Z',
      };

      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      await commandMessagingService.sendToGroup('all-groups', bulkNotification);

      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith('all-groups', bulkNotification);
    });

    it('should handle status update scenario', async () => {
      const statusUpdate = {
        type: 'status_update',
        entity: 'User',
        entityId: 'user-123',
        status: 'online',
        timestamp: '2025-01-15T10:30:00Z',
      };

      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      await commandMessagingService.sendToGroup('status-group', statusUpdate);

      expect(mockExistingService.sendToGroup).toHaveBeenCalledWith('status-group', statusUpdate);
    });

    it('should handle concurrent message sending', async () => {
      const messages = [
        { command: 'START', employeeEmail: 'user1@example.com' },
        { command: 'START', employeeEmail: 'user2@example.com' },
        { command: 'STOP', employeeEmail: 'user3@example.com' },
      ];

      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      const promises = messages.map(message => {
        const mockGroupName = 'test-group';
        return commandMessagingService.sendToGroup(mockGroupName, message);
      });

      await Promise.all(promises);

      expect(mockExistingService.sendToGroup).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple group notifications', async () => {
      const groups = ['group1', 'group2', 'group3'];
      const message = { notification: 'test message' };

      mockExistingService.sendToGroup.mockResolvedValue(undefined);

      for (const group of groups) {
        await commandMessagingService.sendToGroup(group, message);
      }

      expect(mockExistingService.sendToGroup).toHaveBeenCalledTimes(3);
      groups.forEach(group => {
        expect(mockExistingService.sendToGroup).toHaveBeenCalledWith(group, message);
      });
    });
  });
});
