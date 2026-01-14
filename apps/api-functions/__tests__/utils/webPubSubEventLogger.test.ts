import { Context } from '@azure/functions';
import { logWebPubSubEvent } from '../../src/utils/webPubSubEventLogger';
import { ServiceContainer } from '../../src/infrastructure/container/ServiceContainer';
import { IErrorLogService } from '../../src/domain/interfaces/IErrorLogService';
import { WebSocketEventRequest } from '../../src/domain/value-objects';
import { ErrorSeverity } from '../../src/domain/enums/ErrorSeverity';
import { ErrorSource } from '../../src/domain/enums/ErrorSource';
import { TestUtils } from '../setup';

const createMockWebSocketEventRequest = (
  userId: string = 'user-1',
  connectionId: string = 'conn-1',
  hub: string = 'test-hub',
  phase: string = 'connected'
): WebSocketEventRequest => {
  return new WebSocketEventRequest(userId, connectionId, hub, phase as any, {});
};

describe('webPubSubEventLogger', () => {
  let mockContext: Context;
  let mockServiceContainer: jest.Mocked<ServiceContainer>;
  let mockErrorLogService: jest.Mocked<IErrorLogService>;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    mockErrorLogService = {
      logError: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockServiceContainer = {
      resolve: jest.fn().mockReturnValue(mockErrorLogService),
    } as any;

    jest.clearAllMocks();
  });

  describe('logWebPubSubEvent', () => {
    it('should log connection event', async () => {
      const request = createMockWebSocketEventRequest();

      await logWebPubSubEvent('connect', request, mockServiceContainer, mockContext);

      expect(mockErrorLogService.logError).toHaveBeenCalledWith({
        severity: ErrorSeverity.Low,
        source: ErrorSource.WebPubSub,
        endpoint: '/api/webpubsub-events',
        functionName: 'WebPubSubEvents',
        error: expect.any(Error),
        userId: 'user-1',
        httpStatusCode: 200,
        context: {
          eventName: 'connect',
          connectionId: 'conn-1',
          hub: 'test-hub',
          phase: 'connected',
          eventType: 'connection',
        },
      });
      expect(mockContext.log.info).toHaveBeenCalledWith(
        expect.stringContaining('[WebPubSubEvent] Logged connect event')
      );
    });

    it('should log connected event', async () => {
      const request = createMockWebSocketEventRequest();

      await logWebPubSubEvent('connected', request, mockServiceContainer, mockContext);

      expect(mockErrorLogService.logError).toHaveBeenCalled();
      const call = mockErrorLogService.logError.mock.calls[0][0];
      expect(call.context?.eventType).toBe('connection');
    });

    it('should log disconnection event', async () => {
      const request = createMockWebSocketEventRequest('user-1', 'conn-1', 'test-hub', 'disconnected');

      await logWebPubSubEvent('disconnected', request, mockServiceContainer, mockContext);

      expect(mockErrorLogService.logError).toHaveBeenCalledWith({
        severity: ErrorSeverity.Low,
        source: ErrorSource.WebPubSub,
        endpoint: '/api/webpubsub-events',
        functionName: 'WebPubSubEvents',
        error: expect.any(Error),
        userId: 'user-1',
        httpStatusCode: 200,
        context: {
          eventName: 'disconnected',
          connectionId: 'conn-1',
          hub: 'test-hub',
          phase: 'disconnected',
          eventType: 'disconnection',
        },
      });
    });

    it('should not log for unknown event types', async () => {
      const request = createMockWebSocketEventRequest('user-1', 'conn-1', 'test-hub', 'unknown');

      await logWebPubSubEvent('unknown', request, mockServiceContainer, mockContext);

      expect(mockErrorLogService.logError).not.toHaveBeenCalled();
    });

    it('should handle user with unknown userId', async () => {
      const request = createMockWebSocketEventRequest('', 'conn-1', 'test-hub', 'connected');
      
      await logWebPubSubEvent('connect', request, mockServiceContainer, mockContext);

      await logWebPubSubEvent('connect', request, mockServiceContainer, mockContext);

      expect(mockErrorLogService.logError).toHaveBeenCalled();
      const call = mockErrorLogService.logError.mock.calls[0][0];
      expect((call.error as Error).message).toContain('unknown');
    });

    it('should use custom endpoint and function name', async () => {
      const request = createMockWebSocketEventRequest();

      await logWebPubSubEvent(
        'connect',
        request,
        mockServiceContainer,
        mockContext,
        '/api/custom',
        'CustomFunction'
      );

      expect(mockErrorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/api/custom',
          functionName: 'CustomFunction',
        })
      );
    });

    it('should handle logging errors gracefully', async () => {
      const request = createMockWebSocketEventRequest();

      mockErrorLogService.logError.mockRejectedValue(new Error('Logging failed'));

      await logWebPubSubEvent('connect', request, mockServiceContainer, mockContext);

      expect(mockContext.log.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WebPubSubEvent] Failed to log event')
      );
    });
  });
});

