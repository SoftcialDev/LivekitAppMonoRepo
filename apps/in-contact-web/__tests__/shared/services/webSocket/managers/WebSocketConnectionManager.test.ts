// Mock dependencies first
jest.mock('@azure/web-pubsub-client', () => ({
  WebPubSubClient: jest.fn(),
  WebPubSubJsonProtocol: jest.fn(() => ({})),
}));

import { WebSocketConnectionManager } from '@/shared/services/webSocket/managers/WebSocketConnectionManager';
import apiClient from '@/shared/api/apiClient';
import { logInfo, logError, logWarn, logDebug } from '@/shared/utils/logger';
import { WebSocketMessageParser } from '@/shared/services/webSocket/utils/WebSocketMessageParser';
import { WebSocketHandshakeRetryManager, __mockConnectWithRetry, __mockIsHandshakeError } from '@/shared/services/webSocket/managers/WebSocketHandshakeRetryManager';
import { WEBSOCKET_GROUPS } from '@/shared/services/webSocket/constants/webSocketConstants';

const mockConnectWithRetryFn = __mockConnectWithRetry as jest.Mock;
const mockIsHandshakeErrorFn = __mockIsHandshakeError as jest.Mock;
import type { WebSocketGroupManager } from '@/shared/services/webSocket/managers/WebSocketGroupManager';
import type { IConnectionEventHandlers } from '@/shared/services/webSocket/types/webSocketManagerTypes';
import { WebPubSubClient } from '@azure/web-pubsub-client';
jest.mock('@/shared/api/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));
jest.mock('@/shared/utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
  logDebug: jest.fn(),
}));
jest.mock('@/shared/services/webSocket/utils/WebSocketMessageParser', () => ({
  WebSocketMessageParser: {
    parse: jest.fn(),
  },
}));

jest.mock('@/shared/services/webSocket/managers/WebSocketHandshakeRetryManager', () => {
  const mockConnectWithRetry = jest.fn().mockImplementation(async (connectFn) => {
    return await connectFn();
  });
  const mockIsHandshakeError = jest.fn().mockReturnValue(false);
  
  return {
    WebSocketHandshakeRetryManager: jest.fn().mockImplementation(() => ({
      connectWithRetry: mockConnectWithRetry,
      isHandshakeError: mockIsHandshakeError,
    })),
    __mockConnectWithRetry: mockConnectWithRetry,
    __mockIsHandshakeError: mockIsHandshakeError,
  };
});

describe('WebSocketConnectionManager', () => {
  let mockClient: jest.Mocked<WebPubSubClient>;
  let mockGroupManager: jest.Mocked<WebSocketGroupManager>;
  let mockEventHandlers: IConnectionEventHandlers;
  let mockOnReconnectNeeded: jest.Mock;
  let mockSetConnected: jest.Mock;
  let mockClearReconnectTimer: jest.Mock;
  let mockResetBackoff: jest.Mock;
  let mockIsConnected: jest.Mock;
  let mockHandshakeRetryManager: jest.Mocked<WebSocketHandshakeRetryManager>;

  const mockNegotiateResponse = {
    token: 'test-token',
    endpoint: 'https://test.webpubsub.azure.com',
    hubName: 'test-hub',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock WebPubSubClient
    mockClient = {
      on: jest.fn(),
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn(),
    } as unknown as jest.Mocked<WebPubSubClient>;

    (WebPubSubClient as jest.MockedClass<typeof WebPubSubClient>).mockImplementation(() => {
      return mockClient;
    });

    // Mock group manager
    mockGroupManager = {
      rememberGroup: jest.fn(),
      rejoinAllGroups: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<WebSocketGroupManager>;

    // Mock event handlers
    mockEventHandlers = {
      onConnected: new Set(),
      onDisconnected: new Set(),
      registeredHandlers: [],
      legacyMessageHandlers: new Set(),
    };

    // Mock callbacks
    mockOnReconnectNeeded = jest.fn();
    mockSetConnected = jest.fn();
    mockClearReconnectTimer = jest.fn();
    mockResetBackoff = jest.fn();
    mockIsConnected = jest.fn().mockReturnValue(false);

    // Mock API client
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: mockNegotiateResponse,
    });

    // Reset mocks
    mockConnectWithRetryFn.mockClear();
    mockIsHandshakeErrorFn.mockClear();
    mockConnectWithRetryFn.mockImplementation(async (connectFn) => {
      const client = await connectFn();
      return client;
    });
    mockIsHandshakeErrorFn.mockReturnValue(false);
    
    // Get the mock instance for reference
    const MockedHandshakeRetryManager = WebSocketHandshakeRetryManager as jest.MockedClass<typeof WebSocketHandshakeRetryManager>;
    const instance = new MockedHandshakeRetryManager();
    mockHandshakeRetryManager = instance as unknown as jest.Mocked<WebSocketHandshakeRetryManager>;
  });

  describe('createClient', () => {
    it('should create client successfully', async () => {
      const client = await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      expect(client).toBe(mockClient);
      expect(apiClient.get).toHaveBeenCalledWith('/api/WebPubSubToken');
      expect(WebPubSubClient).toHaveBeenCalledWith(
        expect.stringContaining('wss://test.webpubsub.azure.com/client/hubs/test-hub'),
        expect.objectContaining({
          protocol: expect.anything(),
        })
      );
      expect(mockClient.start).toHaveBeenCalled();
      expect(logInfo).toHaveBeenCalledWith('WebSocket client started successfully', {
        email: 'test@example.com',
      });
    });

    it('should build correct client URL from negotiate response', async () => {
      await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      const callArgs = (WebPubSubClient as jest.Mock).mock.calls[0];
      const url = callArgs[0];
      
      expect(url).toContain('wss://test.webpubsub.azure.com');
      expect(url).toContain('/client/hubs/test-hub');
      expect(url).toContain('access_token=');
      expect(url).toContain(encodeURIComponent('test-token'));
    });

    it('should convert HTTPS endpoint to WSS', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          ...mockNegotiateResponse,
          endpoint: 'https://example.com',
        },
      });

      await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      const url = (WebPubSubClient as jest.Mock).mock.calls[0][0];
      expect(url).toContain('wss://example.com');
    });

    it('should convert HTTP endpoint to WSS', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          ...mockNegotiateResponse,
          endpoint: 'http://example.com',
        },
      });

      await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      const url = (WebPubSubClient as jest.Mock).mock.calls[0][0];
      expect(url).toContain('wss://example.com');
    });

    it('should setup message handlers for group-message and server-message', async () => {
      await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      expect(mockClient.on).toHaveBeenCalledWith('group-message', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('server-message', expect.any(Function));
    });

    it('should handle messages with registered handlers first', async () => {
      const mockHandler = {
        canHandle: jest.fn().mockReturnValue(true),
        handle: jest.fn(),
        messageType: 'test',
      };
      mockEventHandlers.registeredHandlers = [mockHandler as any];

      await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      const messageHandler = (mockClient.on as jest.Mock).mock.calls.find(
        call => call[0] === 'group-message'
      )?.[1];

      const mockMessage = { type: 'test' };
      (WebSocketMessageParser.parse as jest.Mock).mockReturnValue(mockMessage);

      messageHandler({ data: 'test' });

      expect(mockHandler.canHandle).toHaveBeenCalledWith(mockMessage);
      expect(mockHandler.handle).toHaveBeenCalledWith(mockMessage);
    });

    it('should fall back to legacy handlers if registered handlers cannot handle', async () => {
      const mockLegacyHandler = jest.fn();
      mockEventHandlers.legacyMessageHandlers.add(mockLegacyHandler);

      const mockRegisteredHandler = {
        canHandle: jest.fn().mockReturnValue(false),
        handle: jest.fn(),
        messageType: 'test',
      };
      mockEventHandlers.registeredHandlers = [mockRegisteredHandler as any];

      await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      const messageHandler = (mockClient.on as jest.Mock).mock.calls.find(
        call => call[0] === 'group-message'
      )?.[1];

      const mockMessage = { type: 'test' };
      (WebSocketMessageParser.parse as jest.Mock).mockReturnValue(mockMessage);

      messageHandler({ data: 'test' });

      expect(mockLegacyHandler).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle errors in legacy message handlers gracefully', async () => {
      const mockLegacyHandler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      mockEventHandlers.legacyMessageHandlers.add(mockLegacyHandler);

      await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      const messageHandler = (mockClient.on as jest.Mock).mock.calls.find(
        call => call[0] === 'group-message'
      )?.[1];

      const mockMessage = { type: 'test' };
      (WebSocketMessageParser.parse as jest.Mock).mockReturnValue(mockMessage);

      expect(() => messageHandler({ data: 'test' })).not.toThrow();
      expect(logWarn).toHaveBeenCalledWith('Error in legacy message handler', expect.any(Object));
    });

    it('should skip message handling if parsing returns null', async () => {
      const mockHandler = jest.fn();
      mockEventHandlers.legacyMessageHandlers.add(mockHandler);

      await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      const messageHandler = (mockClient.on as jest.Mock).mock.calls.find(
        call => call[0] === 'group-message'
      )?.[1];

      (WebSocketMessageParser.parse as jest.Mock).mockReturnValue(null);

      messageHandler({ data: 'test' });

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should setup lifecycle handlers for connected event', async () => {
      const mockOnConnected = jest.fn();
      mockEventHandlers.onConnected.add(mockOnConnected);

      await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      const connectedHandler = (mockClient.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connected'
      )?.[1];

      await connectedHandler();

      expect(mockSetConnected).toHaveBeenCalledWith(true);
      expect(mockClearReconnectTimer).toHaveBeenCalled();
      expect(mockResetBackoff).toHaveBeenCalled();
      expect(mockGroupManager.rememberGroup).toHaveBeenCalledWith('test@example.com');
      expect(mockGroupManager.rememberGroup).toHaveBeenCalledWith(WEBSOCKET_GROUPS.PRESENCE);
      expect(mockGroupManager.rejoinAllGroups).toHaveBeenCalledWith(mockClient);
      expect(mockOnConnected).toHaveBeenCalled();
      expect(logInfo).toHaveBeenCalledWith('WebSocket connected', {
        email: 'test@example.com',
      });
    });

    it('should handle errors in connected handlers gracefully', async () => {
      const mockOnConnected = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      mockEventHandlers.onConnected.add(mockOnConnected);

      await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      const connectedHandler = (mockClient.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connected'
      )?.[1];

      await expect(connectedHandler()).resolves.toBeUndefined();
      expect(logWarn).toHaveBeenCalledWith('Error in connected handler', expect.any(Object));
    });

    it('should not remember user email group if email is null', async () => {
      await WebSocketConnectionManager.createClient({
        currentUserEmail: null,
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      const connectedHandler = (mockClient.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connected'
      )?.[1];

      await connectedHandler();

      expect(mockGroupManager.rememberGroup).not.toHaveBeenCalledWith(expect.stringContaining('@'));
      expect(mockGroupManager.rememberGroup).toHaveBeenCalledWith(WEBSOCKET_GROUPS.PRESENCE);
    });

    it('should setup lifecycle handlers for disconnected event', async () => {
      const mockOnDisconnected = jest.fn();
      mockEventHandlers.onDisconnected.add(mockOnDisconnected);

      await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      const disconnectedHandler = (mockClient.on as jest.Mock).mock.calls.find(
        call => call[0] === 'disconnected'
      )?.[1];

      disconnectedHandler();

      expect(mockSetConnected).toHaveBeenCalledWith(false);
      expect(mockOnReconnectNeeded).toHaveBeenCalledWith('ws disconnected');
      expect(mockOnDisconnected).toHaveBeenCalled();
      expect(logInfo).toHaveBeenCalledWith('WebSocket disconnected', {
        email: 'test@example.com',
      });
    });

    it('should handle errors in disconnected handlers gracefully', async () => {
      const mockOnDisconnected = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      mockEventHandlers.onDisconnected.add(mockOnDisconnected);

      await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      const disconnectedHandler = (mockClient.on as jest.Mock).mock.calls.find(
        call => call[0] === 'disconnected'
      )?.[1];

      expect(() => disconnectedHandler()).not.toThrow();
      expect(logWarn).toHaveBeenCalledWith('Error in disconnected handler', expect.any(Object));
    });

    it('should handle handshake errors and retry', async () => {
      const handshakeError = new Error('500 handshake failed');
      mockClient.start.mockRejectedValueOnce(handshakeError);
      mockIsHandshakeErrorFn.mockReturnValue(true);
      mockConnectWithRetryFn.mockImplementationOnce(async (connectFn) => {
        try {
          await connectFn();
        } catch (error) {
          if (mockIsHandshakeErrorFn(error)) {
            throw error;
          }
          throw error;
        }
      });

      await expect(
        WebSocketConnectionManager.createClient({
          currentUserEmail: 'test@example.com',
          groupManager: mockGroupManager,
          eventHandlers: mockEventHandlers,
          onReconnectNeeded: mockOnReconnectNeeded,
          setConnected: mockSetConnected,
          clearReconnectTimer: mockClearReconnectTimer,
          resetBackoff: mockResetBackoff,
          isConnected: mockIsConnected,
        })
      ).rejects.toBe(handshakeError);

      expect(mockIsHandshakeErrorFn).toHaveBeenCalledWith(handshakeError);
    });

    it('should handle non-handshake errors and trigger reconnect', async () => {
      const nonHandshakeError = new Error('Other error');
      mockClient.start.mockRejectedValueOnce(nonHandshakeError);
      mockIsHandshakeErrorFn.mockReturnValue(false);
      mockConnectWithRetryFn.mockImplementationOnce(async (connectFn) => {
        try {
          await connectFn();
        } catch (error) {
          throw error;
        }
      });

      await expect(
        WebSocketConnectionManager.createClient({
          currentUserEmail: 'test@example.com',
          groupManager: mockGroupManager,
          eventHandlers: mockEventHandlers,
          onReconnectNeeded: mockOnReconnectNeeded,
          setConnected: mockSetConnected,
          clearReconnectTimer: mockClearReconnectTimer,
          resetBackoff: mockResetBackoff,
          isConnected: mockIsConnected,
        })
      ).rejects.toBe(nonHandshakeError);

      expect(logError).toHaveBeenCalledWith('Failed to start WebSocket client (non-handshake error)', {
        error: nonHandshakeError,
        email: 'test@example.com',
      });
      expect(mockSetConnected).toHaveBeenCalledWith(false);
      expect(mockOnReconnectNeeded).toHaveBeenCalledWith('start failed');
    });

    it('should use handshake retry manager for connection', async () => {
      await WebSocketConnectionManager.createClient({
        currentUserEmail: 'test@example.com',
        groupManager: mockGroupManager,
        eventHandlers: mockEventHandlers,
        onReconnectNeeded: mockOnReconnectNeeded,
        setConnected: mockSetConnected,
        clearReconnectTimer: mockClearReconnectTimer,
        resetBackoff: mockResetBackoff,
        isConnected: mockIsConnected,
      });

      expect(mockConnectWithRetryFn).toHaveBeenCalled();
      const callArgs = mockConnectWithRetryFn.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Function);
      expect(callArgs[1]).toBe(mockIsConnected);
    });
  });

  describe('stopClient', () => {
    it('should stop client successfully', () => {
      WebSocketConnectionManager.stopClient(mockClient);

      expect(mockClient.stop).toHaveBeenCalled();
      expect(logDebug).toHaveBeenCalledWith('WebSocket client stopped');
    });

    it('should handle stop errors gracefully', () => {
      const stopError = new Error('Stop failed');
      mockClient.stop.mockImplementation(() => {
        throw stopError;
      });

      expect(() => WebSocketConnectionManager.stopClient(mockClient)).not.toThrow();
      expect(logWarn).toHaveBeenCalledWith('Error stopping WebSocket client', {
        error: stopError,
      });
    });

    it('should not throw if client is undefined', () => {
      expect(() => WebSocketConnectionManager.stopClient(undefined)).not.toThrow();
      expect(mockClient.stop).not.toHaveBeenCalled();
    });
  });
});

