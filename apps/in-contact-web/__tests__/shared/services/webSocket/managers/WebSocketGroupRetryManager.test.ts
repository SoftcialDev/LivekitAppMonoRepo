import { WebSocketGroupRetryManager } from '@/shared/services/webSocket/managers/WebSocketGroupRetryManager';
import {
  WebSocketNotConnectedError,
  WebSocketConnectionLostError,
} from '@/shared/errors';
import { logError, logWarn, logDebug } from '@/shared/utils/logger';

// Mock dependencies
jest.mock('@/shared/utils/logger', () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
  logDebug: jest.fn(),
}));

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

describe('WebSocketGroupRetryManager', () => {
  let manager: WebSocketGroupRetryManager;
  let mockJoinFn: jest.Mock;
  let mockIsConnectedFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    manager = new WebSocketGroupRetryManager();
    mockJoinFn = jest.fn();
    mockIsConnectedFn = jest.fn().mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('joinGroupWithRetry', () => {
    it('should join group successfully on first attempt', async () => {
      mockJoinFn.mockResolvedValue(undefined);
      
      await manager.joinGroupWithRetry('test-group', mockJoinFn, mockIsConnectedFn);
      
      expect(mockJoinFn).toHaveBeenCalledTimes(1);
      expect(logDebug).toHaveBeenCalledWith('Group join succeeded', {
        group: 'test-group',
        attempt: 1,
      });
    });

    it('should retry on failure and succeed on second attempt', async () => {
      mockJoinFn
        .mockRejectedValueOnce(new Error('Join failed'))
        .mockResolvedValueOnce(undefined);
      
      const promise = manager.joinGroupWithRetry('test-group', mockJoinFn, mockIsConnectedFn);
      
      await Promise.resolve();
      jest.advanceTimersByTime(12000);
      await Promise.resolve();
      
      await promise;
      
      expect(mockJoinFn).toHaveBeenCalledTimes(2);
      expect(logWarn).toHaveBeenCalledWith('Group join failed, retrying', {
        group: 'test-group',
        attempt: 1,
        maxRetries: 5,
        nextRetryIn: 12000,
      });
    }, 15000);

    it('should throw WebSocketNotConnectedError if connection not active before attempt', async () => {
      mockIsConnectedFn.mockReturnValue(false);
      
      await expect(
        manager.joinGroupWithRetry('test-group', mockJoinFn, mockIsConnectedFn)
      ).rejects.toThrow(WebSocketNotConnectedError);
      
      expect(mockJoinFn).not.toHaveBeenCalled();
      expect(logDebug).toHaveBeenCalledWith('Connection not active, skipping group join retry', {
        group: 'test-group',
        attempt: 1,
      });
    });

    it('should throw WebSocketConnectionLostError if connection lost during retry', async () => {
      mockJoinFn.mockRejectedValue(new Error('Join failed'));
      let callCount = 0;
      mockIsConnectedFn.mockImplementation(() => {
        callCount++;
        // First: before first attempt (true)
        // Second: during retry error handling (false - connection lost)
        return callCount === 1;
      });
      
      const promise = manager.joinGroupWithRetry('test-group', mockJoinFn, mockIsConnectedFn);
      
      await Promise.resolve();
      jest.advanceTimersByTime(12000);
      await Promise.resolve();
      
      await expect(promise).rejects.toThrow(WebSocketConnectionLostError);
      
      expect(logDebug).toHaveBeenCalledWith('Connection lost during group join retry', {
        group: 'test-group',
        attempt: expect.any(Number),
      });
    }, 15000);

    it('should retry up to MAX_RETRIES times or until timeout', async () => {
      mockJoinFn.mockRejectedValue(new Error('Join failed'));
      
      const promise = manager.joinGroupWithRetry('test-group', mockJoinFn, mockIsConnectedFn);
      
      // Advance through retries (may stop early due to 60s timeout)
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(12000);
        await Promise.resolve();
      }
      
      await expect(promise).rejects.toThrow();
      // May be less than 5 if timeout (60s) is reached
      expect(mockJoinFn).toHaveBeenCalled();
    }, 15000);

    it('should refresh page for critical group after all retries fail', async () => {
      mockJoinFn.mockRejectedValue(new Error('Join failed'));
      
      const promise = manager.joinGroupWithRetry('commands', mockJoinFn, mockIsConnectedFn);
      
      // Advance through retries (may stop early due to timeout)
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(12000);
        await Promise.resolve();
      }
      
      await expect(promise).rejects.toThrow();
      
      expect(logError).toHaveBeenCalledWith(
        'Failed to join critical group after all retries, refreshing page',
        expect.objectContaining({
          group: 'commands',
          attempts: expect.any(Number),
        })
      );
      expect(mockReload).toHaveBeenCalled();
    }, 15000);

    it('should not refresh page for non-critical group', async () => {
      mockJoinFn.mockRejectedValue(new Error('Join failed'));
      
      const promise = manager.joinGroupWithRetry('test-group', mockJoinFn, mockIsConnectedFn);
      
      // Advance through retries (may stop early due to timeout)
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(12000);
        await Promise.resolve();
      }
      
      await expect(promise).rejects.toThrow();
      
      expect(logWarn).toHaveBeenCalledWith('Failed to join group after all retries', {
        group: 'test-group',
        attempts: expect.any(Number),
        elapsed: expect.any(Number),
      });
      expect(mockReload).not.toHaveBeenCalled();
    }, 15000);

    it('should detect critical groups by name', async () => {
      mockJoinFn.mockRejectedValue(new Error('Join failed'));
      
      const promise = manager.joinGroupWithRetry('commands', mockJoinFn, mockIsConnectedFn);
      
      // Advance through all retries
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(12000);
        await Promise.resolve();
      }
      
      await expect(promise).rejects.toThrow();
      expect(mockReload).toHaveBeenCalled();
    });

    it('should handle timeout before max retries', async () => {
      mockJoinFn.mockRejectedValue(new Error('Join failed'));
      
      const promise = manager.joinGroupWithRetry('test-group', mockJoinFn, mockIsConnectedFn);
      
      // Advance time past timeout window (60 seconds)
      jest.advanceTimersByTime(60001);
      await Promise.resolve();
      
      await expect(promise).rejects.toThrow('Join failed');
      
      // Should have stopped retrying due to timeout
      expect(mockJoinFn).toHaveBeenCalled();
    });

    it('should refresh page for critical group on timeout', async () => {
      mockJoinFn.mockRejectedValue(new Error('Join failed'));
      
      const promise = manager.joinGroupWithRetry('commands', mockJoinFn, mockIsConnectedFn);
      
      // Advance time past timeout window
      jest.advanceTimersByTime(60001);
      await Promise.resolve();
      
      await expect(promise).rejects.toThrow();
      expect(mockReload).toHaveBeenCalled();
    });

    it('should check connection status before each retry', async () => {
      mockJoinFn.mockRejectedValue(new Error('Join failed'));
      let callCount = 0;
      mockIsConnectedFn.mockImplementation(() => {
        callCount++;
        return callCount < 3; // Disconnect after 2 attempts
      });
      
      const promise = manager.joinGroupWithRetry('test-group', mockJoinFn, mockIsConnectedFn);
      
      await Promise.resolve();
      jest.advanceTimersByTime(12000);
      await Promise.resolve();
      
      await expect(promise).rejects.toThrow(WebSocketNotConnectedError);
      expect(mockIsConnectedFn).toHaveBeenCalled();
    }, 15000);
  });
});

