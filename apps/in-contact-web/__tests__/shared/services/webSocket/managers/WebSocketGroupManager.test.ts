import { WebSocketGroupManager } from '@/shared/services/webSocket/managers/WebSocketGroupManager';
import { WebPubSubClient } from '@azure/web-pubsub-client';
import { logDebug, logWarn } from '@/shared/utils/logger';

// Mock dependencies
jest.mock('@azure/web-pubsub-client');
jest.mock('@/shared/utils/logger', () => ({
  logDebug: jest.fn(),
  logWarn: jest.fn(),
}));

describe('WebSocketGroupManager', () => {
  let manager: WebSocketGroupManager;
  let mockClient: jest.Mocked<WebPubSubClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new WebSocketGroupManager();
    mockClient = {
      joinGroup: jest.fn().mockResolvedValue(undefined),
      leaveGroup: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<WebPubSubClient>;
  });

  describe('getGroups', () => {
    it('should return empty set initially', () => {
      const groups = manager.getGroups();
      expect(groups.size).toBe(0);
    });

    it('should return readonly set of remembered groups', () => {
      manager.rememberGroup('test-group');
      const groups = manager.getGroups();
      
      expect(groups.size).toBe(1);
      expect(groups.has('test-group')).toBe(true);
      
      // ReadonlySet in TypeScript only prevents compile-time mutations
      // In runtime, the Set can still be modified, but TypeScript prevents it
      // We can verify it's a Set instance
      expect(groups).toBeInstanceOf(Set);
    });
  });

  describe('rememberGroup', () => {
    it('should add group to remembered set', () => {
      manager.rememberGroup('test-group');
      expect(manager.getGroups().has('test-group')).toBe(true);
    });

    it('should normalize group name to lowercase', () => {
      manager.rememberGroup('TEST-GROUP');
      expect(manager.getGroups().has('test-group')).toBe(true);
    });

    it('should trim whitespace from group name', () => {
      manager.rememberGroup('  test-group  ');
      expect(manager.getGroups().has('test-group')).toBe(true);
    });

    it('should handle multiple groups', () => {
      manager.rememberGroup('group1');
      manager.rememberGroup('group2');
      manager.rememberGroup('group3');
      
      const groups = manager.getGroups();
      expect(groups.size).toBe(3);
      expect(groups.has('group1')).toBe(true);
      expect(groups.has('group2')).toBe(true);
      expect(groups.has('group3')).toBe(true);
    });

    it('should not duplicate groups', () => {
      manager.rememberGroup('test-group');
      manager.rememberGroup('TEST-GROUP');
      manager.rememberGroup('test-group');
      
      expect(manager.getGroups().size).toBe(1);
    });
  });

  describe('forgetGroup', () => {
    it('should remove group from remembered set', () => {
      manager.rememberGroup('test-group');
      manager.forgetGroup('test-group');
      
      expect(manager.getGroups().has('test-group')).toBe(false);
    });

    it('should normalize group name when forgetting', () => {
      manager.rememberGroup('test-group');
      manager.forgetGroup('TEST-GROUP');
      
      expect(manager.getGroups().has('test-group')).toBe(false);
    });

    it('should trim whitespace when forgetting', () => {
      manager.rememberGroup('test-group');
      manager.forgetGroup('  test-group  ');
      
      expect(manager.getGroups().has('test-group')).toBe(false);
    });

    it('should not throw if group does not exist', () => {
      expect(() => manager.forgetGroup('non-existent')).not.toThrow();
    });
  });

  describe('clearGroups', () => {
    it('should clear all remembered groups', () => {
      manager.rememberGroup('group1');
      manager.rememberGroup('group2');
      manager.rememberGroup('group3');
      
      manager.clearGroups();
      
      expect(manager.getGroups().size).toBe(0);
    });

    it('should not throw if no groups exist', () => {
      expect(() => manager.clearGroups()).not.toThrow();
    });
  });

  describe('joinGroup', () => {
    it('should join group and remember it', async () => {
      await manager.joinGroup(mockClient, 'test-group');
      
      expect(mockClient.joinGroup).toHaveBeenCalledWith('test-group');
      expect(manager.getGroups().has('test-group')).toBe(true);
    });

    it('should normalize group name before joining', async () => {
      await manager.joinGroup(mockClient, 'TEST-GROUP');
      
      expect(mockClient.joinGroup).toHaveBeenCalledWith('test-group');
      expect(manager.getGroups().has('test-group')).toBe(true);
    });

    it('should trim whitespace before joining', async () => {
      await manager.joinGroup(mockClient, '  test-group  ');
      
      expect(mockClient.joinGroup).toHaveBeenCalledWith('test-group');
    });

    it('should log debug message on successful join', async () => {
      await manager.joinGroup(mockClient, 'test-group');
      
      expect(logDebug).toHaveBeenCalledWith('Joined WebSocket group', {
        group: 'test-group',
      });
    });

    it('should throw error if join fails', async () => {
      const error = new Error('Join failed');
      mockClient.joinGroup.mockRejectedValue(error);
      
      await expect(manager.joinGroup(mockClient, 'test-group')).rejects.toBe(error);
      
      expect(logWarn).toHaveBeenCalledWith('Error joining group', {
        group: 'test-group',
        error,
      });
    });

    it('should still remember group even if join fails', async () => {
      const error = new Error('Join failed');
      mockClient.joinGroup.mockRejectedValue(error);
      
      try {
        await manager.joinGroup(mockClient, 'test-group');
      } catch {
        // Expected to throw
      }
      
      // Group should still be remembered for retry
      expect(manager.getGroups().has('test-group')).toBe(true);
    });
  });

  describe('leaveGroup', () => {
    it('should leave group and forget it', async () => {
      manager.rememberGroup('test-group');
      
      await manager.leaveGroup(mockClient, 'test-group');
      
      expect(mockClient.leaveGroup).toHaveBeenCalledWith('test-group');
      expect(manager.getGroups().has('test-group')).toBe(false);
    });

    it('should normalize group name before leaving', async () => {
      manager.rememberGroup('test-group');
      
      await manager.leaveGroup(mockClient, 'TEST-GROUP');
      
      expect(mockClient.leaveGroup).toHaveBeenCalledWith('test-group');
    });

    it('should trim whitespace before leaving', async () => {
      manager.rememberGroup('test-group');
      
      await manager.leaveGroup(mockClient, '  test-group  ');
      
      expect(mockClient.leaveGroup).toHaveBeenCalledWith('test-group');
    });

    it('should log debug message on successful leave', async () => {
      manager.rememberGroup('test-group');
      
      await manager.leaveGroup(mockClient, 'test-group');
      
      expect(logDebug).toHaveBeenCalledWith('Left WebSocket group', {
        group: 'test-group',
      });
    });

    it('should handle leave errors gracefully without throwing', async () => {
      manager.rememberGroup('test-group');
      const error = new Error('Leave failed');
      mockClient.leaveGroup.mockRejectedValue(error);
      
      // leaveGroup doesn't throw, it just logs the error
      await expect(manager.leaveGroup(mockClient, 'test-group')).resolves.toBeUndefined();
      
      expect(logWarn).toHaveBeenCalledWith('Error leaving group', {
        group: 'test-group',
        error,
      });
    });

    it('should still forget group even if leave fails', async () => {
      manager.rememberGroup('test-group');
      const error = new Error('Leave failed');
      mockClient.leaveGroup.mockRejectedValue(error);
      
      await manager.leaveGroup(mockClient, 'test-group');
      
      // Group should be forgotten even if leave failed
      expect(manager.getGroups().has('test-group')).toBe(false);
    });
  });

  describe('rejoinAllGroups', () => {
    it('should rejoin all remembered groups', async () => {
      manager.rememberGroup('group1');
      manager.rememberGroup('group2');
      manager.rememberGroup('group3');
      
      await manager.rejoinAllGroups(mockClient);
      
      expect(mockClient.joinGroup).toHaveBeenCalledTimes(3);
      expect(mockClient.joinGroup).toHaveBeenCalledWith('group1');
      expect(mockClient.joinGroup).toHaveBeenCalledWith('group2');
      expect(mockClient.joinGroup).toHaveBeenCalledWith('group3');
    });

    it('should not throw if no groups to rejoin', async () => {
      await expect(manager.rejoinAllGroups(mockClient)).resolves.toBeUndefined();
      expect(mockClient.joinGroup).not.toHaveBeenCalled();
    });

    it('should continue rejoining even if one group fails', async () => {
      manager.rememberGroup('group1');
      manager.rememberGroup('group2');
      manager.rememberGroup('group3');
      
      mockClient.joinGroup
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Join failed'))
        .mockResolvedValueOnce(undefined);
      
      await manager.rejoinAllGroups(mockClient);
      
      expect(mockClient.joinGroup).toHaveBeenCalledTimes(3);
    });
  });
});

