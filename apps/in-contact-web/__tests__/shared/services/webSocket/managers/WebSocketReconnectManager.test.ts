import { WebSocketReconnectManager } from '@/shared/services/webSocket/managers/WebSocketReconnectManager';
import { RECONNECT_CONFIG } from '@/shared/services/webSocket/constants/webSocketConstants';
import { getSecureRandomInt } from '@/shared/utils/cryptoUtils';
import { logDebug } from '@/shared/utils/logger';

// Mock dependencies
jest.mock('@/shared/utils/cryptoUtils', () => ({
  getSecureRandomInt: jest.fn(),
}));

jest.mock('@/shared/utils/logger', () => ({
  logDebug: jest.fn(),
}));

describe('WebSocketReconnectManager', () => {
  let manager: WebSocketReconnectManager;
  let mockReconnectFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    manager = new WebSocketReconnectManager();
    mockReconnectFn = jest.fn().mockResolvedValue(undefined);
    (getSecureRandomInt as jest.Mock).mockReturnValue(200);
  });

  afterEach(() => {
    manager.cleanup();
    jest.useRealTimers();
  });

  describe('getBackoff', () => {
    it('should return initial backoff value', () => {
      expect(manager.getBackoff()).toBe(RECONNECT_CONFIG.INITIAL_BACKOFF_MS);
    });

    it('should return current backoff after increase', () => {
      manager.increaseBackoff();
      expect(manager.getBackoff()).toBe(RECONNECT_CONFIG.INITIAL_BACKOFF_MS * 2);
    });
  });

  describe('resetBackoff', () => {
    it('should reset backoff to initial value', () => {
      manager.increaseBackoff();
      manager.increaseBackoff();
      expect(manager.getBackoff()).toBeGreaterThan(RECONNECT_CONFIG.INITIAL_BACKOFF_MS);
      
      manager.resetBackoff();
      expect(manager.getBackoff()).toBe(RECONNECT_CONFIG.INITIAL_BACKOFF_MS);
    });
  });

  describe('increaseBackoff', () => {
    it('should double the backoff value', () => {
      const initial = manager.getBackoff();
      manager.increaseBackoff();
      expect(manager.getBackoff()).toBe(initial * 2);
    });

    it('should cap backoff at MAX_BACKOFF_MS', () => {
      // Increase multiple times to exceed max
      for (let i = 0; i < 10; i++) {
        manager.increaseBackoff();
      }
      expect(manager.getBackoff()).toBeLessThanOrEqual(RECONNECT_CONFIG.MAX_BACKOFF_MS);
    });

    it('should not exceed MAX_BACKOFF_MS even with many increases', () => {
      for (let i = 0; i < 20; i++) {
        manager.increaseBackoff();
      }
      expect(manager.getBackoff()).toBe(RECONNECT_CONFIG.MAX_BACKOFF_MS);
    });
  });

  describe('calculateDelay', () => {
    it('should return 0 for immediate reconnect', () => {
      const delay = manager.calculateDelay(true);
      expect(delay).toBe(0);
    });

    it('should return backoff plus jitter for non-immediate reconnect', () => {
      const jitter = 200;
      (getSecureRandomInt as jest.Mock).mockReturnValue(jitter);
      
      const delay = manager.calculateDelay(false);
      expect(delay).toBe(RECONNECT_CONFIG.INITIAL_BACKOFF_MS + jitter);
    });

    it('should cap delay at MAX_BACKOFF_MS', () => {
      manager.increaseBackoff();
      manager.increaseBackoff();
      manager.increaseBackoff();
      manager.increaseBackoff();
      manager.increaseBackoff();
      
      const largeJitter = 10000;
      (getSecureRandomInt as jest.Mock).mockReturnValue(largeJitter);
      
      const delay = manager.calculateDelay(false);
      expect(delay).toBeLessThanOrEqual(RECONNECT_CONFIG.MAX_BACKOFF_MS);
    });

    it('should use secure random for jitter', () => {
      manager.calculateDelay(false);
      expect(getSecureRandomInt).toHaveBeenCalledWith(RECONNECT_CONFIG.JITTER_MAX_MS);
    });
  });

  describe('scheduleReconnect', () => {
    it('should schedule reconnect with calculated delay', async () => {
      const jitter = 150;
      (getSecureRandomInt as jest.Mock).mockReturnValue(jitter);
      
      manager.scheduleReconnect(mockReconnectFn, 'test reason', false);
      
      expect(logDebug).toHaveBeenCalledWith('Scheduling WebSocket reconnect', {
        reason: 'test reason',
        delayMs: RECONNECT_CONFIG.INITIAL_BACKOFF_MS + jitter,
      });
      
      jest.advanceTimersByTime(RECONNECT_CONFIG.INITIAL_BACKOFF_MS + jitter);
      await Promise.resolve();
      
      expect(mockReconnectFn).toHaveBeenCalled();
    });

    it('should schedule immediate reconnect when immediate is true', async () => {
      manager.scheduleReconnect(mockReconnectFn, 'immediate reason', true);
      
      expect(logDebug).toHaveBeenCalledWith('Scheduling WebSocket reconnect', {
        reason: 'immediate reason',
        delayMs: 0,
      });
      
      jest.advanceTimersByTime(0);
      await Promise.resolve();
      
      expect(mockReconnectFn).toHaveBeenCalled();
    });

    it('should reset backoff on successful reconnect', async () => {
      manager.increaseBackoff();
      const increasedBackoff = manager.getBackoff();
      expect(increasedBackoff).toBeGreaterThan(RECONNECT_CONFIG.INITIAL_BACKOFF_MS);
      
      manager.scheduleReconnect(mockReconnectFn, 'test', false);
      
      const delay = manager.calculateDelay(false);
      jest.advanceTimersByTime(delay);
      await Promise.resolve();
      
      // Backoff should be reset after successful reconnect
      expect(manager.getBackoff()).toBe(RECONNECT_CONFIG.INITIAL_BACKOFF_MS);
    });

    it('should increase backoff on failed reconnect and schedule retry', async () => {
      const failingReconnect = jest.fn().mockRejectedValue(new Error('Reconnect failed'));
      const initialBackoff = manager.getBackoff();
      
      manager.scheduleReconnect(failingReconnect, 'test', false);
      
      jest.advanceTimersByTime(RECONNECT_CONFIG.INITIAL_BACKOFF_MS + 200);
      await Promise.resolve();
      
      expect(manager.getBackoff()).toBeGreaterThan(initialBackoff);
      expect(failingReconnect).toHaveBeenCalled();
    });

    it('should clear existing timer before scheduling new one', () => {
      manager.scheduleReconnect(mockReconnectFn, 'first', false);
      manager.scheduleReconnect(mockReconnectFn, 'second', false);
      
      jest.advanceTimersByTime(RECONNECT_CONFIG.INITIAL_BACKOFF_MS + 200);
      
      // Should only call once (second schedule cleared the first)
      expect(mockReconnectFn).toHaveBeenCalledTimes(1);
    });

    it('should schedule retry with increased backoff after failure', async () => {
      const failingReconnect = jest.fn().mockRejectedValue(new Error('Failed'));
      const jitter = 200;
      (getSecureRandomInt as jest.Mock).mockReturnValue(jitter);
      
      manager.scheduleReconnect(failingReconnect, 'test', false);
      
      const firstDelay = RECONNECT_CONFIG.INITIAL_BACKOFF_MS + jitter;
      jest.advanceTimersByTime(firstDelay);
      await Promise.resolve();
      
      // Should have increased backoff
      const increasedBackoff = manager.getBackoff();
      expect(increasedBackoff).toBe(RECONNECT_CONFIG.INITIAL_BACKOFF_MS * 2);
      
      // Should schedule next retry
      const secondDelay = increasedBackoff + jitter;
      jest.advanceTimersByTime(secondDelay);
      await Promise.resolve();
      
      expect(failingReconnect).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearReconnectTimer', () => {
    it('should clear scheduled reconnect timer', () => {
      manager.scheduleReconnect(mockReconnectFn, 'test', false);
      manager.clearReconnectTimer();
      
      jest.advanceTimersByTime(10000);
      
      expect(mockReconnectFn).not.toHaveBeenCalled();
    });

    it('should not throw if no timer is set', () => {
      expect(() => manager.clearReconnectTimer()).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should clear timer and reset backoff', () => {
      manager.increaseBackoff();
      manager.scheduleReconnect(mockReconnectFn, 'test', false);
      
      manager.cleanup();
      
      expect(manager.getBackoff()).toBe(RECONNECT_CONFIG.INITIAL_BACKOFF_MS);
      
      jest.advanceTimersByTime(10000);
      expect(mockReconnectFn).not.toHaveBeenCalled();
    });
  });
});

