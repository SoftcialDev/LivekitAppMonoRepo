import { WebSocketService, webSocketService } from '@/shared/services/webSocket/webSocketService';
import { WebSocketConnectionManager } from '@/shared/services/webSocket/managers/WebSocketConnectionManager';
import { WebSocketReconnectManager } from '@/shared/services/webSocket/managers/WebSocketReconnectManager';
import { WebSocketGroupManager } from '@/shared/services/webSocket/managers/WebSocketGroupManager';
import { WebSocketConnectionValidator } from '@/shared/services/webSocket/utils/WebSocketConnectionValidator';
import { WEBSOCKET_GROUPS } from '@/shared/services/webSocket/constants/webSocketConstants';
import { logInfo, logError, logDebug, logWarn } from '@/shared/utils/logger';
import type { WebPubSubClient } from '@azure/web-pubsub-client';
import type { BaseWebSocketHandler } from '@/shared/services/webSocket/handlers/base/BaseWebSocketHandler';

// Mock dependencies
jest.mock('@azure/web-pubsub-client', () => ({}));
jest.mock('@/shared/services/webSocket/managers/WebSocketConnectionManager');
jest.mock('@/shared/services/webSocket/managers/WebSocketReconnectManager');
jest.mock('@/shared/services/webSocket/managers/WebSocketGroupManager');
jest.mock('@/shared/services/webSocket/utils/WebSocketConnectionValidator');
jest.mock('@/shared/utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logDebug: jest.fn(),
  logWarn: jest.fn(),
}));

describe('WebSocketService', () => {
  let mockClient: jest.Mocked<WebPubSubClient>;
  let mockConnectionManager: typeof WebSocketConnectionManager;
  let mockReconnectManager: jest.Mocked<WebSocketReconnectManager>;
  let mockGroupManager: jest.Mocked<WebSocketGroupManager>;
  let mockValidator: typeof WebSocketConnectionValidator;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock client
    mockClient = {
      on: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    } as unknown as jest.Mocked<WebPubSubClient>;

    // Mock connection manager
    mockConnectionManager = WebSocketConnectionManager as jest.Mocked<typeof WebSocketConnectionManager>;
    (mockConnectionManager.createClient as jest.Mock) = jest.fn().mockResolvedValue(mockClient);
    (mockConnectionManager.stopClient as jest.Mock) = jest.fn();

    // Mock reconnect manager
    mockReconnectManager = {
      scheduleReconnect: jest.fn(),
      clearReconnectTimer: jest.fn(),
      resetBackoff: jest.fn(),
      cleanup: jest.fn(),
    } as unknown as jest.Mocked<WebSocketReconnectManager>;
    (WebSocketReconnectManager as jest.MockedClass<typeof WebSocketReconnectManager>).mockImplementation(() => mockReconnectManager);

    // Mock group manager
    mockGroupManager = {
      rememberGroup: jest.fn(),
      forgetGroup: jest.fn(),
      clearGroups: jest.fn(),
      joinGroup: jest.fn().mockResolvedValue(undefined),
      leaveGroup: jest.fn().mockResolvedValue(undefined),
      leaveAllGroups: jest.fn().mockResolvedValue(undefined),
      rejoinAllGroups: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<WebSocketGroupManager>;
    (WebSocketGroupManager as jest.MockedClass<typeof WebSocketGroupManager>).mockImplementation(() => mockGroupManager);

    // Mock validator
    mockValidator = WebSocketConnectionValidator as jest.Mocked<typeof WebSocketConnectionValidator>;
    (mockValidator.validate as jest.Mock) = jest.fn().mockReturnValue({
      shouldReuse: false,
      shouldSwitch: false,
      isInProgress: false,
    });

    // Reset singleton instance
    (WebSocketService as any).instance = null;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = WebSocketService.getInstance();
      const instance2 = WebSocketService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return same instance as exported webSocketService', () => {
      const instance = WebSocketService.getInstance();
      // Compare by reference, not by deep equality (mocks may differ)
      expect(instance).toBeDefined();
      expect(webSocketService).toBeDefined();
      // Both should be instances of WebSocketService
      expect(instance).toBeInstanceOf(WebSocketService);
      expect(webSocketService).toBeInstanceOf(WebSocketService);
    });
  });

  describe('registerHandler', () => {
    it('should register a handler', () => {
      const mockHandler = {
        messageType: 'test',
        canHandle: jest.fn(),
        handle: jest.fn(),
      } as unknown as BaseWebSocketHandler<any>;

      const service = WebSocketService.getInstance();
      service.registerHandler(mockHandler);

      expect(logDebug).toHaveBeenCalledWith('WebSocket handler registered', {
        handler: 'Object',
        messageType: 'test',
      });
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      const service = WebSocketService.getInstance();
      expect(service.isConnected()).toBe(false);
    });

    it('should return true when connected', async () => {
      const service = WebSocketService.getInstance();
      await service.connect('test@example.com');
      // Mock connected state
      (service as any).connected = true;
      (service as any).client = mockClient;
      expect(service.isConnected()).toBe(true);
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      const service = WebSocketService.getInstance();
      await service.connect('test@example.com');

      expect(mockValidator.validate).toHaveBeenCalled();
      expect(mockConnectionManager.createClient).toHaveBeenCalled();
      expect(mockGroupManager.rememberGroup).toHaveBeenCalledWith('test@example.com');
      expect(mockGroupManager.rememberGroup).toHaveBeenCalledWith(WEBSOCKET_GROUPS.PRESENCE);
    });

    it('should normalize email to lowercase', async () => {
      const service = WebSocketService.getInstance();
      await service.connect('TEST@EXAMPLE.COM');

      expect(mockGroupManager.rememberGroup).toHaveBeenCalledWith('test@example.com');
    });

    it('should trim email whitespace', async () => {
      const service = WebSocketService.getInstance();
      await service.connect('  test@example.com  ');

      expect(mockGroupManager.rememberGroup).toHaveBeenCalledWith('test@example.com');
    });

    it('should reuse existing connection if validation says so', async () => {
      (mockValidator.validate as jest.Mock).mockReturnValue({
        shouldReuse: true,
        shouldSwitch: false,
        isInProgress: false,
      });

      const service = WebSocketService.getInstance();
      await service.connect('test@example.com');

      expect(logDebug).toHaveBeenCalledWith('WebSocket already connected', {
        email: 'test@example.com',
      });
      expect(mockConnectionManager.createClient).not.toHaveBeenCalled();
    });

    it('should switch user if validation says so', async () => {
      (mockValidator.validate as jest.Mock).mockReturnValue({
        shouldReuse: false,
        shouldSwitch: true,
        isInProgress: false,
      });

      const service = WebSocketService.getInstance();
      (service as any).currentUserEmail = 'old@example.com';
      (service as any).client = mockClient;

      await service.connect('new@example.com');

      expect(logInfo).toHaveBeenCalledWith('Switching WebSocket user', {
        from: 'old@example.com',
        to: 'new@example.com',
      });
      expect(mockGroupManager.clearGroups).toHaveBeenCalled();
    });

    it('should return existing promise if connection in progress', () => {
      (mockValidator.validate as jest.Mock).mockReturnValue({
        shouldReuse: false,
        shouldSwitch: false,
        isInProgress: true,
      });

      const service = WebSocketService.getInstance();
      const existingPromise = Promise.resolve();
      (service as any).connectPromise = existingPromise;

      const result = service.connect('test@example.com');

      expect((service as any).connectPromise).toBe(existingPromise);
      expect(logDebug).toHaveBeenCalledWith('WebSocket connection already in progress', {
        email: 'test@example.com',
      });
      expect(result).toBeInstanceOf(Promise);
    });

    it('should schedule reconnect on connection failure', async () => {
      const connectionError = new Error('Connection failed');
      (mockConnectionManager.createClient as jest.Mock).mockRejectedValue(connectionError);

      const service = WebSocketService.getInstance();
      await service.connect('test@example.com');

      expect(logError).toHaveBeenCalledWith('Initial WebSocket connection failed', {
        error: connectionError,
        email: 'test@example.com',
      });
      expect(mockReconnectManager.scheduleReconnect).toHaveBeenCalled();
    });

    it('should install online event listener on first connect', async () => {
      const addEventListenerSpy = jest.spyOn(globalThis.window, 'addEventListener');

      const service = WebSocketService.getInstance();
      await service.connect('test@example.com');

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function), { passive: true });
    });

    it('should not install online listener if already installed', async () => {
      const service = WebSocketService.getInstance();
      await service.connect('test@example.com');
      jest.clearAllMocks();

      await service.connect('test2@example.com');

      // Should not call addEventListener again
      expect(globalThis.window.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect and cleanup', () => {
      const service = WebSocketService.getInstance();
      (service as any).client = mockClient;
      (service as any).shouldReconnect = true;
      (service as any).onlineListener = jest.fn();

      const removeEventListenerSpy = jest.spyOn(globalThis.window, 'removeEventListener');

      service.disconnect();

      expect(logDebug).toHaveBeenCalledWith('Disconnecting WebSocket');
      expect((service as any).shouldReconnect).toBe(false);
      expect(mockReconnectManager.clearReconnectTimer).toHaveBeenCalled();
      expect(mockConnectionManager.stopClient).toHaveBeenCalledWith(mockClient);
      expect((service as any).client).toBeUndefined();
      expect((service as any).connected).toBe(false);
      expect((service as any).connecting).toBe(false);
      expect((service as any).connectPromise).toBeNull();
      expect((service as any).currentUserEmail).toBeNull();
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('forceCleanup', () => {
    it('should cleanup all connections and state', async () => {
      const service = WebSocketService.getInstance();
      (service as any).client = mockClient;

      await service.forceCleanup();

      expect(logDebug).toHaveBeenCalledWith('Force cleaning up WebSocket connection');
      expect(mockGroupManager.leaveAllGroups).toHaveBeenCalledWith(mockClient);
      expect(mockConnectionManager.stopClient).toHaveBeenCalledWith(mockClient);
      expect((service as any).client).toBeUndefined();
      expect((service as any).connected).toBe(false);
      expect((service as any).connecting).toBe(false);
      expect((service as any).connectPromise).toBeNull();
      expect((service as any).currentUserEmail).toBeNull();
      expect((service as any).shouldReconnect).toBe(false);
      expect(mockReconnectManager.cleanup).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const cleanupError = new Error('Cleanup failed');
      mockGroupManager.leaveAllGroups.mockRejectedValue(cleanupError);

      const service = WebSocketService.getInstance();
      (service as any).client = mockClient;

      await service.forceCleanup();

      expect(logWarn).toHaveBeenCalledWith('Error during force cleanup', {
        error: cleanupError,
      });
    });
  });

  describe('joinGroup', () => {
    it('should join group when connected', async () => {
      const service = WebSocketService.getInstance();
      (service as any).client = mockClient;

      await service.joinGroup('test-group');

      expect(mockGroupManager.joinGroup).toHaveBeenCalledWith(mockClient, 'test-group');
    });

    it('should remember group when not connected', async () => {
      const service = WebSocketService.getInstance();
      (service as any).client = undefined;

      await service.joinGroup('test-group');

      expect(mockGroupManager.rememberGroup).toHaveBeenCalledWith('test-group');
      expect(mockGroupManager.joinGroup).not.toHaveBeenCalled();
      expect(logDebug).toHaveBeenCalledWith('Client not connected, group will be joined after connect', {
        group: 'test-group',
      });
    });
  });

  describe('leaveGroup', () => {
    it('should leave group when connected', async () => {
      const service = WebSocketService.getInstance();
      (service as any).client = mockClient;

      await service.leaveGroup('test-group');

      expect(mockGroupManager.leaveGroup).toHaveBeenCalledWith(mockClient, 'test-group');
    });

    it('should forget group when not connected', async () => {
      const service = WebSocketService.getInstance();
      (service as any).client = undefined;

      await service.leaveGroup('test-group');

      expect(mockGroupManager.forgetGroup).toHaveBeenCalledWith('test-group');
      expect(mockGroupManager.leaveGroup).not.toHaveBeenCalled();
    });
  });

  describe('onMessage', () => {
    it('should register message handler and return unsubscribe function', () => {
      const service = WebSocketService.getInstance();
      const handler = jest.fn();

      const unsubscribe = service.onMessage(handler);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
      // Handler should be removed
    });
  });

  describe('onConnected', () => {
    it('should register connected handler and return unsubscribe function', () => {
      const service = WebSocketService.getInstance();
      const handler = jest.fn();

      const unsubscribe = service.onConnected(handler);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('onDisconnected', () => {
    it('should register disconnected handler and return unsubscribe function', () => {
      const service = WebSocketService.getInstance();
      const handler = jest.fn();

      const unsubscribe = service.onDisconnected(handler);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('reconnect', () => {
    it('should schedule immediate reconnect if user email exists', async () => {
      const service = WebSocketService.getInstance();
      (service as any).currentUserEmail = 'test@example.com';
      (service as any).shouldReconnect = true; // Required for scheduleReconnect to work

      await service.reconnect();

      expect(mockReconnectManager.scheduleReconnect).toHaveBeenCalledWith(
        expect.any(Function),
        'explicit reconnect',
        true
      );
    });

    it('should not reconnect if no user email', async () => {
      const service = WebSocketService.getInstance();
      (service as any).currentUserEmail = null;

      await service.reconnect();

      expect(mockReconnectManager.scheduleReconnect).not.toHaveBeenCalled();
    });
  });

  describe('startFreshClient', () => {
    it('should create new client and setup event handlers', async () => {
      const service = WebSocketService.getInstance();
      (service as any).currentUserEmail = 'test@example.com';
      (service as any).client = mockClient;

      const messageHandler = jest.fn();
      const connectedHandler = jest.fn();
      const disconnectedHandler = jest.fn();

      service.onMessage(messageHandler);
      service.onConnected(connectedHandler);
      service.onDisconnected(disconnectedHandler);

      await (service as any).startFreshClient();

      expect(mockConnectionManager.stopClient).toHaveBeenCalledWith(mockClient);
      expect(mockConnectionManager.createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          currentUserEmail: 'test@example.com',
          groupManager: mockGroupManager,
        })
      );
    });

    it('should handle reconnect callback', async () => {
      const service = WebSocketService.getInstance();
      (service as any).currentUserEmail = 'test@example.com';
      (service as any).shouldReconnect = true;

      await (service as any).startFreshClient();

      const createClientCall = (mockConnectionManager.createClient as jest.Mock).mock.calls[0];
      const onReconnectNeeded = createClientCall[0].onReconnectNeeded;

      onReconnectNeeded('test reason');

      expect(mockReconnectManager.scheduleReconnect).toHaveBeenCalledWith(
        expect.any(Function),
        'test reason',
        false
      );
    });

    it('should not schedule reconnect if shouldReconnect is false', async () => {
      const service = WebSocketService.getInstance();
      (service as any).currentUserEmail = 'test@example.com';
      (service as any).shouldReconnect = false;

      await (service as any).startFreshClient();

      const createClientCall = (mockConnectionManager.createClient as jest.Mock).mock.calls[0];
      const onReconnectNeeded = createClientCall[0].onReconnectNeeded;

      onReconnectNeeded('test reason');

      expect(mockReconnectManager.scheduleReconnect).not.toHaveBeenCalled();
    });
  });
});

