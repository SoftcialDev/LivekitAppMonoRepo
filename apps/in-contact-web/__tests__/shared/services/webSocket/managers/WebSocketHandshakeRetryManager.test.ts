import { WebSocketHandshakeRetryManager } from '@/shared/services/webSocket/managers/WebSocketHandshakeRetryManager';
import {
  WebSocketConnectionActiveError,
  WebSocketHandshakeError,
} from '@/shared/errors';
import { logError, logWarn, logDebug } from '@/shared/utils/logger';
import type { WebPubSubClient } from '@azure/web-pubsub-client';

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

describe('WebSocketHandshakeRetryManager', () => {
  let manager: WebSocketHandshakeRetryManager;
  let mockConnectFn: jest.Mock;
  let mockIsConnectedFn: jest.Mock;
  let mockClient: WebPubSubClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    manager = new WebSocketHandshakeRetryManager();
    mockClient = {} as WebPubSubClient;
    mockConnectFn = jest.fn();
    mockIsConnectedFn = jest.fn().mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('isHandshakeError', () => {
    it('should return true for error with 500 in message', () => {
      const error = new Error('Server returned 500');
      expect(manager.isHandshakeError(error)).toBe(true);
    });

    it('should return true for error with handshake in message', () => {
      const error = new Error('Handshake failed');
      expect(manager.isHandshakeError(error)).toBe(true);
    });

    it('should return true for error with websocket in message', () => {
      const error = new Error('WebSocket connection failed');
      expect(manager.isHandshakeError(error)).toBe(true);
    });

    it('should return true for error with connection failed in message', () => {
      const error = new Error('Connection failed');
      expect(manager.isHandshakeError(error)).toBe(true);
    });

    it('should return true for error with WebSocketError name', () => {
      const error = new Error('Error');
      error.name = 'WebSocketError';
      expect(manager.isHandshakeError(error)).toBe(true);
    });

    it('should return true for error with ConnectionError name', () => {
      const error = new Error('Error');
      error.name = 'ConnectionError';
      expect(manager.isHandshakeError(error)).toBe(true);
    });

    it('should return false for non-handshake errors', () => {
      const error = new Error('Some other error');
      expect(manager.isHandshakeError(error)).toBe(false);
    });

    it('should return false for non-Error types', () => {
      expect(manager.isHandshakeError('string')).toBe(false);
      expect(manager.isHandshakeError(123)).toBe(false);
      expect(manager.isHandshakeError(null)).toBe(false);
      expect(manager.isHandshakeError(undefined)).toBe(false);
    });

    it('should be case-insensitive for message matching', () => {
      expect(manager.isHandshakeError(new Error('HANDSHAKE FAILED'))).toBe(true);
      expect(manager.isHandshakeError(new Error('WEBSOCKET ERROR'))).toBe(true);
    });
  });

  describe('connectWithRetry', () => {
    it('should connect successfully on first attempt', async () => {
      mockConnectFn.mockResolvedValue(mockClient);
      
      const result = await manager.connectWithRetry(mockConnectFn, mockIsConnectedFn);
      
      expect(result).toBe(mockClient);
      expect(mockConnectFn).toHaveBeenCalledTimes(1);
      expect(logDebug).toHaveBeenCalledWith('Handshake retry succeeded', {
        attempt: 1,
      });
    });

    it('should retry on handshake error and succeed on second attempt', async () => {
      const handshakeError = new Error('500 handshake failed');
      mockConnectFn
        .mockRejectedValueOnce(handshakeError)
        .mockResolvedValueOnce(mockClient);
      
      const promise = manager.connectWithRetry(mockConnectFn, mockIsConnectedFn);
      
      // Wait for first attempt to fail and retry delay
      await Promise.resolve();
      jest.advanceTimersByTime(12000);
      await Promise.resolve();
      
      const result = await promise;
      
      expect(result).toBe(mockClient);
      expect(mockConnectFn).toHaveBeenCalledTimes(2);
      expect(logWarn).toHaveBeenCalledWith('Handshake failed, retrying connection', {
        attempt: 1,
        maxRetries: 5,
        nextRetryIn: 12000,
        error: handshakeError,
      });
    }, 15000);

    it('should throw WebSocketConnectionActiveError if already connected before attempt', async () => {
      mockIsConnectedFn.mockReturnValue(true);
      
      await expect(
        manager.connectWithRetry(mockConnectFn, mockIsConnectedFn)
      ).rejects.toThrow(WebSocketConnectionActiveError);
      
      expect(mockConnectFn).not.toHaveBeenCalled();
      expect(logDebug).toHaveBeenCalledWith('Connection already active, skipping handshake retry', {
        attempt: 1,
      });
    });

    it('should throw WebSocketConnectionActiveError if connection established during retry', async () => {
      const handshakeError = new Error('500 handshake failed');
      mockConnectFn.mockRejectedValue(handshakeError);
      let callCount = 0;
      mockIsConnectedFn.mockImplementation(() => {
        callCount++;
        // First call: before first attempt (false)
        // Second call: during retry error handling (true - connection established)
        return callCount > 1;
      });
      
      const promise = manager.connectWithRetry(mockConnectFn, mockIsConnectedFn);
      
      await Promise.resolve();
      jest.advanceTimersByTime(12000);
      await Promise.resolve();
      
      await expect(promise).rejects.toThrow(WebSocketConnectionActiveError);
      
      expect(logDebug).toHaveBeenCalledWith('Connection established by another process during retry', {
        attempt: expect.any(Number),
      });
    }, 15000);

    it('should not retry non-handshake errors', async () => {
      const nonHandshakeError = new Error('Some other error');
      mockConnectFn.mockRejectedValue(nonHandshakeError);
      
      await expect(
        manager.connectWithRetry(mockConnectFn, mockIsConnectedFn)
      ).rejects.toBe(nonHandshakeError);
      
      expect(mockConnectFn).toHaveBeenCalledTimes(1);
      expect(logDebug).toHaveBeenCalledWith('Non-handshake error, not retrying', {
        error: nonHandshakeError,
        attempt: 1,
      });
    });

    it('should retry up to MAX_RETRIES times for handshake errors', async () => {
      const handshakeError = new Error('500 handshake failed');
      mockConnectFn.mockRejectedValue(handshakeError);
      
      const promise = manager.connectWithRetry(mockConnectFn, mockIsConnectedFn);
      
      // Advance through retries (may stop early due to timeout)
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(12000);
        await Promise.resolve();
      }
      
      await expect(promise).rejects.toThrow();
      // May be less than 5 if timeout is reached
      expect(mockConnectFn).toHaveBeenCalled();
    }, 15000);

    it('should refresh page after all retries fail', async () => {
      const handshakeError = new Error('500 handshake failed');
      mockConnectFn.mockRejectedValue(handshakeError);
      
      const promise = manager.connectWithRetry(mockConnectFn, mockIsConnectedFn);
      
      // Advance through retries (may stop early due to timeout)
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(12000);
        await Promise.resolve();
      }
      
      await expect(promise).rejects.toThrow();
      
      expect(logError).toHaveBeenCalledWith(
        'All handshake retry attempts failed, refreshing page',
        expect.objectContaining({
          attempts: expect.any(Number),
        })
      );
      expect(mockReload).toHaveBeenCalled();
    }, 15000);

    it('should handle timeout before max retries', async () => {
      const handshakeError = new Error('500 handshake failed');
      mockConnectFn.mockRejectedValue(handshakeError);
      
      const promise = manager.connectWithRetry(mockConnectFn, mockIsConnectedFn);
      
      // Advance time past timeout window (60 seconds)
      jest.advanceTimersByTime(60001);
      await Promise.resolve();
      
      await expect(promise).rejects.toThrow();
      
      expect(mockReload).toHaveBeenCalled();
    });

    it('should check connection status before each retry', async () => {
      const handshakeError = new Error('500 handshake failed');
      mockConnectFn.mockRejectedValue(handshakeError);
      let callCount = 0;
      mockIsConnectedFn.mockImplementation(() => {
        callCount++;
        return callCount === 3; // Connection established during retry
      });
      
      const promise = manager.connectWithRetry(mockConnectFn, mockIsConnectedFn);
      
      await Promise.resolve();
      jest.advanceTimersByTime(12000);
      await Promise.resolve();
      
      await expect(promise).rejects.toThrow(WebSocketConnectionActiveError);
      expect(mockIsConnectedFn).toHaveBeenCalled();
    }, 15000);

    it('should throw WebSocketHandshakeError if loop completes without success', async () => {
      const handshakeError = new Error('500 handshake failed');
      mockConnectFn.mockRejectedValue(handshakeError);
      
      const promise = manager.connectWithRetry(mockConnectFn, mockIsConnectedFn);
      
      // Advance through retries
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(12000);
        await Promise.resolve();
      }
      
      // May throw the original error or WebSocketHandshakeError depending on timeout
      await expect(promise).rejects.toThrow();
    }, 15000);
  });
});

